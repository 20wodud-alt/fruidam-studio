"use client";
import { escapeExportHtml, marketProfiles, tileEnd, type MarketImageFormat, type MarketPlatform, type TextBand } from "./market-export";

type ExportFile = { name: string; width: number; height: number; bytes: number };
export async function exportMarketImages(element: HTMLElement, platform: MarketPlatform, format: MarketImageFormat, fontCSS: string, title: string, progress: (message: string) => void) {
  const profile = marketProfiles[platform], scale = profile.width / 860;
  const rect = element.getBoundingClientRect(), total = Math.ceil(element.scrollHeight * scale);
  if (!total) throw new Error("내보낼 상세페이지가 없어요.");
  const boundaries = Array.from(element.querySelectorAll<HTMLElement>(".dp-section")).map(s => Math.ceil((s.getBoundingClientRect().bottom - rect.top) * scale));
  const textBands: TextBand[] = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) if (r.height > 0 && r.width > 0) textBands.push({ top: (r.top - rect.top) * scale, bottom: (r.bottom - rect.top) * scale });
  }
  progress("사진과 글꼴을 준비하고 있어요.");
  const clone = element.cloneNode(true) as HTMLElement;
  const embedded = new Map<string, string>();
  for (const img of Array.from(clone.querySelectorAll("img"))) {
    const source = img.src;
    if (!embedded.has(source)) {
      const response = await fetch(source); if (!response.ok) throw new Error("사진을 내보내지 못했어요.");
      const blob = await response.blob();
      embedded.set(source, await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("사진을 읽지 못했어요.")); reader.readAsDataURL(blob); }));
    }
    img.src = embedded.get(source)!;
    img.removeAttribute("loading");
  }
  const { toCanvas } = await import("html-to-image"), { default: JSZip } = await import("jszip");
  const viewport = document.createElement("div");
  Object.assign(viewport.style, { position: "fixed", left: "-10000px", top: "0", width: `${profile.width}px`, overflow: "hidden", background: "#fff", pointerEvents: "none" });
  viewport.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, { position: "absolute", left: "0", top: "0", margin: "0", width: "860px", transformOrigin: "top left" });
  viewport.append(clone); document.body.append(viewport);
  const zip = new JSZip(), files: ExportFile[] = [];
  try {
    await Promise.all(Array.from(clone.querySelectorAll("img")).map(img => img.decode()));
    let start = 0;
    while (start < total) {
      let end = tileEnd(start, profile.maxHeight, total, boundaries, textBands), blob: Blob | null = null;
      while (!blob) {
        const height = end - start;
        progress(`${files.length + 1}번째 이미지 생성 중 · ${Math.floor(start / total * 100)}%`);
        viewport.style.height = `${height}px`;
        clone.style.transform = `translateY(-${start}px) scale(${scale})`;
        // Reset logical insets too: Chromium serializes the offscreen left as
        // inset-inline, which otherwise moves the exported clone outside the SVG.
        const canvas = await toCanvas(viewport, { pixelRatio: 1, width: profile.width, height, canvasWidth: profile.width, canvasHeight: height, backgroundColor: "#fff", fontEmbedCSS: fontCSS, skipAutoScale: true, style: { position: "relative", inset: "auto", insetInline: "auto", insetBlock: "auto", left: "0", top: "0", right: "auto", bottom: "auto", margin: "0" } });
        const encoded = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, format === "jpg" ? "image/jpeg" : "image/png", .94));
        canvas.width = canvas.height = 1;
        if (!encoded) throw new Error("이미지를 만들지 못했어요. 다시 다운로드해주세요.");
        if (encoded.size <= profile.maxBytes) blob = encoded;
        else {
          if (height <= 128) throw new Error("이미지 용량을 줄이지 못했어요. JPG 형식으로 다운로드해주세요.");
          end = tileEnd(start, Math.max(64, Math.floor(height / 2)), total, boundaries, textBands);
        }
      }
      const name = `${platform}_${String(files.length + 1).padStart(3, "0")}.${format}`;
      zip.file(name, await blob.arrayBuffer());
      files.push({ name, width: profile.width, height: end - start, bytes: blob.size }); start = end;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
    const preview = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeExportHtml(title)}</title><style>body{margin:0;background:white}main{width:${profile.width}px;max-width:100%;margin:auto}img{display:block;width:100%;height:auto;border:0}</style></head><body><main>${files.map(f => `<img src="${f.name}" width="${f.width}" height="${f.height}" alt="상세설명 ${escapeExportHtml(f.name)}">`).join("")}</main></body></html>`;
    zip.file("preview.html", preview);
    zip.file("image-info.json", JSON.stringify({ platform, width: profile.width, format, totalHeight: total, files }, null, 2));
    zip.file("업로드 안내.txt", `${profile.name} 상세설명용 이미지\n상품: ${title}\n가로 ${profile.width}px / ${files.length}장 / ${format.toUpperCase()}\n\n1. ZIP 압축을 풀어주세요.\n2. 판매자센터의 상품 상세설명에 ${platform}_001부터 번호순으로 이미지를 올려주세요.\n3. 등록 전 PC·모바일 미리보기에서 순서와 잘림을 확인해주세요.\n\npreview.html은 내려받은 이미지의 오프라인 확인용입니다. 판매자센터에 HTML 파일을 올리는 기능이 아닙니다.\n\n${profile.note}\n앱 분할 기준: 이미지당 세로 최대 ${profile.maxHeight}px, 용량 ${profile.maxBytes.toLocaleString()}바이트 이하. 플랫폼의 필수 최대 규격을 뜻하지 않습니다.\n스마트스토어: 상품 상세설명 권장 가로 848px, 장당 최대 20MB(공식 고객센터 2026-10-27 확인).\n쿠팡: 780px는 출력 프리셋입니다. WING 등록 화면의 상세설명 이미지 안내를 우선하세요.\n공식 안내: ${profile.source}\n이 파일은 상세설명용이며 대표·썸네일 이미지 규격과 다릅니다.\n`);
    progress(`${files.length}개 이미지의 크기·용량 확인 완료 · ZIP 압축 중`);
    return { blob: await zip.generateAsync({ type: "blob", compression: "STORE" }), count: files.length };
  } finally { viewport.remove(); }
}
