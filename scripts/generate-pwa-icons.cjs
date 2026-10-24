const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG encoder in pure Node without external dependencies
function createPNG(width, height, drawFn) {
  // RGBA buffer
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter type: None
    
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const color = drawFn(x, y, width, height);
      rawData[pixelOffset] = color.r;
      rawData[pixelOffset + 1] = color.g;
      rawData[pixelOffset + 2] = color.b;
      rawData[pixelOffset + 3] = color.a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  
  const typeBuf = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBuf, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload), 0);
  
  return Buffer.concat([len, payload, crc]);
}

// Standard CRC32
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

// Drawing function for VogueMe luxury fashion icon:
// Deep rich noir background (#181715), warm sand / gold border, elegant 'V' monogram and sparkle
function drawVogueIcon(x, y, w, h, isMaskable = false) {
  // Center relative coordinates (-1 to 1)
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background: Luxury warm black / espresso (#181715)
  let r = 24, g = 23, b = 21, a = 255;

  // Outer rounded squircle border if not maskable
  if (!isMaskable) {
    const cornerRadius = 0.78;
    const cornerDist = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
    if (cornerDist > 1.0) {
      return { r: 0, g: 0, b: 0, a: 0 }; // Transparent corners for standard icon
    }
  }

  // Golden circular luxury ambient glow
  if (dist < 0.75) {
    const glow = (1 - dist / 0.75) * 0.22;
    r = Math.min(255, Math.round(r + 216 * glow));
    g = Math.min(255, Math.round(g + 199 * glow));
    b = Math.min(255, Math.round(b + 181 * glow));
  }

  // Draw the "V" Monogram
  // Left arm of V: from (-0.42, -0.42) to (0.0, 0.45)
  // Right arm of V: from (0.0, 0.45) to (0.42, -0.42)
  const scale = isMaskable ? 0.75 : 0.88;
  const px = nx / scale;
  const py = ny / scale;

  // Left stroke: thick diagonal
  const distToLeftArm = Math.abs((py - 0.45) - 2.07 * px);
  // Right stroke: medium diagonal
  const distToRightArm = Math.abs((py - 0.45) + 2.07 * px);

  const isInVHeight = py >= -0.45 && py <= 0.48;

  let isV = false;
  if (isInVHeight) {
    // Left diagonal (thick)
    if (px <= 0.08 && distToLeftArm < 0.22) {
      isV = true;
    }
    // Right diagonal (hairline serif)
    if (px >= -0.05 && distToRightArm < 0.12) {
      isV = true;
    }
    // Left serif at top (-0.42, -0.45)
    if (py < -0.38 && Math.abs(px - (-0.40)) < 0.15) {
      isV = true;
    }
    // Right serif at top (0.42, -0.45)
    if (py < -0.38 && Math.abs(px - 0.40) < 0.11) {
      isV = true;
    }
  }

  if (isV) {
    // Champagne gold tone (#F7EFE2)
    return { r: 247, g: 239, b: 226, a: 255 };
  }

  // Sparkle at top-right (px: 0.38, py: -0.30)
  const spX = px - 0.38;
  const spY = py - (-0.28);
  const spDist = Math.sqrt(spX * spX + spY * spY);
  if (spDist < 0.18) {
    // 4-point sparkle star
    const star = (Math.abs(spX) * Math.abs(spY)) < 0.0035 && (Math.abs(spX) < 0.14 || Math.abs(spY) < 0.14);
    if (star || spDist < 0.035) {
      return { r: 255, g: 215, b: 110, a: 255 }; // Golden star highlight
    }
  }

  return { r, g, b, a };
}

// Generate Icons
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating 192x192 PNG...');
const png192 = createPNG(192, 192, (x, y, w, h) => drawVogueIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);

console.log('Generating 512x512 PNG...');
const png512 = createPNG(512, 512, (x, y, w, h) => drawVogueIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

console.log('Generating 512x512 Maskable PNG...');
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawVogueIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), pngMaskable);

console.log('Generating Apple Touch Icon 180x180 PNG...');
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawVogueIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('All PWA icons generated successfully in public/');
