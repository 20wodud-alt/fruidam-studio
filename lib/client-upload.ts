"use client";

// Stay below Vercel's request body limit, including multipart overhead.
// This is local browser image processing, never an AI request.
export async function prepareImageUpload(file: File): Promise<File> {
  if (!file.size || file.size > 8 * 1024 * 1024) throw new Error("사진은 8MB 이하로 올려주세요.");
  if (file.size <= 4_000_000) return file;
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new Error("큰 사진을 변환하지 못했어요. JPG·PNG·WebP 형식으로 다시 저장해주세요."); }
  try {
    const scale = Math.min(1, 1800 / bitmap.width, 2400 / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("사진 변환을 준비하지 못했어요.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [.9, .8, .7]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= 4_000_000) return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: file.lastModified });
    }
    throw new Error("사진 용량을 줄이지 못했어요. 크기를 줄인 사진을 다시 올려주세요.");
  } finally { bitmap.close(); }
}
