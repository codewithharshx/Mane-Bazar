const randomSegment = () => {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

export const createIdempotencyKey = (scope = "request") => {
  const normalizedScope = String(scope || "request")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 24);

  return `${normalizedScope}-${Date.now().toString(36)}-${randomSegment()}`;
};
