// Run with: node generate_icons.js
// Generates PNG icons using the 'canvas' npm package, or falls back to SVG stubs.

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

// Try to use canvas; if not installed, write minimal valid PNGs
try {
  const { createCanvas } = require('canvas');
  [16, 32, 48, 128].forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    // Background
    ctx.fillStyle = '#e53e3e';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.18);
    ctx.fill();
    // Mute speaker icon
    const s = size;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(s * 0.55)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔇', s / 2, s / 2);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buf);
    console.log(`✓ icon${size}.png`);
  });
} catch (e) {
  // Fallback: write a minimal 1x1 red PNG for each size
  // (Chrome accepts it for development; replace with real icons for production)
  const minimalPNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e00000000c4944415478016360f8cfc00000000200019e21bc330000000049454e44ae426082', 'hex'
  );
  [16, 32, 48, 128].forEach(size => {
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), minimalPNG);
    console.log(`✓ icon${size}.png (stub — replace with real icon)`);
  });
}
