export function getValidImageSrc(src, fallback = "/product.png") {
  if (!src) return fallback;

  // If it's already a full URL (http/https), allow it
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // If it starts with "/" (public folder path), allow it
  if (src.startsWith("/")) {
    return src;
  }

  return fallback;
}
