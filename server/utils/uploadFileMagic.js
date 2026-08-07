import fs from 'fs'

const MAGIC = [
  { label: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { label: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { label: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { label: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, also: [0x57, 0x45, 0x42, 0x50], alsoOffset: 8 },
  { label: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
]

function bytesMatch(buf, expected, offset = 0) {
  if (buf.length < offset + expected.length) return false
  return expected.every((byte, index) => buf[offset + index] === byte)
}

/**
 * Lightweight magic-byte check. Returns false when the file does not match
 * the allowed upload kinds (image / pdf).
 */
export function fileMatchesAllowedUploadMagic(filePath, { allowPdf = false } = {}) {
  let fd
  try {
    fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(16)
    const bytesRead = fs.readSync(fd, buf, 0, 16, 0)
    if (bytesRead < 4) return false

    for (const entry of MAGIC) {
      if (entry.label === 'pdf' && !allowPdf) continue
      if (!bytesMatch(buf, entry.bytes, entry.offset || 0)) continue
      if (entry.also && !bytesMatch(buf, entry.also, entry.alsoOffset || 0)) {
        continue
      }
      return true
    }
    return false
  } catch {
    return false
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd)
      } catch {
        /* ignore */
      }
    }
  }
}

export function removeUploadedFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    /* ignore cleanup errors */
  }
}
