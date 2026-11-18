// 대화 장면용 도트 초상화 (64x64 도트). 표정 6가지, 말할 때 입이 움직이고 가끔 눈을 깜빡인다.
import type { Look } from '../world/character';
import type { Emotion } from '../data/stages';

export const PORTRAIT = 64;

function shade(hex: string, k: number): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export interface PortraitState {
  emotion: Emotion;
  talking: boolean; // 입 벌림 프레임
  blink: boolean;
}

export function drawPortrait(g: CanvasRenderingContext2D, look: Look, st: PortraitState) {
  g.clearRect(0, 0, PORTRAIT, PORTRAIT);
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  const skin = look.skin;
  const skinD = shade(skin, 0.86);
  const skinDD = shade(skin, 0.72);
  const hair = look.hair;
  const hairD = shade(hair, 0.75);
  const hairL = shade(hair, 1.25);
  const hs = look.hairStyle ?? 'short';
  const e = st.emotion;
  const OUT = '#1d1430';

  // 뒷머리 (긴 머리·포니테일)
  if (hs === 'long') {
    r(14, 18, 36, 34, hairD);
    r(13, 24, 2, 26, OUT);
    r(49, 24, 2, 26, OUT);
  }
  if (hs === 'pony') {
    r(46, 22, 8, 6, hairD);
    r(48, 26, 7, 16, hair);
    r(49, 40, 5, 6, hairD);
    r(46, 22, 1, 6, OUT);
  }
  if (hs === 'bun') {
    r(25, 2, 14, 9, hair);
    r(27, 3, 8, 2, hairL);
  }

  // 몸 (어깨)
  const sh = look.shirt;
  r(8, 50, 48, 14, sh);
  r(6, 54, 2, 10, sh);
  r(56, 54, 2, 10, sh);
  r(8, 50, 48, 2, shade(sh, 1.15));
  r(8, 58, 48, 6, shade(sh, 0.88));
  r(6, 53, 1, 11, OUT);
  r(57, 53, 1, 11, OUT);
  r(7, 50, 1, 4, OUT);
  r(56, 50, 1, 4, OUT);
  r(8, 49, 48, 1, OUT);
  // 목
  r(26, 42, 12, 9, skinD);
  r(26, 42, 12, 2, skinDD);
  // 옷깃
  if (look.tie) {
    r(22, 49, 8, 6, '#f4f4f4');
    r(34, 49, 8, 6, '#f4f4f4');
    r(30, 50, 4, 3, '#c0392b');
    r(29, 53, 6, 11, '#c0392b');
    r(31, 53, 2, 11, '#e05a4c');
  } else {
    r(24, 49, 16, 3, shade(sh, 0.7));
    r(27, 49, 10, 4, skinD);
  }

  // 귀
  r(15, 28, 4, 8, skinD);
  r(45, 28, 4, 8, skinD);
  r(14, 28, 1, 8, OUT);
  r(49, 28, 1, 8, OUT);
  // 얼굴
  r(18, 14, 28, 30, skin);
  r(20, 44, 24, 2, skin);
  r(17, 16, 1, 26, OUT);
  r(46, 16, 1, 26, OUT);
  r(18, 42, 2, 2, OUT);
  r(44, 42, 2, 2, OUT);
  r(20, 46, 24, 1, OUT);
  r(18, 40, 2, 2, skinD);
  r(44, 40, 2, 2, skinD);
  r(22, 44, 20, 2, skinD);

  // 앞머리
  r(16, 8, 32, 10, hair);
  r(18, 6, 28, 2, hair);
  r(17, 5, 30, 1, OUT);
  r(15, 7, 1, 12, OUT);
  r(48, 7, 1, 12, OUT);
  r(20, 7, 12, 1, hairL);
  if (hs === 'part') {
    r(16, 18, 4, 8, hair);
    r(44, 18, 4, 6, hair);
    r(26, 6, 2, 10, hairD);
    r(28, 16, 18, 3, hair);
    r(18, 18, 8, 2, hair);
  } else if (hs === 'long') {
    r(16, 18, 5, 26, hair);
    r(43, 18, 5, 26, hair);
    r(21, 18, 8, 3, hair);
    r(33, 18, 10, 2, hair);
    r(29, 18, 4, 1, hair);
  } else {
    r(16, 18, 4, 10, hair);
    r(44, 18, 4, 10, hair);
    r(20, 18, 7, 3, hair);
    r(27, 18, 6, 2, hair);
    r(33, 18, 11, 3, hair);
    r(24, 21, 3, 1, hairD);
    r(38, 21, 4, 1, hairD);
  }
  r(16, 17, 32, 1, hairD);

  // 모자
  const hc = look.hatColor ?? '#e2445c';
  if (look.hat === 'cap') {
    r(14, 2, 36, 12, hc);
    r(14, 2, 36, 2, shade(hc, 1.2));
    r(13, 13, 38, 3, shade(hc, 0.7));
    r(12, 15, 22, 3, shade(hc, 0.6));
    r(30, 5, 4, 3, shade(hc, 1.3));
  } else if (look.hat === 'beanie') {
    r(14, 1, 36, 15, hc);
    r(14, 13, 36, 4, shade(hc, 0.75));
    for (let x = 16; x < 48; x += 4) r(x, 2, 1, 11, shade(hc, 0.85));
    r(28, -1, 8, 4, '#fff');
  } else if (look.hat === 'catears') {
    r(16, 6, 32, 2, '#333');
    r(16, 0, 6, 6, '#333');
    r(42, 0, 6, 6, '#333');
    r(18, 2, 2, 3, '#ff8fab');
    r(44, 2, 2, 3, '#ff8fab');
  }

  // 눈썹
  const brow = shade(hair, 0.6);
  const by = 23;
  if (e === 'ANGRY') {
    r(21, by, 3, 2, brow);
    r(24, by + 1, 3, 2, brow);
    r(27, by + 2, 2, 2, brow);
    r(40, by, 3, 2, brow);
    r(37, by + 1, 3, 2, brow);
    r(35, by + 2, 2, 2, brow);
  } else if (e === 'PANIC' || e === 'CRY') {
    r(21, by + 2, 3, 2, brow);
    r(24, by + 1, 3, 2, brow);
    r(27, by, 2, 2, brow);
    r(40, by + 2, 3, 2, brow);
    r(37, by + 1, 3, 2, brow);
    r(35, by, 2, 2, brow);
  } else if (e === 'SUSPECT') {
    r(21, by + 1, 8, 2, brow);
    r(35, by - 2, 3, 2, brow);
    r(38, by - 3, 5, 2, brow);
  } else {
    r(21, by, 8, 2, brow);
    r(35, by, 8, 2, brow);
  }

  // 눈
  const eye = (x: number) => {
    const ey = 26;
    if (st.blink || e === 'CRY') {
      r(x, ey + 3, 6, 1, OUT);
      if (e === 'CRY') {
        r(x, ey + 2, 1, 1, OUT);
        r(x + 5, ey + 2, 1, 1, OUT);
      }
      return;
    }
    if (e === 'HAPPY') {
      r(x, ey + 3, 1, 2, OUT);
      r(x + 1, ey + 2, 1, 1, OUT);
      r(x + 2, ey + 1, 2, 1, OUT);
      r(x + 4, ey + 2, 1, 1, OUT);
      r(x + 5, ey + 3, 1, 2, OUT);
      return;
    }
    if (e === 'PANIC') {
      r(x, ey, 6, 6, '#fff');
      r(x - 1, ey, 1, 6, OUT);
      r(x + 6, ey, 1, 6, OUT);
      r(x, ey - 1, 6, 1, OUT);
      r(x, ey + 6, 6, 1, OUT);
      r(x + 2, ey + 2, 2, 2, OUT);
      return;
    }
    if (e === 'SUSPECT') {
      r(x, ey + 2, 6, 1, OUT);
      r(x, ey + 3, 6, 2, '#fff');
      r(x + 3, ey + 3, 2, 2, OUT);
      r(x, ey + 5, 6, 1, skinD);
      return;
    }
    r(x, ey, 6, 1, OUT);
    r(x + 1, ey + 1, 4, 5, OUT);
    r(x, ey + 1, 1, 4, OUT);
    r(x + 5, ey + 1, 1, 4, OUT);
    r(x + 1, ey + 1, 2, 2, '#fff');
    r(x + 3, ey + 4, 1, 1, '#5b6bbf');
    if (e === 'ANGRY') r(x, ey, 6, 2, skin);
  };
  eye(22);
  eye(36);

  // 안경
  if (look.glasses) {
    const c = look.glasses === 'sun' ? '#111' : '#6b3f1f';
    const lens = (x: number) => {
      if (look.glasses === 'sun') r(x, 25, 10, 7, '#111');
      else {
        r(x, 24, 10, 1, c);
        r(x, 32, 10, 1, c);
        r(x, 24, 1, 9, c);
        r(x + 9, 24, 1, 9, c);
        r(x + 7, 26, 1, 2, 'rgba(255,255,255,.7)');
      }
    };
    lens(20);
    lens(34);
    r(30, 26, 4, 1, c);
    r(17, 26, 3, 1, c);
    r(44, 26, 3, 1, c);
    if (look.glasses === 'sun') {
      r(22, 26, 3, 1, 'rgba(255,255,255,.5)');
      r(36, 26, 3, 1, 'rgba(255,255,255,.5)');
    }
  }

  // 코
  r(31, 32, 2, 3, skinD);
  r(30, 35, 3, 1, skinDD);

  // 볼
  if (e === 'HAPPY' || e === 'PANIC') {
    r(20, 34, 5, 2, 'rgba(255,110,130,.55)');
    r(39, 34, 5, 2, 'rgba(255,110,130,.55)');
  }

  // 입
  const my = 38;
  const open = st.talking;
  if (e === 'HAPPY') {
    if (open) {
      r(27, my, 10, 1, OUT);
      r(27, my + 1, 10, 3, '#8b1e2e');
      r(28, my + 4, 8, 1, OUT);
      r(28, my + 1, 8, 1, '#fff');
      r(30, my + 3, 4, 1, '#ff6b81');
    } else {
      r(26, my, 2, 1, OUT);
      r(28, my + 1, 8, 1, OUT);
      r(36, my, 2, 1, OUT);
    }
  } else if (e === 'ANGRY') {
    if (open) {
      r(26, my, 12, 1, OUT);
      r(26, my + 1, 12, 3, '#fff');
      r(26, my + 4, 12, 1, OUT);
      for (let x = 28; x < 38; x += 3) r(x, my + 1, 1, 3, '#bbb');
    } else {
      r(27, my + 1, 10, 1, OUT);
      r(26, my + 2, 1, 1, OUT);
      r(37, my + 2, 1, 1, OUT);
    }
  } else if (e === 'PANIC') {
    if (open) {
      r(29, my - 1, 6, 1, OUT);
      r(28, my, 8, 4, '#8b1e2e');
      r(29, my + 4, 6, 1, OUT);
    } else {
      for (let i = 0; i < 10; i++) r(27 + i, my + (i % 2), 1, 1, OUT);
    }
  } else if (e === 'SUSPECT') {
    r(28, my + 1, 6, 1, OUT);
    r(34, my, 3, 1, OUT);
    if (open) r(29, my + 2, 4, 1, '#8b1e2e');
  } else if (e === 'CRY') {
    if (open) {
      r(28, my, 8, 1, OUT);
      r(28, my + 1, 8, 3, '#8b1e2e');
      r(27, my + 2, 1, 1, OUT);
      r(36, my + 2, 1, 1, OUT);
    } else {
      r(28, my + 2, 8, 1, OUT);
      r(27, my + 3, 1, 1, OUT);
      r(36, my + 3, 1, 1, OUT);
    }
  } else {
    if (open) {
      r(29, my, 6, 1, OUT);
      r(29, my + 1, 6, 2, '#8b1e2e');
      r(30, my + 3, 4, 1, OUT);
    } else r(29, my + 1, 6, 1, OUT);
  }

  // 감정 효과
  if (e === 'PANIC') {
    r(47, 12, 3, 5, '#8fd3ff');
    r(48, 17, 2, 2, '#8fd3ff');
    r(48, 13, 1, 2, '#fff');
    r(12, 20, 2, 4, '#8fd3ff');
  }
  if (e === 'ANGRY') {
    const v = '#e2445c';
    r(48, 8, 2, 6, v);
    r(52, 8, 2, 6, v);
    r(46, 10, 6, 2, v);
    r(50, 12, 6, 2, v);
  }
  if (e === 'CRY') {
    r(23, 31, 2, 12, '#7cc4f0');
    r(38, 31, 2, 12, '#7cc4f0');
    r(23, 31, 1, 4, '#d6f0ff');
  }
  if (e === 'SUSPECT') {
    r(50, 10, 4, 1, '#ffd166');
    r(53, 11, 1, 2, '#ffd166');
    r(52, 13, 1, 2, '#ffd166');
    r(52, 16, 1, 1, '#ffd166');
  }
}

/** 화면에 붙이는 초상화. 말하는 동안 입을 움직이고, 가끔 눈을 깜빡인다. */
export class Portrait {
  readonly el: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private st: PortraitState = { emotion: 'NORMAL', talking: false, blink: false };
  private timer = 0;
  private alive = true;

  constructor(public look: Look) {
    this.el = document.createElement('canvas');
    this.el.width = PORTRAIT;
    this.el.height = PORTRAIT;
    this.el.className = 'portrait-cv';
    this.g = this.el.getContext('2d')!;
    this.draw();
    const blink = () => {
      if (!this.alive) return;
      if (!this.el.isConnected && this.timer > 0) {
        this.alive = false;
        return;
      }
      this.timer++;
      this.st.blink = true;
      this.draw();
      setTimeout(() => {
        this.st.blink = false;
        this.draw();
        setTimeout(blink, 1800 + Math.random() * 2600);
      }, 120);
    };
    setTimeout(blink, 1500);
  }

  setLook(look: Look) {
    this.look = look;
    this.draw();
  }

  setEmotion(e: Emotion) {
    if (e === this.st.emotion) return;
    this.st.emotion = e;
    this.draw();
    // 표정이 바뀔 때 살짝 튀어 오르고, 화나면 흔들린다
    const cls = e === 'ANGRY' ? 'p-shake' : e === 'PANIC' ? 'p-shiver' : 'p-hop';
    this.el.classList.remove('p-shake', 'p-shiver', 'p-hop');
    void this.el.offsetWidth;
    this.el.classList.add(cls);
  }

  get emotion() {
    return this.st.emotion;
  }

  setTalking(t: boolean) {
    if (t === this.st.talking) return;
    this.st.talking = t;
    this.draw();
  }

  destroy() {
    this.alive = false;
  }

  private draw() {
    drawPortrait(this.g, this.look, this.st);
  }
}
