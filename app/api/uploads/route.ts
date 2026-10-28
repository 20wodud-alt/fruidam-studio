import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { writeAsset } from "@/lib/asset-store";
import sharp from "sharp";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length")) > 9 * 1024 * 1024) return NextResponse.json({ error: "사진은 한 장에 8MB 이하로 올려주세요." }, { status: 413 });
    const data = await request.formData(); const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "8MB 이하의 이미지 파일이 필요해요." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const processor = sharp(buffer, { limitInputPixels: 40_000_000, animated: false });
    const metadata = await processor.metadata();
    if (!["jpeg", "png", "webp", "avif"].includes(metadata.format ?? "")) return NextResponse.json({ error: "JPG, PNG, WebP, AVIF 사진을 올려주세요." }, { status: 400 });
    const name = `${randomUUID()}.webp`;
    const output = await processor.rotate().resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    await writeAsset(name, output);
    return NextResponse.json({ url: `/api/uploads/${name}` });
  } catch { return NextResponse.json({ error: "사진을 처리하지 못했어요. 다른 이미지로 시도해주세요." }, { status: 400 }); }
}
