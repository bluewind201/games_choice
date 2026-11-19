// 고도 판을 웹으로 내보내고, 큰 엔진 파일(wasm)을 gzip으로 줄여 build/godot-web/ 에 모은다.
// 아티팩트는 일반 바이너리 파일을 올릴 수 없어서, 엔진(wasm, gzip)과 게임 데이터(pck)를 base64 글자 파일(.txt)로 바꿔 둔다.
// 브라우저는 index.html 안의 작은 코드로 받아서 되돌려 쓴다 (atob + DecompressionStream).
// 사용: node scripts/godot-web.mjs  (환경변수 GODOT=고도 실행 파일 경로)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { gzipSync, constants } from 'node:zlib';

const GODOT = process.env.GODOT || '/tmp/godot/Godot_v4.3-stable_linux.x86_64';
const root = new URL('..', import.meta.url).pathname;
const raw = root + 'build/web/';
const out = root + 'build/godot-web/';
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });
execFileSync(GODOT, ['--headless', '--path', root + 'godot', '--export-release', 'Web', raw + 'index.html'], { stdio: 'inherit', timeout: 300000 });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const wasm = readFileSync(raw + 'index.wasm');
writeFileSync(out + 'index.wasm.gz.b64.txt', gzipSync(wasm, { level: constants.Z_BEST_COMPRESSION }).toString('base64'));
writeFileSync(out + 'index.pck.b64.txt', readFileSync(raw + 'index.pck').toString('base64'));
for (const f of ['index.js', 'index.audio.worklet.js']) copyFileSync(raw + f, out + f);

const sizes = { 'index.pck': statSync(raw + 'index.pck').size, 'index.wasm': wasm.length };
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover">
<title>선택의 연속</title>
<style>
:root { --bg: #2a2140; --ink: #fff6e0; --accent: #ffd166; }
html, body { margin: 0; padding: 0; height: 100%; background: var(--bg); color: var(--ink); overflow: hidden; touch-action: none; }
#canvas { display: block; width: 100vw; height: 100vh; height: 100dvh; outline: none; }
#boot { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  font: 700 15px/1.4 system-ui, sans-serif; background: var(--bg); text-align: center; padding: 0 16px; }
#boot .logo { font-size: 34px; color: var(--accent); letter-spacing: 2px; text-shadow: 0 3px 0 #1d1430; }
#bar { width: min(240px, 70vw); height: 12px; border: 2px solid var(--ink); background: #1d1430; }
#bar i { display: block; height: 100%; width: 0; background: var(--accent); transition: width .2s; }
#err { color: #ffb3c1; max-width: 320px; font-size: 13px; }
</style>
</head>
<body>
<canvas id="canvas" tabindex="0"></canvas>
<div id="boot"><div class="logo">선택의 연속</div><div id="bar"><i></i></div><div id="msg">게임 엔진 불러오는 중...</div><div id="err"></div></div>
<script>
// 엔진(wasm)과 게임 데이터(pck)는 base64 글자 파일로 올려 두었으니 받아서 되돌려 준다.
(function () {
  const realFetch = window.fetch.bind(window);
  const bytesOf = (url) => realFetch(url).then((r) => {
    if (!r.ok) throw new Error('파일을 받지 못했어요: ' + url + ' (' + r.status + ')');
    return r.text();
  }).then((t) => {
    const s = atob(t.trim());
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  });
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (/index\\.wasm(\\?|$)/.test(url)) {
      return bytesOf('index.wasm.gz.b64.txt').then((u) => {
        const body = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
        return new Response(body, { status: 200, headers: { 'Content-Type': 'application/wasm' } });
      });
    }
    if (/index\\.pck(\\?|$)/.test(url)) {
      return bytesOf('index.pck.b64.txt').then((u) => new Response(u, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }));
    }
    return realFetch(input, init);
  };
})();
</script>
<script src="index.js"></script>
<script>
const GODOT_CONFIG = ${JSON.stringify({ args: [], canvasResizePolicy: 2, ensureCrossOriginIsolationHeaders: false, executable: 'index', experimentalVK: false, fileSizes: sizes, focusCanvas: true, gdextensionLibs: [] })};
const engine = new Engine(GODOT_CONFIG);
const bar = document.querySelector('#bar i');
const boot = document.getElementById('boot');
const fail = (e) => { console.error(e); document.getElementById('msg').textContent = '불러오기에 실패했어요.'; document.getElementById('err').textContent = String(e && e.message || e); };
const missing = Engine.getMissingFeatures({ threads: false });
if (missing.length) fail('이 브라우저에서 필요한 기능이 없어요: ' + missing.join(', '));
else engine.startGame({
  onProgress: (cur, total) => { if (total > 0) bar.style.width = Math.round((cur / total) * 100) + '%'; },
}).then(() => { boot.remove(); document.getElementById('canvas').focus(); }, fail);
</script>
</body>
</html>
`;
writeFileSync(out + 'index.html', html);
// 격투만 하는 페이지: 같은 엔진·데이터에 window.FIGHT_ONLY 만 켠다
writeFileSync(out + 'fight.html', html.replace('<title>선택의 연속</title>', '<title>정면 승부</title>').replace('<div class="logo">선택의 연속</div>', '<div class="logo">정면 승부!</div>').replace('<script>\n// 엔진', '<script>window.FIGHT_ONLY = true;</script>\n<script>\n// 엔진'));
for (const f of ['index.html', 'fight.html', 'index.js', 'index.pck.b64.txt', 'index.wasm.gz.b64.txt', 'index.audio.worklet.js']) console.log(f, statSync(out + f).size);
