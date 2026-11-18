// 2D 도트 캐릭터. 색과 파츠를 바꿔 꾸민다. 1칸 = 16 도트, 캐릭터는 12x18 도트.

export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  hat?: 'cap' | 'beanie' | 'catears' | null;
  hatColor?: string;
  glasses?: 'round' | 'sun' | null;
  bag?: boolean;
  /** 머리 모양 (초상화·도트 공용) */
  hairStyle?: 'short' | 'long' | 'pony' | 'part' | 'bun';
  /** 넥타이 (정장) */
  tie?: boolean;
}

export const DEFAULT_LOOK: Look = { skin: '#f2c9a0', hair: '#2b2118', shirt: '#4f6dff', pants: '#2d3047', hat: null, glasses: null, bag: false };

/** 0 아래, 1 위, 2 왼쪽, 3 오른쪽 */
export type Dir = 0 | 1 | 2 | 3;

export function dirOf(mx: number, mz: number, prev: Dir): Dir {
  if (Math.abs(mx) < 0.05 && Math.abs(mz) < 0.05) return prev;
  if (Math.abs(mx) > Math.abs(mz)) return mx < 0 ? 2 : 3;
  return mz < 0 ? 1 : 0;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/**
 * (x, y) = 발 아래 가운데 (도트 좌표). frame 0/1 = 걷기 프레임, moving=false면 서 있음.
 */
export function drawCharacter(g: CanvasRenderingContext2D, look: Look, x: number, y: number, dir: Dir, frame: number, moving: boolean) {
  const X = Math.round(x) - 6;
  const Y = Math.round(y) - 18;
  const r = (px: number, py: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(X + px, Y + py, w, h);
  };
  const step = moving ? (frame ? 1 : -1) : 0;
  const bob = moving && frame ? 1 : 0;
  // 그림자
  g.fillStyle = 'rgba(0,0,0,.25)';
  g.fillRect(X + 2, Y + 17, 8, 2);
  g.fillRect(X + 1, Y + 17.5, 10, 1);
  const dark = shade(look.pants, 0.7);
  // 다리
  if (dir === 2 || dir === 3) {
    r(4 + step, 13, 3, 5, look.pants);
    r(5 - step, 13, 3, 5, dark);
    r(4 + step, 17, 3, 1, '#222');
  } else {
    r(3, 13 - (step > 0 ? 1 : 0), 3, 5, look.pants);
    r(6, 13 - (step < 0 ? 1 : 0), 3, 5, look.pants);
    r(3, 17 - (step > 0 ? 1 : 0), 3, 1, '#222');
    r(6, 17 - (step < 0 ? 1 : 0), 3, 1, '#222');
  }
  const by = bob;
  // 가방 (등 뒤: 위를 볼 때 앞에, 옆을 볼 때 옆에)
  if (look.bag && dir === 0) r(1, 8 - by, 1, 5, '#c66f00');
  // 몸통
  r(2, 8 - by, 8, 6, look.shirt);
  r(2, 13 - by, 8, 1, shade(look.shirt, 0.75));
  // 팔
  const armSwing = moving ? step : 0;
  if (dir === 2 || dir === 3) {
    r(dir === 2 ? 4 + armSwing : 6 - armSwing, 9 - by, 2, 4, shade(look.shirt, 0.8));
    r(dir === 2 ? 4 + armSwing : 6 - armSwing, 13 - by, 2, 1, look.skin);
    if (look.bag) r(dir === 2 ? 8 : 1, 8 - by, 3, 5, '#ff9f1a');
  } else {
    r(0, 9 - by + (armSwing > 0 ? 1 : 0), 2, 4, shade(look.shirt, 0.8));
    r(10, 9 - by + (armSwing < 0 ? 1 : 0), 2, 4, shade(look.shirt, 0.8));
    r(0, 13 - by + (armSwing > 0 ? 1 : 0), 2, 1, look.skin);
    r(10, 13 - by + (armSwing < 0 ? 1 : 0), 2, 1, look.skin);
    if (look.bag && dir === 1) r(3, 8 - by, 6, 5, '#ff9f1a');
  }
  // 머리
  const hy = 1 - by;
  r(2, hy, 8, 7, look.skin);
  const hairDark = shade(look.hair, 0.8);
  if (dir === 1) {
    r(2, hy, 8, 6, look.hair);
    r(2, hy + 5, 8, 1, hairDark);
  } else if (dir === 0) {
    r(2, hy, 8, 2, look.hair);
    r(2, hy + 2, 1, 3, look.hair);
    r(9, hy + 2, 1, 3, look.hair);
    r(4, hy + 4, 1, 2, '#1a1a1a');
    r(7, hy + 4, 1, 2, '#1a1a1a');
    r(5, hy + 6, 2, 1, shade(look.skin, 0.8));
  } else {
    const L = dir === 2;
    r(2, hy, 8, 2, look.hair);
    r(L ? 7 : 2, hy + 2, 3, 4, look.hair);
    r(L ? 3 : 8, hy + 4, 1, 2, '#1a1a1a');
  }
  // 머리 모양
  const hs = look.hairStyle ?? 'short';
  if (hs === 'long') {
    if (dir === 0) {
      r(1, hy + 2, 2, 7, look.hair);
      r(9, hy + 2, 2, 7, look.hair);
    } else if (dir === 1) r(2, hy + 5, 8, 4, look.hair);
    else r(dir === 2 ? 7 : 2, hy + 5, 3, 4, look.hair);
  } else if (hs === 'pony') {
    if (dir === 1) r(5, hy + 5, 2, 5, hairDark);
    else if (dir === 2) r(10, hy + 2, 2, 5, hairDark);
    else if (dir === 3) r(0, hy + 2, 2, 5, hairDark);
    else r(10, hy + 1, 2, 4, hairDark);
  } else if (hs === 'bun') {
    r(4, hy - 2, 4, 2, look.hair);
  }
  if (look.tie && dir === 0) r(5, 8 - by, 2, 4, '#c0392b');
  // 안경
  if (look.glasses && dir !== 1) {
    const c = look.glasses === 'sun' ? '#111' : '#6b3f1f';
    if (dir === 0) {
      r(3, hy + 4, 3, 2, c);
      r(6, hy + 4, 3, 2, c);
      if (look.glasses === 'round') {
        r(4, hy + 5, 1, 1, '#cfe8ff');
        r(7, hy + 5, 1, 1, '#cfe8ff');
      }
    } else r(dir === 2 ? 2 : 7, hy + 4, 3, 2, c);
  }
  // 모자
  const hc = look.hatColor ?? '#e2445c';
  if (look.hat === 'cap') {
    r(1, hy - 1, 10, 3, hc);
    r(1, hy + 1, 10, 1, shade(hc, 0.75));
    if (dir === 0) r(2, hy + 2, 8, 1, shade(hc, 0.6));
    if (dir === 2) r(-2, hy + 1, 4, 1, shade(hc, 0.6));
    if (dir === 3) r(10, hy + 1, 4, 1, shade(hc, 0.6));
  } else if (look.hat === 'beanie') {
    r(1, hy - 2, 10, 4, hc);
    r(1, hy + 1, 10, 1, shade(hc, 0.7));
    r(5, hy - 4, 2, 2, '#fff');
  } else if (look.hat === 'catears') {
    r(2, hy - 1, 8, 1, '#333');
    r(2, hy - 3, 2, 2, '#333');
    r(8, hy - 3, 2, 2, '#333');
    r(3, hy - 2, 1, 1, '#ff8fab');
    r(8, hy - 2, 1, 1, '#ff8fab');
  }
}

/** 상점·옷장에서 쓰는 큰 미리보기 */
export function lookPreview(look: Look, scale = 5): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16 * scale;
  c.height = 22 * scale;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  drawCharacter(g, look, 8, 21, 0, 0, false);
  return c;
}
