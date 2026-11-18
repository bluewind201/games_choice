export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function toast(text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${tone}`;
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1600);
  setTimeout(() => t.remove(), 2100);
}

export function modal(html: string): HTMLElement {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(m);
  return m;
}

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
