// Renders the iOS and Android app icons and splash screens from public/icon.svg, in the app's
// light and dark colors. Run it again after the icon changes: npm run native-assets
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import { Resvg } from '@resvg/resvg-js';

const BG = { light: '#f5efe2', dark: '#0a1124' }; // --bg in src/styles.css
const LINE_DARK = '#232e4b'; // --line in the dark theme

const icon = readFileSync('public/icon.svg', 'utf8');
const tile = icon.match(/<rect width="512" height="512" rx="\d+" fill="(#[0-9a-f]{6})"\/>/i);
if (!tile || !icon.includes('id="wax"')) throw new Error('public/icon.svg changed shape: update scripts/native-assets.mjs');
const inner = icon.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const art = inner.replace(tile[0], ''); // the candle and its glow, without the tile behind them
const svg = (viewBox, body, size = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${size}>${body}</svg>`;

/** PNG bytes for an SVG at w × h. Opaque images drop the alpha channel, which the App Store requires of icons. */
function render(source, w, h = w, { alpha = false } = {}) {
  const img = new Resvg(source, { fitTo: { mode: 'width', value: w } }).render();
  if (img.width !== w || img.height !== h) throw new Error(`rendered ${img.width}×${img.height}, wanted ${w}×${h}`);
  if (alpha) return img.asPng();
  // Raw pixels are premultiplied RGBA, which equals plain RGB wherever the image is opaque.
  const px = img.pixels; // a getter that copies the whole image, so read it once
  const rows = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (px[i + 3] !== 255) throw new Error('an opaque image has a transparent pixel');
      px.copy(rows, y * (w * 3 + 1) + 1 + x * 3, i, i + 3);
    }
  }
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length);
    head.write(type, 4);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function write(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  console.log(path);
}

/** The icon tile centred on a w × h page, `share` of the shorter side wide. In the dark the tile matches the page, so a hairline shows its edge. */
function splash(mode, w, h, share) {
  const s = Math.round(Math.min(w, h) * share);
  const edge = mode === 'dark' ? `<rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="${LINE_DARK}" stroke-width="4"/>` : '';
  const logo = `<svg x="${(w - s) / 2}" y="${(h - s) / 2}" width="${s}" height="${s}" viewBox="0 0 512 512">${inner}${edge}</svg>`;
  return svg(`0 0 ${w} ${h}`, `<rect width="${w}" height="${h}" fill="${BG[mode]}"/>${logo}`, `width="${w}" height="${h}"`);
}

// ---------- iOS ----------
const IOS = 'ios/App/App/Assets.xcassets';

// One 1024 px square; iOS rounds the corners itself.
write(`${IOS}/AppIcon.appiconset/AppIcon-512@2x.png`, render(svg('0 0 512 512', `<rect width="512" height="512" fill="${tile[1]}"/>${art}`), 1024));

// The launch screen fills the screen with this square, cropping the sides.
rmSync(`${IOS}/Splash.imageset`, { recursive: true, force: true });
const images = [];
for (const mode of ['light', 'dark']) {
  const png = render(splash(mode, 2732, 2732, 0.15), 2732);
  for (const scale of ['1x', '2x', '3x']) {
    const filename = `splash${mode === 'dark' ? '-dark' : ''}-2732x2732@${scale}.png`;
    write(`${IOS}/Splash.imageset/${filename}`, png);
    images.push({ idiom: 'universal', filename, scale, ...(mode === 'dark' && { appearances: [{ appearance: 'luminosity', value: 'dark' }] }) });
  }
}
write(`${IOS}/Splash.imageset/Contents.json`, JSON.stringify({ images, info: { version: 1, author: 'xcode' } }, null, 2) + '\n');

// ---------- Android ----------
const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

for (const [d, k] of Object.entries(DENSITIES)) {
  // Before Android 8: the tile as it is, and cut to a circle.
  write(`${RES}/mipmap-${d}/ic_launcher.png`, render(icon, 48 * k, 48 * k, { alpha: true }));
  const round = `<clipPath id="round"><circle cx="256" cy="256" r="256"/></clipPath><g clip-path="url(#round)">${inner}</g>`;
  write(`${RES}/mipmap-${d}/ic_launcher_round.png`, render(svg('0 0 512 512', round), 48 * k, 48 * k, { alpha: true }));
  // Android 8+: an adaptive icon's 108 dp foreground, of which the middle 72 dp shows. The tile maps
  // to those 72 dp, and the candle runs on past the bottom so masks and parallax never show its end.
  const candle = `${art}<rect x="220" y="500" width="72" height="140" fill="url(#wax)"/>`;
  write(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, render(svg('-128 -128 768 768', candle), 108 * k, 108 * k, { alpha: true }));
}

// Splash before Android 12 (later versions show the launcher icon on windowSplashScreenBackground).
const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const mode of ['light', 'dark']) {
  const night = mode === 'dark' ? '-night' : '';
  write(`${RES}/drawable${night}/splash.png`, render(splash(mode, 480, 320, 0.25), 480, 320));
  for (const [d, [w, h]] of Object.entries(SPLASH)) {
    write(`${RES}/drawable-port${night}-${d}/splash.png`, render(splash(mode, w, h, 0.25), w, h));
    write(`${RES}/drawable-land${night}-${d}/splash.png`, render(splash(mode, h, w, 0.25), h, w));
  }
}
