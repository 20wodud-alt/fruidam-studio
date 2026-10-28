import { readAsset, writeAsset } from "@/lib/asset-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const runtime = "nodejs";

// Local image processing only. User paths and remote URLs are never accepted.
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length")) > 4096) throw new Error("input");
    const input = await request.json();
    if (typeof input.image !== "string" || !["crop", "sharpen", "background"].includes(input.action)) throw new Error("input");
    const filename = /^\/api\/uploads\/([a-f0-9-]+\.webp)$/.exec(input.image)?.[1];
    const sample = input.image === "/sample-product.svg";
    if (!filename && !sample) return Response.json({ error: "내 컴퓨터에 업로드한 이미지를 선택해주세요." }, { status: 400 });
    const source = sample ? await fs.readFile(path.join(process.cwd(), "public", "sample-product.svg")) : await readAsset(filename!);
    const base = sharp(source, { limitInputPixels: 40_000_000 }).rotate();
    let output: Buffer;
    if (input.action === "crop") {
      const rect = input.rect;
      if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(v => typeof v === "number" && Number.isFinite(v)) || rect.x < 0 || rect.y < 0 || rect.width < 5 || rect.height < 5 || rect.x + rect.width > 100.01 || rect.y + rect.height > 100.01) throw new Error("crop");
      const { data, info } = await base.toBuffer({ resolveWithObject: true });
      const left = Math.floor(info.width * rect.x / 100), top = Math.floor(info.height * rect.y / 100);
      output = await sharp(data).extract({ left, top, width: Math.max(1, Math.min(info.width - left, Math.round(info.width * rect.width / 100))), height: Math.max(1, Math.min(info.height - top, Math.round(info.height * rect.height / 100))) }).webp({ quality: 95, alphaQuality: 100 }).toBuffer();
    } else if (input.action === "sharpen") {
      output = await base.sharpen({ sigma: 1, m1: .7, m2: 1.4 }).webp({ quality: 95, alphaQuality: 100 }).toBuffer();
    } else {
      if (typeof input.color !== "string" || !/^#[0-9a-f]{6}$/i.test(input.color) || typeof input.tolerance !== "number" || !Number.isFinite(input.tolerance) || input.tolerance < 5 || input.tolerance > 100) throw new Error("background");
      const { data, info } = await base.resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { width, height, channels } = info;
      const rgb = [1, 3, 5].map(index => parseInt(input.color.slice(index, index + 2), 16));
      const seen = new Uint8Array(width * height), queue = new Uint32Array(width * height);
      let start = 0, end = 0, removed = 0;
      function add(index: number) {
        if (seen[index]) return;
        seen[index] = 1;
        const offset = index * channels;
        const distance = Math.sqrt(rgb.reduce((sum, value, channel) => sum + (data[offset + channel] - value) ** 2, 0) / 3);
        if (distance > input.tolerance && data[offset + 3] !== 0) return;
        queue[end++] = index;
      }
      for (let x = 0; x < width; x++) { add(x); add((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { add(y * width); add(y * width + width - 1); }
      while (start < end) {
        const index = queue[start++], x = index % width, y = Math.floor(index / width);
        if (data[index * channels + 3]) removed++;
        data[index * channels + 3] = 0;
        if (x > 0) add(index - 1); if (x < width - 1) add(index + 1); if (y > 0) add(index - width); if (y < height - 1) add(index + width);
      }
      if (!removed) return Response.json({ error: "선택한 색과 연결된 배경이 없어요. 배경색과 허용 범위를 조절해주세요." }, { status: 400 });
      if (removed > width * height * .95) return Response.json({ error: "사진 대부분이 지워져요. 허용 범위를 줄여주세요." }, { status: 400 });
      output = await sharp(data, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toBuffer();
    }
    const name = `${randomUUID()}.webp`;
    await writeAsset(name, output);
    // Keep AI provenance and project ownership for derivatives when available.
    if (filename) {
      try {
        const meta = JSON.parse((await readAsset(`${filename}.json`)).toString("utf8"));
        if (meta.source === "ai" && meta.projectId) await writeAsset(`${name}.json`, Buffer.from(JSON.stringify({ ...meta, url: `/api/uploads/${name}` })));
      } catch { /* Original uploads need no AI metadata. */ }
    }
    return Response.json({ url: `/api/uploads/${name}` });
  } catch { return Response.json({ error: "사진을 처리하지 못했어요. 이미지와 편집 범위를 확인해주세요." }, { status: 400 }); }
}
