// dist/ 결과를 하나의 HTML 파일(dist/single.html)로 합친다. 오프라인 배포·미리보기용.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let html = readFileSync(join(dist, 'index.html'), 'utf8');
const assets = readdirSync(join(dist, 'assets'));
for (const f of assets) {
  const body = readFileSync(join(dist, 'assets', f), 'utf8');
  if (f.endsWith('.js')) {
    html = html.replace(new RegExp(`<script type="module" crossorigin src="\\./assets/${f.replace('.', '\\.')}"></script>`), () => '');
    html = html.replace('</body>', () => `<script type="module">${body}</script>\n</body>`);
  } else if (f.endsWith('.css')) {
    html = html.replace(new RegExp(`<link rel="stylesheet" crossorigin href="\\./assets/${f.replace('.', '\\.')}">`), () => `<style>${body}</style>`);
  }
}
writeFileSync(join(dist, 'single.html'), html);
console.log('dist/single.html', (html.length / 1024).toFixed(1), 'KB');
