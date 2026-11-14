// Builds public/og-image.jpg — the picture WhatsApp, X, LinkedIn and Facebook
// show when someone shares a LivoraPulse link (1200×630, the standard size).
//
//   node scripts/og-image.mjs
//
// Needs `sharp`, which isn't a project dependency (it's only needed here):
//   npm i --no-save sharp && node scripts/og-image.mjs
// then bump ?v= on og:image in index.html so apps fetch the new picture.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public/og-image.jpg')

// Logo: the figures + wordmark from logos/1.svg, cropped to its content.
const logoPng = await sharp(path.join(root, 'public/logos/1.svg'))
  .resize(560)
  .extract({ left: 90, top: 90, width: 380, height: 360 })
  .png()
  .toBuffer()
const logo = `data:image/png;base64,${logoPng.toString('base64')}`

const GREEN = '#00BF63'
const INK = '#14201A'
const MUTED = '#5B6B62'
const FONT = "Segoe UI, Helvetica, Arial, sans-serif"

const dims = [
  ['Physical', 78, '#22C55E'],
  ['Nutrition', 65, '#F97316'],
  ['Digital', 82, '#0EA5E9'],
  ['Productivity', 70, '#6366F1'],
  ['Eco', 88, '#10B981'],
  ['Mood', 74, '#EC4899'],
]

// Score ring: 84 / 100
const r = 58, c = 2 * Math.PI * r, score = 84
const ring = `
  <circle cx="0" cy="0" r="${r}" fill="none" stroke="#E7EFEA" stroke-width="14"/>
  <circle cx="0" cy="0" r="${r}" fill="none" stroke="${GREEN}" stroke-width="14" stroke-linecap="round"
    stroke-dasharray="${(c * score) / 100} ${c}" transform="rotate(-90)"/>
  <text x="0" y="14" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="800" fill="${INK}">${score}</text>
  <text x="0" y="38" text-anchor="middle" font-family="${FONT}" font-size="15" fill="${MUTED}">/ 100</text>`

const bars = dims.map(([name, v, col], i) => {
  const y = 190 + i * 40
  return `
  <text x="32" y="${y}" font-family="${FONT}" font-size="17" font-weight="600" fill="${INK}">${name}</text>
  <text x="348" y="${y}" text-anchor="end" font-family="${FONT}" font-size="17" font-weight="700" fill="${MUTED}">${v}</text>
  <rect x="32" y="${y + 10}" width="316" height="8" rx="4" fill="#EEF2EF"/>
  <rect x="32" y="${y + 10}" width="${(316 * v) / 100}" height="8" rx="4" fill="${col}"/>`
}).join('')

const chips = ['Kenyan food', 'Focus', 'Mood', 'Activity', 'Eco'].reduce((acc, label) => {
  const w = label.length * 11 + 36
  acc.svg += `
  <rect x="${acc.x}" y="0" width="${w}" height="44" rx="22" fill="#FFFFFF" stroke="#D7E7DD"/>
  <text x="${acc.x + w / 2}" y="29" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="600" fill="${INK}">${label}</text>`
  acc.x += w + 10
  return acc
}, { x: 0, svg: '' }).svg

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FDF7F5"/><stop offset="1" stop-color="#E9F7EF"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0B3D23" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="220" fill="${GREEN}" opacity="0.07"/>
  <circle cx="760" cy="640" r="160" fill="${GREEN}" opacity="0.06"/>

  <!-- Left: brand + message -->
  <image href="${logo}" x="52" y="34" width="190" height="180"/>
  <text x="64" y="292" font-family="${FONT}" font-size="58" font-weight="800" fill="${INK}">Wellness that fits</text>
  <text x="64" y="360" font-family="${FONT}" font-size="58" font-weight="800" fill="${INK}">your <tspan fill="${GREEN}">life.</tspan></text>
  <text x="66" y="414" font-family="${FONT}" font-size="24" fill="${MUTED}">Activity, Kenyan food, focus, mood and eco habits —</text>
  <text x="66" y="446" font-family="${FONT}" font-size="24" fill="${MUTED}">all in one daily LifePulse Score.</text>
  <g transform="translate(64 486)">${chips}</g>
  <text x="66" y="586" font-family="${FONT}" font-size="20" font-weight="700" fill="${GREEN}">Built for Kenya · Free to start · livorapulse.netlify.app</text>

  <!-- Right: score card -->
  <g transform="translate(770 70)" filter="url(#shadow)">
    <rect width="380" height="460" rx="28" fill="#FFFFFF"/>
  </g>
  <g transform="translate(770 70)">
    <text x="32" y="50" font-family="${FONT}" font-size="15" font-weight="700" fill="${MUTED}" letter-spacing="1.5">TODAY'S LIFEPULSE</text>
    <g transform="translate(290 96)">${ring}</g>
    <text x="32" y="98" font-family="${FONT}" font-size="22" font-weight="800" fill="${INK}">Good morning</text>
    <rect x="32" y="114" width="118" height="30" rx="15" fill="#E7F8EE"/>
    <text x="91" y="134" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="#0A8F4A">14-day streak</text>
    ${bars}
  </g>
</svg>`

await sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toFile(out)
const kb = (fs.statSync(out).size / 1024).toFixed(0)
console.log(`Wrote ${path.relative(root, out)} (${kb} KB)`)
