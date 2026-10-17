import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 implementation
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function generateIconPNG(size: number, isMaskable: boolean = false): Buffer {
  // Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw image data with scanline filter byte (0) per row
  const rawData = Buffer.alloc(size * (1 + size * 4));
  let offset = 0;

  const center = size / 2;
  const maxRadius = isMaskable ? size * 0.38 : size * 0.44;

  for (let y = 0; y < size; y++) {
    rawData[offset++] = 0; // No filter for this row
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Deep Slate Navy (#090d16 -> R:9, G:13, B:22)
      let r = 9;
      let g = 13;
      let b = 22;
      let a = 255;

      // Outer Glow / Ring
      if (dist < maxRadius + 6 && dist >= maxRadius) {
        // Cyan / Purple glow border
        r = 139; g = 92; b = 246; a = 255; // #8b5cf6
      } else if (dist < maxRadius) {
        // Inner circle: Tech gradient from purple to indigo
        const t = (x + y) / (size * 2);
        r = Math.floor(30 + t * 90);
        g = Math.floor(20 + t * 60);
        b = Math.floor(70 + t * 140);
        
        // Chip square in the middle
        const chipHalf = size * 0.18;
        if (Math.abs(dx) <= chipHalf && Math.abs(dy) <= chipHalf) {
          // Microchip body
          r = 20; g = 25; b = 45;
          // Chip inner core with glowing amber/cyan
          if (Math.abs(dx) <= chipHalf * 0.6 && Math.abs(dy) <= chipHalf * 0.6) {
            r = 245; g = 158; b = 11; // Amber #f59e0b
          }
        }

        // Chip Pins (horizontal & vertical trace lines)
        if (
          (Math.abs(dx) < size * 0.28 && Math.abs(Math.abs(dy) - chipHalf * 0.5) < 2) ||
          (Math.abs(dy) < size * 0.28 && Math.abs(Math.abs(dx) - chipHalf * 0.5) < 2)
        ) {
          r = 56; g = 189; b = 248; // Cyan #38bdf8
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate IDAT
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PNG files
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateIconPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateIconPNG(180, false));

console.log('Successfully generated PWA icon PNGs in public/ directory!');
