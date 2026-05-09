import { describe, expect, it } from "vitest";
import { MAX_BYTES, sniffMime, validateImage } from "@/lib/uploads";

function bytes(values: number[], totalLen = values.length): Uint8Array {
  const buf = new Uint8Array(totalLen);
  buf.set(values.slice(0, totalLen));
  return buf;
}

describe("sniffMime", () => {
  it("detects PNG from magic header", () => {
    const png = bytes(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00],
      16,
    );
    expect(sniffMime(png)).toBe("image/png");
  });

  it("detects JPEG from magic header", () => {
    const jpeg = bytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0, 0, 0, 0], 32);
    expect(sniffMime(jpeg)).toBe("image/jpeg");
  });

  it("detects WEBP from RIFF/WEBP chunks", () => {
    const webp = bytes(
      [
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size (ignored)
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8 chunk
      ],
      32,
    );
    expect(sniffMime(webp)).toBe("image/webp");
  });

  it("rejects buffers that are too short to sniff", () => {
    expect(sniffMime(bytes([0xff, 0xd8]))).toBeNull();
  });

  it("rejects unknown formats (e.g. GIF, PDF, plain text)", () => {
    const gif = bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0], 16);
    const pdf = bytes([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0], 16);
    const txt = bytes([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x0a, 0, 0, 0, 0, 0, 0], 16);

    expect(sniffMime(gif)).toBeNull();
    expect(sniffMime(pdf)).toBeNull();
    expect(sniffMime(txt)).toBeNull();
  });

  it("does not confuse a RIFF wave header for a webp", () => {
    const wav = bytes(
      [
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, // WAVE, not WEBP
        0, 0, 0, 0,
      ],
      32,
    );
    expect(sniffMime(wav)).toBeNull();
  });
});

describe("validateImage", () => {
  it("accepts a valid image and reports its mime + size", () => {
    const png = bytes(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0],
      32,
    );
    const result = validateImage(png);
    expect(result.mime).toBe("image/png");
    expect(result.bytes).toBe(32);
  });

  it("rejects buffers larger than MAX_BYTES", () => {
    // Build a buffer 1 byte over the cap; first 8 bytes are PNG magic so the
    // size check is what fails (not the MIME sniff).
    const oversized = new Uint8Array(MAX_BYTES + 1);
    oversized.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => validateImage(oversized)).toThrow("too_large");
  });

  it("rejects buffers whose MIME cannot be sniffed", () => {
    const garbage = bytes([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0, 0, 0, 0], 16);
    expect(() => validateImage(garbage)).toThrow("unsupported_mime");
  });
});
