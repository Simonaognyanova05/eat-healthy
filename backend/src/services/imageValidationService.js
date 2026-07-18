const MAX_BYTES = 10 * 1024 * 1024;

const signatures = [
  { mime: "image/jpeg", matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", matches: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  { mime: "image/webp", matches: (b) => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" }
];

export function validateImage(buffer, declaredMime) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_BYTES) return null;
  const detected = signatures.find(({ matches }) => matches(buffer));
  if (!detected || detected.mime !== declaredMime) return null;
  return { mime: detected.mime, bytes: buffer.length };
}

export { MAX_BYTES };
