// 대사 연출: 한 글자씩 찍히는 글자, 글자마다 효과음, "!"로 끝나는 강조 문장은 크게 찍히고 화면이 흔들린다.
import type { Look } from '../world/character';
import type { Emotion } from '../data/stages';
import { Portrait } from './portrait';
import { esc } from './common';

// ---------- 효과음 (WebAudio, 오프라인) ----------
const SOUND_KEY = 'seontaek.sound';
let actx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(SOUND_KEY) === 'off';
  } catch {
    return false;
  }
})();

function ctx(): AudioContext | null {
  if (muted) return null;
  try {
    actx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (actx.state === 'suspended') void actx.resume();
    return actx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator();
  const gn = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  gn.gain.setValueAtTime(vol, a.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(gn).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

export const sfx = {
  get muted() {
    return muted;
  },
  toggle() {
    muted = !muted;
    try {
      localStorage.setItem(SOUND_KEY, muted ? 'off' : 'on');
    } catch {
      /* noop */
    }
    return muted;
  },
  blip(voice: number, strong = false) {
    tone(voice * (0.94 + Math.random() * 0.12), strong ? 0.07 : 0.045, 'square', strong ? 0.07 : 0.035);
  },
  stamp() {
    tone(160, 0.18, 'square', 0.12, -110);
    tone(90, 0.22, 'triangle', 0.15, -40);
  },
  pick() {
    tone(660, 0.06, 'square', 0.05);
    setTimeout(() => tone(990, 0.08, 'square', 0.05), 50);
  },
  good() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.05), i * 70));
  },
  bad() {
    tone(300, 0.25, 'sawtooth', 0.06, -180);
  },
};

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* noop */
  }
}

export function shake(el: HTMLElement | null, strong = false) {
  if (!el) return;
  const cls = strong ? 'shake-hard' : 'shake';
  el.classList.remove('shake', 'shake-hard');
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 450);
}

// ---------- 글자 찍기 ----------
interface Piece {
  ch: string;
  em: boolean;
  endEm: boolean; // 강조 문장의 마지막 글자 → 흔들림
}

/** 강조: *별표* 로 감싼 부분, 또는 "!"로 끝나는 문장 */
function parse(text: string): Piece[] {
  const out: Piece[] = [];
  // 별표 강조를 먼저 처리
  const parts = text.split('*');
  parts.forEach((part, pi) => {
    const starred = pi % 2 === 1;
    // 문장 단위로 쪼갠다 (끝 문장부호 포함)
    const sentences = part.match(/[^.!?…]+[.!?…]*\s*|[.!?…]+\s*/g) ?? [part];
    for (const sen of sentences) {
      const bang = /!\s*$/.test(sen) || /!\?|\?!/.test(sen);
      const em = starred || bang;
      const chars = Array.from(sen);
      let last = chars.length - 1;
      while (last > 0 && /\s/.test(chars[last])) last--;
      chars.forEach((ch, i) => out.push({ ch, em, endEm: em && i === last }));
    }
  });
  return out;
}

export interface TypeOpts {
  voice?: number; // 효과음 높이 (Hz)
  onTalk?: (talking: boolean) => void;
  shakeTarget?: HTMLElement | null;
  speed?: number; // 글자당 ms
}

let skipAll = false;
/** 테스트·빨리 보기용: true면 대사가 즉시 다 나온다 */
export function setInstantText(v: boolean) {
  skipAll = v;
}

export function typewrite(el: HTMLElement, text: string, opts: TypeOpts = {}): Promise<void> {
  const pieces = parse(text);
  el.innerHTML = '';
  el.classList.add('typing');
  // 단어 단위로 묶어 줄바꿈이 단어 중간에서 일어나지 않게 한다
  const spans: HTMLSpanElement[] = [];
  let word: HTMLSpanElement | null = null;
  for (const p of pieces) {
    if (/\s/.test(p.ch)) {
      word = null;
      el.appendChild(document.createTextNode(' '));
      spans.push(document.createElement('span')); // 자리 맞추기용 (빈 칸)
      continue;
    }
    if (!word) {
      word = document.createElement('span');
      word.className = 'w';
      el.appendChild(word);
    }
    const s = document.createElement('span');
    s.className = `ch${p.em ? ' em' : ''}`;
    s.textContent = p.ch;
    word.appendChild(s);
    spans.push(s);
  }
  const base = opts.speed ?? 48;
  const voice = opts.voice ?? 420;
  return new Promise((resolve) => {
    let i = 0;
    let done = false;
    let timer = 0;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      spans.forEach((s) => s.classList.add('on'));
      el.classList.remove('typing');
      opts.onTalk?.(false);
      el.removeEventListener('click', finish);
      resolve();
    };
    el.addEventListener('click', finish);
    if (skipAll) return finish();
    const step = () => {
      if (done) return;
      if (i >= pieces.length) return finish();
      const p = pieces[i];
      const s = spans[i];
      i++;
      if (/\s/.test(p.ch)) {
        timer = window.setTimeout(step, base * 0.6);
        return;
      }
      s.classList.add('on');
      const punct = /[.,!?…~]/.test(p.ch);
      if (!punct && i % 2 === 1) sfx.blip(voice, p.em);
      opts.onTalk?.(!punct && i % 4 < 2);
      if (p.endEm) {
        sfx.stamp();
        vibrate(40);
        shake(opts.shakeTarget ?? null, true);
      }
      let wait = p.em ? base * 1.6 : base;
      if (/[.…]/.test(p.ch)) wait = 260;
      else if (/[,~]/.test(p.ch)) wait = 140;
      else if (/[!?]/.test(p.ch)) wait = 300;
      timer = window.setTimeout(step, wait);
    };
    step();
  });
}

// ---------- 동네용 대화 오버레이 ----------
export interface TalkLine {
  name: string;
  look: Look;
  emotion?: Emotion;
  text: string;
  me?: boolean;
  voice?: number;
}

/** 화면 아래에 초상화 + 대화창을 띄운다. 동네의 짧은 대화·돌발 만남에서 쓴다. */
export class TalkOverlay {
  readonly el: HTMLElement;
  private portrait: Portrait | null = null;
  private pwrap: HTMLElement;
  private nameEl: HTMLElement;
  private textEl: HTMLElement;
  private choicesEl: HTMLElement;

  constructor(title?: string) {
    this.el = document.createElement('div');
    this.el.className = 'talk-overlay';
    this.el.innerHTML = `
      ${title ? `<div class="talk-title">${esc(title)}</div>` : ''}
      <div class="talk-stage"><div class="talk-portrait"></div></div>
      <div class="vn-box talk-box"><div class="nameplate"></div><div class="text vn-text"></div><div class="next-ind">▼</div></div>
      <div class="talk-choices"></div>`;
    document.body.appendChild(this.el);
    this.pwrap = this.el.querySelector('.talk-portrait') as HTMLElement;
    this.nameEl = this.el.querySelector('.nameplate') as HTMLElement;
    this.textEl = this.el.querySelector('.vn-text') as HTMLElement;
    this.choicesEl = this.el.querySelector('.talk-choices') as HTMLElement;
  }

  async say(line: TalkLine): Promise<void> {
    if (!this.portrait) {
      this.portrait = new Portrait(line.look);
      this.pwrap.appendChild(this.portrait.el);
    } else if (this.portrait.look !== line.look) {
      this.portrait.setLook(line.look);
      this.pwrap.classList.remove('slide-in');
      void this.pwrap.offsetWidth;
      this.pwrap.classList.add('slide-in');
    }
    this.pwrap.classList.toggle('me', !!line.me);
    this.portrait.setEmotion(line.emotion ?? 'NORMAL');
    this.nameEl.textContent = line.name;
    this.nameEl.classList.toggle('me', !!line.me);
    this.el.classList.add('typing');
    await typewrite(this.textEl, line.text, {
      voice: line.voice ?? (line.me ? 520 : 380),
      onTalk: (t) => this.portrait?.setTalking(t),
      shakeTarget: this.el,
    });
    this.el.classList.remove('typing');
  }

  /** 대사가 끝난 뒤 탭(또는 버튼)을 기다린다 */
  waitTap(label = '▶ 계속'): Promise<void> {
    return new Promise((resolve) => {
      this.choicesEl.innerHTML = `<button class="btn next">${esc(label)}</button>`;
      const b = this.choicesEl.querySelector('button') as HTMLButtonElement;
      b.onclick = () => {
        sfx.pick();
        this.choicesEl.innerHTML = '';
        resolve();
      };
    });
  }

  choose(options: string[]): Promise<number> {
    return new Promise((resolve) => {
      this.choicesEl.innerHTML = options.map((o, i) => `<button class="btn choice" data-i="${i}">${esc(o)}</button>`).join('');
      this.choicesEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
        (b.onclick = () => {
          sfx.pick();
          this.choicesEl.innerHTML = '';
          resolve(+b.dataset.i!);
        }),
      );
    });
  }

  close() {
    this.portrait?.destroy();
    this.el.classList.add('out');
    setTimeout(() => this.el.remove(), 180);
  }
}
