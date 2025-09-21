const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUTPUTS = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

const COLORS = {
  head: [184, 124, 82, 255],
  ear: [142, 88, 52, 255],
  innerEar: [215, 160, 125, 255],
  snout: [246, 222, 198, 255],
  nose: [68, 45, 33, 255],
  eyeWhite: [255, 255, 255, 255],
  pupil: [54, 33, 26, 255],
  highlight: [255, 255, 255, 210],
  cheek: [255, 190, 182, 200],
  mouth: [68, 45, 33, 255],
  brow: [120, 74, 45, 200],
  headHighlight: [255, 255, 255, 40],
  noseHighlight: [255, 255, 255, 120],
};

function createDogPixels(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const centerX = size / 2;
  const centerY = size * 0.55;
  const headRadius = size * 0.38 + Math.max(1, size * 0.015);

  const earOffsetX = headRadius * 0.9;
  const earCenterY = centerY - headRadius * 0.95;
  const earRX = headRadius * 0.58;
  const earRY = headRadius * 0.96;

  fillEllipse(data, size, centerX - earOffsetX, earCenterY, earRX, earRY, COLORS.ear);
  fillEllipse(data, size, centerX + earOffsetX, earCenterY, earRX, earRY, COLORS.ear);

  fillEllipse(data, size, centerX - earOffsetX, earCenterY + earRY * 0.1, earRX * 0.55, earRY * 0.55, COLORS.innerEar);
  fillEllipse(data, size, centerX + earOffsetX, earCenterY + earRY * 0.1, earRX * 0.55, earRY * 0.55, COLORS.innerEar);

  fillCircle(data, size, centerX, centerY, headRadius, COLORS.head);

  fillEllipse(data, size, centerX, centerY - headRadius * 0.55, headRadius * 0.75, headRadius * 0.45, COLORS.headHighlight);

  const snoutRX = headRadius * 0.68;
  const snoutRY = headRadius * 0.5;
  const snoutCenterY = centerY + headRadius * 0.28;
  fillEllipse(data, size, centerX, snoutCenterY, snoutRX, snoutRY, COLORS.snout);

  fillEllipse(data, size, centerX, snoutCenterY - snoutRY * 0.25, snoutRX * 0.7, snoutRY * 0.45, [255, 255, 255, 55]);

  const cheekOffsetX = headRadius * 0.56;
  const cheekCenterY = centerY + headRadius * 0.35;
  const cheekRX = headRadius * 0.32;
  const cheekRY = headRadius * 0.22;
  fillEllipse(data, size, centerX - cheekOffsetX, cheekCenterY, cheekRX, cheekRY, COLORS.cheek);
  fillEllipse(data, size, centerX + cheekOffsetX, cheekCenterY, cheekRX, cheekRY, COLORS.cheek);

  const eyeOffsetX = headRadius * 0.45;
  const eyeCenterY = centerY - headRadius * 0.12;
  const eyeRadius = Math.max(size * 0.07, 2.2);
  fillCircle(data, size, centerX - eyeOffsetX, eyeCenterY, eyeRadius, COLORS.eyeWhite);
  fillCircle(data, size, centerX + eyeOffsetX, eyeCenterY, eyeRadius, COLORS.eyeWhite);

  const pupilRadius = Math.max(size * 0.035, 1.4);
  fillCircle(data, size, centerX - eyeOffsetX * 0.92, eyeCenterY, pupilRadius, COLORS.pupil);
  fillCircle(data, size, centerX + eyeOffsetX * 0.92, eyeCenterY, pupilRadius, COLORS.pupil);

  const highlightRadius = Math.max(size * 0.022, 0.8);
  fillCircle(data, size, centerX - eyeOffsetX * 0.92 - highlightRadius * 0.4, eyeCenterY - highlightRadius * 1.2, highlightRadius, COLORS.highlight);
  fillCircle(data, size, centerX + eyeOffsetX * 0.92 - highlightRadius * 0.4, eyeCenterY - highlightRadius * 1.2, highlightRadius, COLORS.highlight);

  const browY = eyeCenterY - headRadius * 0.32;
  const browRX = headRadius * 0.22;
  const browRY = headRadius * 0.09;
  fillEllipse(data, size, centerX - eyeOffsetX, browY, browRX, browRY, COLORS.brow);
  fillEllipse(data, size, centerX + eyeOffsetX, browY, browRX, browRY, COLORS.brow);

  const noseRX = headRadius * 0.22;
  const noseRY = headRadius * 0.18;
  const noseCenterY = centerY + headRadius * 0.12;
  fillEllipse(data, size, centerX, noseCenterY, noseRX, noseRY, COLORS.nose);
  fillCircle(data, size, centerX - noseRX * 0.3, noseCenterY - noseRY * 0.25, Math.max(1, size * 0.018), COLORS.noseHighlight);

  const bridgeHeight = headRadius * 0.22;
  drawLine(data, size, centerX, noseCenterY + noseRY * 0.4, centerX, noseCenterY + bridgeHeight, COLORS.mouth, Math.max(1, size * 0.01));

  const mouthY = centerY + headRadius * 0.5;
  const mouthWidth = headRadius * 0.58;
  const mouthThickness = Math.max(1, size * 0.02);
  drawSmile(data, size, centerX, mouthY, mouthWidth, mouthThickness, COLORS.mouth);

  return data;
}

function drawSmile(data, size, cx, cy, halfWidth, thickness, color) {
  const startX = Math.max(0, Math.floor(cx - halfWidth));
  const endX = Math.min(size - 1, Math.ceil(cx + halfWidth));
  const intThickness = Math.max(1, Math.round(thickness));
  for (let x = startX; x <= endX; x++) {
    const t = (x - cx) / halfWidth;
    if (Math.abs(t) > 1) {
      continue;
    }
    const curve = Math.pow(Math.abs(t), 1.6);
    const base = cy - thickness * 0.65;
    const y = base + (1 - curve) * thickness;
    for (let offset = 0; offset < intThickness; offset++) {
      blendPixel(data, size, x, Math.round(y + offset), color);
    }
  }
  blendPixel(data, size, Math.round(cx - halfWidth), Math.round(cy - thickness * 0.3), color);
  blendPixel(data, size, Math.round(cx + halfWidth), Math.round(cy - thickness * 0.3), color);
}

function drawLine(data, size, x0, y0, x1, y1, color, width) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - x);
  const dy = Math.abs(endY - y);
  const sx = x < endX ? 1 : -1;
  const sy = y < endY ? 1 : -1;
  let err = dx - dy;
  const radius = Math.max(0, Math.round(width / 2));
  while (true) {
    stampCircle(data, size, x, y, color, radius);
    if (x === endX && y === endY) {
      break;
    }
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function stampCircle(data, size, cx, cy, color, radius) {
  const r = Math.max(0, radius);
  const minX = Math.max(0, Math.floor(cx - r - 1));
  const maxX = Math.min(size - 1, Math.ceil(cx + r + 1));
  const minY = Math.max(0, Math.floor(cy - r - 1));
  const maxY = Math.min(size - 1, Math.ceil(cy + r + 1));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= (r + 0.3) * (r + 0.3)) {
        blendPixel(data, size, x, y, color);
      }
    }
  }
  if (r === 0) {
    blendPixel(data, size, cx, cy, color);
  }
}

function fillCircle(data, size, cx, cy, radius, color) {
  fillEllipse(data, size, cx, cy, radius, radius, color);
}

function fillEllipse(data, size, cx, cy, rx, ry, color) {
  if (rx <= 0 || ry <= 0) {
    return;
  }
  const minX = Math.max(0, Math.floor(cx - rx - 1));
  const maxX = Math.min(size - 1, Math.ceil(cx + rx + 1));
  const minY = Math.max(0, Math.floor(cy - ry - 1));
  const maxY = Math.min(size - 1, Math.ceil(cy + ry + 1));
  const invRx = 1 / (rx * rx);
  const invRy = 1 / (ry * ry);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const value = dx * dx * invRx + dy * dy * invRy;
      if (value <= 1) {
        blendPixel(data, size, x, y, color);
      }
    }
  }
}

function blendPixel(data, size, x, y, color) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || xi >= size || yi < 0 || yi >= size) {
    return;
  }
  const idx = (yi * size + xi) * 4;
  const srcA = color[3] / 255;
  if (srcA <= 0) {
    return;
  }
  const dstA = data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  const newAlpha = Math.round(outA * 255);
  if (newAlpha === 0) {
    data[idx] = 0;
    data[idx + 1] = 0;
    data[idx + 2] = 0;
    data[idx + 3] = 0;
    return;
  }
  const srcFactor = srcA / outA;
  const dstFactor = dstA * (1 - srcA) / outA;
  data[idx] = Math.round(color[0] * srcFactor + data[idx] * dstFactor);
  data[idx + 1] = Math.round(color[1] * srcFactor + data[idx + 1] * dstFactor);
  data[idx + 2] = Math.round(color[2] * srcFactor + data[idx + 2] * dstFactor);
  data[idx + 3] = newAlpha;
}

function createPngBuffer(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const startRaw = y * (stride + 1);
    raw[startRaw] = 0;
    const startPixel = y * stride;
    pixels.copy(raw, startRaw + 1, startPixel, startPixel + stride);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });

  const chunks = [
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idat),
    createChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat(chunks);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  const crcBuffer = Buffer.concat([typeBuffer, data]);
  chunk.writeUInt32BE(crc32(crcBuffer), 8 + data.length);
  return chunk;
}

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  OUTPUTS.forEach(({ size, name }) => {
    const pixelData = createDogPixels(size);
    const png = createPngBuffer(size, size, Buffer.from(pixelData));
    const outputPath = path.join(__dirname, name);
    ensureDirectory(outputPath);
    fs.writeFileSync(outputPath, png);
    console.log('Generated ' + name + ' (' + size + 'x' + size + ')');
  });
}

main();
