// Explicit local paths only; shared by validation and server image processing.
const files: Record<string,string> = {
  "/photos/fruit-apple.webp":"photos/fruit-apple.webp",
  "/photos/fruit-citrus.webp":"photos/fruit-citrus.webp",
  "/photos/fruit-grape.webp":"photos/fruit-grape.webp",
  "/photos/fruit-orchard.webp":"photos/fruit-orchard.webp",
  "/fruit-apple.svg":"fruit-apple.svg",
  "/fruit-citrus.svg":"fruit-citrus.svg",
  "/fruit-grape.svg":"fruit-grape.svg",
  "/sample-product.svg":"sample-product.svg",
  "/sample-detail.svg":"sample-detail.svg",
};
export function sampleImageFile(url:string):string|undefined {return Object.hasOwn(files,url)?files[url]:undefined;}
