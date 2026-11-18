// TS 원본(지도·데이터·장면)을 고도 프로젝트용 PNG·JSON으로 내보낸다.
// 사용: node scripts/godot-export.mjs
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../godot/assets/', import.meta.url).pathname;
mkdirSync(OUT + 'data', { recursive: true });
mkdirSync(OUT + 'img', { recursive: true });

const bundle = await build({ entryPoints: [new URL('./godot-export-entry.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', target: 'es2020' });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const out = await page.evaluate(() => window.__EXPORT());
await browser.close();

const png = (dataUrl, file) => writeFileSync(OUT + 'img/' + file, Buffer.from(dataUrl.split(',')[1], 'base64'));
png(out.mapPng, 'map.png');
for (const [k, v] of Object.entries(out.scenes)) png(v, `scene_${k}.png`);
writeFileSync(OUT + 'data/world.json', JSON.stringify(out.world));
writeFileSync(OUT + 'data/game.json', JSON.stringify(out.data, null, 1));

// 게임 글자에 쓰인 이모지만 모아 둔다 (흑백 이모지 글꼴을 이만큼만 잘라 넣는다)
const text = JSON.stringify(out.data);
const emo = new Set(text.match(/\p{Extended_Pictographic}/gu) ?? []);
writeFileSync(OUT + 'data/emoji_used.txt', [...emo].join(''));
console.log('exported', Object.keys(out.scenes).length, 'scenes,', emo.size, 'emoji');
