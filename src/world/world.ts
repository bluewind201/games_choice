// 2D 도트 레트로 동네: 위에서 내려다보며 돌아다니고, 사람과 부딪치고, 미션·퀘스트를 하고, 돈을 벌어 캐릭터를 꾸민다.
import { drawCharacter, dirOf, Dir, Look, DEFAULT_LOOK, lookPreview } from './character';
import {
  PLACES, NPCS, NpcDef, ENCOUNTERS, SHOP, REWARD_ITEMS, ShopItem, MISSION_REWARD, xpToNext, LEVEL_TITLE,
  CATS, WALLET_POS, BED_POS,
} from './data_v05';
import { U, ax, MAP_PX, Rect, TREES, LAMPS, renderMap, buildColliders, placeRect, doorSide } from './map_v05';
import { esc, toast, modal, won } from '../ui/common';
import { TalkOverlay, sfx } from '../ui/dialogue';
import type { Emotion } from '../data/stages';

export interface WorldSave {
  day: number;
  clock: number; // 분 (08:00 = 480)
  level: number;
  xp: number;
  money: number;
  look: Look;
  owned: string[];
  dayFlags: string[]; // 하루마다 초기화: 'commute', 'late', 'mission:MS_301', 'enc:courier' ...
  flags: string[]; // 영구: 'wallet:have', 'wallet:done', 'cat:0', 'cats:done'
  pos: [number, number];
}

export const HOME_START: [number, number] = [-24, 12.5];

export function newWorldSave(): WorldSave {
  return { day: 1, clock: 8 * 60, level: 1, xp: 0, money: 5000, look: { ...DEFAULT_LOOK }, owned: [], dayFlags: [], flags: [], pos: [...HOME_START] };
}

export interface WorldHooks {
  save: () => WorldSave;
  battery: () => number;
  setBattery: (v: number) => void;
  persist: () => void;
  startMission: (missionId: string, done: (grade: string) => void) => void;
  playerName: () => string;
  openMenu: () => void;
  playMinigame: (id: string) => Promise<'great' | 'normal' | 'fail'>;
}

/** 미션 시작 시각 (이 시각이 지나면 오늘은 못 함) */
const MISSION_TIME: Record<string, number> = { MS_301: 16 * 60 + 50, MS_201: 19 * 60, MS_101: 20 * 60 };
const MISSION_NAME: Record<string, string> = { MS_301: '6시 칼퇴 작전', MS_201: '애프터 확정 작전', MS_101: '뒤풀이 탈출 작전' };
const MISSION_WHERE: Record<string, string> = { MS_301: '회사 앞 박 팀장', MS_201: '파스타 가게 앞 지우', MS_101: '공원 러닝크루 하나' };

const clockText = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const MIN_PER_SEC = 4; // 현실 1초 = 게임 4분
const OFFICE_DOOR: [number, number] = [26, -15];
const SPEED = 6.5;

interface Npc {
  def: NpcDef;
  x: number;
  z: number;
  dir: Dir;
  moving: boolean;
  fwd: boolean;
}

interface Interactable {
  label: string;
  marker?: string;
  x: number;
  z: number;
  action: () => void;
  visible: () => boolean;
}

interface Target {
  x: number;
  z: number;
  icon: string;
  label: string;
}

export class World {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private map: HTMLCanvasElement;
  private colliders: Rect[];
  private npcs: Npc[] = [];
  private interactables: Interactable[] = [];
  private keys = new Set<string>();
  private joy = { x: 0, y: 0, active: false };
  private paused = false;
  private running = false;
  private last = 0;
  private t = 0;
  private clockAcc = 0;
  private hud: HTMLElement;
  private actionBtn!: HTMLButtonElement;
  private mini!: HTMLCanvasElement;
  private miniAcc = 0;
  private current: Interactable | null = null;
  private px: number;
  private pz: number;
  private dir: Dir = 0;
  private moving = false;
  private cssW = 1;
  private cssH = 1;
  private dpr = 1;
  /** 도트 1개가 화면에서 차지하는 CSS 픽셀 */
  private P = 2;

  constructor(private host: HTMLElement, private hooks: WorldHooks) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'world-canvas';
    host.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d')!;
    this.map = renderMap();
    this.colliders = buildColliders();
    const s = hooks.save();
    [this.px, this.pz] = this.free(s.pos[0], s.pos[1]);
    this.buildNpcs();
    this.buildPickups();
    this.buildActivities();
    this.hud = document.createElement('div');
    this.hud.className = 'world-hud';
    host.appendChild(this.hud);
    this.buildHud();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  /** 저장된 위치가 건물 안이면 문 앞으로 옮긴다 */
  private free(x: number, z: number): [number, number] {
    const [cx, cz] = this.collide(x, z);
    if (Math.hypot(cx - x, cz - z) > 0.01 || this.colliders.some((c) => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ)) return [...HOME_START];
    return [cx, cz];
  }

  private buildNpcs() {
    for (const def of NPCS) {
      this.npcs.push({ def, x: def.x, z: def.z, dir: def.kind === 'encounter' ? 0 : def.z > 0 ? 1 : 0, moving: false, fwd: true });
      if (def.kind !== 'encounter') {
        this.interactables.push({
          label: def.kind === 'shop' ? `🛒 ${def.name}` : `💬 ${def.name.split(' ')[0]}`,
          x: def.x,
          z: def.z,
          visible: () => true,
          action: () => this.talkTo(def),
        });
      }
    }
    this.interactables.push({
      label: '🛏️ 잠자기',
      x: BED_POS[0],
      z: BED_POS[1],
      visible: () => true,
      action: () => this.sleep(),
    });
  }

  private buildPickups() {
    const s = this.hooks.save();
    CATS.forEach(([x, z], i) =>
      this.interactables.push({
        label: '🐈 쓰다듬기',
        x,
        z,
        visible: () => !s.flags.includes(`cat:${i}`),
        action: () => this.petCat(i),
      }),
    );
    this.interactables.push({
      label: '👛 지갑 줍기',
      x: WALLET_POS[0],
      z: WALLET_POS[1],
      visible: () => this.walletVisible(),
      action: () => {
        const sv = this.hooks.save();
        sv.flags.push('wallet:have');
        this.hooks.persist();
        toast('👛 지갑을 주웠다. 안에 할머니 사진이... 옆집 할머니 것 같다!', 'info');
        this.refreshHud();
      },
    });
  }

  /** 동네 활동: 미니게임으로 돈·경험치를 번다 (하루 한 번씩) */
  private buildActivities() {
    const ACTS: { id: string; label: string; x: number; z: number; mg: string; from: number; to: number; minutes: number; battery: number;
      need?: string; reward: Record<'great' | 'normal' | 'fail', [number, number]>; title: string }[] = [
      { id: 'cafe', label: '☕ 카페 알바 (주문 기억하기)', x: 8, z: -25.6, mg: 'MG_702', from: 10 * 60, to: 16 * 60, minutes: 60, battery: -10,
        reward: { great: [9000, 30], normal: [6000, 20], fail: [1000, 5] }, title: '☕ 카페 알바' },
      { id: 'meeting', label: '📊 오전 회의 (말 끊기 타이밍)', x: 30, z: -15.6, mg: 'MG_701', from: 9 * 60, to: 12 * 60, minutes: 60, battery: -8, need: 'commute',
        reward: { great: [5000, 35], normal: [3000, 25], fail: [0, 10] }, title: '📊 오전 회의' },
      { id: 'bench', label: '🪑 벤치에서 사람 구경 (표정 읽기)', x: -28.5, z: -11.8, mg: 'MG_703', from: 8 * 60, to: 21 * 60, minutes: 30, battery: 10,
        reward: { great: [0, 40], normal: [0, 25], fail: [0, 10] }, title: '🪑 사람 구경' },
    ];
    for (const a of ACTS) {
      this.interactables.push({
        label: a.label,
        marker: a.label.split(' ')[0],
        x: a.x,
        z: a.z,
        visible: () => {
          const s = this.hooks.save();
          return !s.dayFlags.includes(`job:${a.id}`) && s.clock >= a.from && s.clock <= a.to && (!a.need || s.dayFlags.includes(a.need));
        },
        action: async () => {
          const s = this.hooks.save();
          s.dayFlags.push(`job:${a.id}`);
          this.stop();
          const res = await this.hooks.playMinigame(a.mg);
          this.start();
          s.clock += a.minutes;
          this.hooks.setBattery(Math.max(0, Math.min(100, this.hooks.battery() + a.battery)));
          const [money, xp] = a.reward[res];
          this.reward(money, xp, `${a.title} ${res === 'great' ? '대성공!' : res === 'normal' ? '성공!' : '아쉽다…'}`);
        },
      });
    }
  }

  private walletVisible() {
    const s = this.hooks.save();
    return !s.flags.includes('wallet:have') && !s.flags.includes('wallet:done');
  }

  // ---------- HUD ----------
  private buildHud() {
    this.hud.innerHTML = `
      <div class="hud-top">
        <div class="hud-time"><b id="hDay"></b><span id="hClock"></span></div>
        <div class="hud-stats">
          <div class="hud-lv"><b id="hLv"></b><div class="xp"><div id="hXp"></div></div></div>
          <div class="hud-money" id="hMoney"></div>
          <div class="hud-bat" id="hBat"></div>
        </div>
      </div>
      <div class="hud-next" id="hNext"></div>
      <button class="hud-mini" id="hMini" aria-label="지도 열기"><canvas id="miniCv"></canvas><span>🗺️ 지도</span></button>
      <div class="hud-btns">
        <button id="hQuest" class="hud-btn">📋<span>퀘스트</span></button>
        <button id="hWard" class="hud-btn">👕<span>옷장</span></button>
        <button id="hMenu" class="hud-btn">🎭<span>캐릭터</span></button>
      </div>
      <div class="joy" id="joy"><div class="joy-knob" id="joyKnob"></div></div>
      <button class="hud-action" id="hAction" hidden></button>`;
    this.actionBtn = this.hud.querySelector('#hAction') as HTMLButtonElement;
    this.actionBtn.onclick = () => this.current?.action();
    this.mini = this.hud.querySelector('#miniCv') as HTMLCanvasElement;
    (this.hud.querySelector('#hMini') as HTMLButtonElement).onclick = () => this.openMap();
    (this.hud.querySelector('#hQuest') as HTMLButtonElement).onclick = () => this.openQuests();
    (this.hud.querySelector('#hWard') as HTMLButtonElement).onclick = () => this.openWardrobe();
    (this.hud.querySelector('#hMenu') as HTMLButtonElement).onclick = () => {
      this.stop();
      this.hooks.openMenu();
    };
    this.refreshHud();
  }

  private refreshHud() {
    const s = this.hooks.save();
    const q = (id: string) => this.hud.querySelector(id) as HTMLElement;
    q('#hDay').textContent = `${s.day}일차`;
    q('#hClock').textContent = clockText(s.clock);
    q('#hClock').classList.toggle('night', s.clock >= 21 * 60);
    q('#hLv').textContent = `Lv.${s.level} ${LEVEL_TITLE[Math.min(s.level, LEVEL_TITLE.length - 1)]}`;
    q('#hXp').style.width = `${Math.min(100, (s.xp / xpToNext(s.level)) * 100)}%`;
    q('#hMoney').textContent = `💰 ${won(s.money)}`;
    q('#hBat').textContent = `🔋 ${this.hooks.battery()}`;
    const t = this.target();
    q('#hNext').textContent = t ? `${t.icon} ${t.label}` : '🗺️ 자유 시간: 동네를 돌아다니며 서브 퀘스트를 찾아보세요';
  }

  /** 지금 가장 할 만한 일과 그 위치 */
  private target(): Target | null {
    const s = this.hooks.save();
    if (!s.dayFlags.includes('commute') && !s.dayFlags.includes('late') && s.clock <= 9 * 60)
      return { x: OFFICE_DOOR[0], z: OFFICE_DOOR[1], icon: '🏢', label: '9시 전에 회사 앞까지 출근하기' };
    for (const id of ['MS_301', 'MS_201', 'MS_101']) {
      if (s.dayFlags.includes(`mission:${id}`)) continue;
      if (s.clock <= MISSION_TIME[id]) {
        const n = NPCS.find((x) => x.missionId === id)!;
        return { x: n.x, z: n.z, icon: '🎯', label: `${clockText(MISSION_TIME[id])} ${MISSION_NAME[id]} · ${MISSION_WHERE[id]}` };
      }
    }
    if (s.clock >= 21 * 60) return { x: BED_POS[0], z: BED_POS[1], icon: '🛏️', label: '집 앞에서 잠자기 → 다음 날' };
    if (s.flags.includes('wallet:have')) {
      const n = NPCS.find((x) => x.id === 'grandma')!;
      return { x: n.x, z: n.z, icon: '👛', label: '지갑을 옆집 할머니께 가져다 드리기' };
    }
    return null;
  }

  // ---------- 입력 ----------
  private bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if ((e.key === ' ' || e.key === 'e') && this.current && !this.paused && this.running && !document.querySelector('.modal, .talk-overlay')) this.current.action();
      if (e.key === 'm' && this.running && !this.paused) this.openMap();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    const joy = this.hud.querySelector('#joy') as HTMLElement;
    const knob = this.hud.querySelector('#joyKnob') as HTMLElement;
    let id = -1;
    const move = (e: PointerEvent) => {
      const r = joy.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      this.joy = { x: dx, y: dy, active: true };
      knob.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`;
    };
    joy.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      joy.setPointerCapture(id);
      move(e);
    });
    joy.addEventListener('pointermove', (e) => e.pointerId === id && move(e));
    const end = () => {
      id = -1;
      this.joy = { x: 0, y: 0, active: false };
      knob.style.transform = '';
    };
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
  }

  // ---------- 루프 ----------
  start() {
    this.host.hidden = false;
    this.paused = false;
    this.resize();
    this.refreshHud();
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    this.hooks.save().pos = [this.px, this.pz];
    this.hooks.persist();
    this.host.hidden = true;
  }

  private resize() {
    this.cssW = this.host.clientWidth || window.innerWidth;
    this.cssH = this.host.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    // 폰 화면에 약 8~9칸이 보이도록 도트 크기를 정한다 (정수 배율 → 또렷한 도트)
    this.P = Math.max(2, Math.min(4, Math.round(this.cssW / (8.5 * U))));
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    const mr = 96;
    this.mini.width = mr * this.dpr;
    this.mini.height = mr * this.dpr;
  }

  private collide(x: number, z: number, r = 0.38): [number, number] {
    for (const c of this.colliders) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d === 0) {
          const pushes = [c.minX - r - x, c.maxX + r - x, c.minZ - r - z, c.maxZ + r - z];
          const abs = pushes.map(Math.abs);
          const k = abs.indexOf(Math.min(...abs));
          if (k < 2) x += pushes[k];
          else z += pushes[k];
        } else {
          x = cx + (dx / d) * r;
          z = cz + (dz / d) * r;
        }
      }
    }
    return [x, z];
  }

  private update(dt: number) {
    this.t += dt;
    const s = this.hooks.save();
    // 이동
    let mx = this.joy.x;
    let mz = this.joy.y;
    if (this.keys.has('w') || this.keys.has('arrowup')) mz -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) mz += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    const len = Math.hypot(mx, mz);
    this.moving = len > 0.15;
    if (this.moving) {
      const sp = SPEED * Math.min(1, len);
      const [cx, cz] = this.collide(this.px + (mx / Math.max(1, len)) * sp * dt, this.pz + (mz / Math.max(1, len)) * sp * dt);
      this.px = cx;
      this.pz = cz;
      this.dir = dirOf(mx, mz, this.dir);
    }

    // NPC
    for (const n of this.npcs) {
      if (!n.def.patrol) continue;
      const [a, b] = n.def.patrol;
      const to = n.fwd ? b : a;
      const dx = to[0] - n.x;
      const dz = to[1] - n.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) n.fwd = !n.fwd;
      else {
        n.x += (dx / d) * 2.2 * dt;
        n.z += (dz / d) * 2.2 * dt;
        n.moving = true;
        if (Math.abs(dx) > Math.abs(dz)) n.dir = dx < 0 ? 2 : 3;
        else n.dir = dz < 0 ? 1 : 0;
      }
      // 부딪침 → 돌발 만남
      if (!s.dayFlags.includes(`enc:${n.def.id}`) && Math.hypot(this.px - n.x, this.pz - n.z) < 1.1) {
        this.encounter(n.def.id);
        return;
      }
    }

    // 상호작용 대상
    let best: Interactable | null = null;
    let bestD = 2.2;
    for (const it of this.interactables) {
      if (!it.visible()) continue;
      const d = Math.hypot(this.px - it.x, this.pz - it.z);
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    if (best !== this.current) {
      this.current = best;
      this.actionBtn.hidden = !best;
      if (best) this.actionBtn.textContent = best.label;
    }

    // 출근 체크
    if (!s.dayFlags.includes('commute') && !s.dayFlags.includes('late') && Math.hypot(this.px - OFFICE_DOOR[0], this.pz - OFFICE_DOOR[1]) < 4) {
      if (s.clock <= 9 * 60) {
        s.dayFlags.push('commute');
        this.reward(3000, 20, '⏰ 지각 없이 출근 완료!');
      } else {
        s.dayFlags.push('late');
        toast('😰 지각이다... 팀장 눈치가 보인다', 'bad');
        this.refreshHud();
      }
    }

    // 시간 흐름
    this.clockAcc += dt * MIN_PER_SEC;
    if (this.clockAcc >= 1) {
      const add = Math.floor(this.clockAcc);
      this.clockAcc -= add;
      s.clock += add;
      if (s.clock >= 24 * 60) {
        toast('😵 너무 늦게까지 돌아다녔다... 집에서 쓰러지듯 잠들었다', 'bad');
        this.nextDay(60);
        return;
      }
      s.pos = [Math.round(this.px * 10) / 10, Math.round(this.pz * 10) / 10];
      this.refreshHud();
    }
    this.miniAcc += dt;
    if (this.miniAcc > 0.2) {
      this.miniAcc = 0;
      this.drawMini();
    }
  }

  // ---------- 그리기 ----------
  private draw() {
    const g = this.g;
    const s = this.hooks.save();
    const k = this.P * this.dpr;
    const viewW = this.cssW / this.P;
    const viewH = this.cssH / this.P;
    // 화면 위쪽은 HUD가 가리므로 캐릭터를 조금 아래에 둔다
    let camX = ax(this.px) - viewW / 2;
    let camY = ax(this.pz) - viewH * 0.55;
    camX = Math.round(Math.max(0, Math.min(MAP_PX - viewW, camX)));
    camY = Math.round(Math.max(0, Math.min(MAP_PX - viewH, camY)));
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#3b8fd0';
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(k, 0, 0, k, -camX * k, -camY * k);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.map, 0, 0);

    // y 순서대로 그릴 것들
    const items: { y: number; draw: () => void }[] = [];
    const frame = Math.floor(this.t * 8) % 2;
    items.push({ y: ax(this.pz), draw: () => drawCharacter(g, s.look, ax(this.px), ax(this.pz), this.dir, frame, this.moving) });
    for (const n of this.npcs) {
      const look = { ...DEFAULT_LOOK, ...n.def.look };
      items.push({ y: ax(n.z), draw: () => drawCharacter(g, look, ax(n.x), ax(n.z), n.dir, Math.floor((this.t + n.def.x) * 6) % 2, n.moving) });
    }
    for (const [x, z] of TREES) items.push({ y: ax(z), draw: () => this.drawTree(ax(x), ax(z)) });
    for (const [x, z] of LAMPS) items.push({ y: ax(z), draw: () => this.drawLamp(ax(x), ax(z)) });
    CATS.forEach(([x, z], i) => {
      if (!s.flags.includes(`cat:${i}`)) items.push({ y: ax(z), draw: () => this.drawCat(ax(x), ax(z), i) });
    });
    if (this.walletVisible()) items.push({ y: ax(WALLET_POS[1]), draw: () => this.drawWallet(ax(WALLET_POS[0]), ax(WALLET_POS[1])) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    // 밤
    g.setTransform(1, 0, 0, 1, 0, 0);
    const dark = this.darkness(s.clock);
    if (dark > 0) {
      g.fillStyle = `rgba(18,16,60,${dark})`;
      g.fillRect(0, 0, this.canvas.width, this.canvas.height);
      g.globalCompositeOperation = 'lighter';
      const lights: [number, number][] = [...LAMPS];
      for (const p of PLACES) {
        const r = placeRect(p);
        lights.push([p.x, doorSide(p) === 'north' ? r.minZ - 0.5 : r.maxZ + 0.5]);
      }
      for (const [x, z] of lights) {
        const sx = (ax(x) - camX) * k;
        const sy = (ax(z) - camY) * k;
        const rad = 3.2 * U * k;
        if (sx < -rad || sy < -rad || sx > this.canvas.width + rad || sy > this.canvas.height + rad) continue;
        const gr = g.createRadialGradient(sx, sy, 0, sx, sy, rad);
        gr.addColorStop(0, `rgba(255,214,140,${dark * 0.9})`);
        gr.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = gr;
        g.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
      }
      g.globalCompositeOperation = 'source-over';
    }

    // 글자 (선명하게 CSS 픽셀 단위로)
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const toScreen = (x: number, z: number): [number, number] => [(ax(x) - camX) * this.P, (ax(z) - camY) * this.P];
    for (const p of PLACES) {
      const r = placeRect(p);
      const [sx, sy] = toScreen(p.x, r.minZ + 0.6);
      this.label(p.sign ?? `🏢 ${p.name}`, sx, sy, '#fff', 'rgba(35,25,74,.85)', 13);
    }
    for (const n of this.npcs) {
      const [sx, sy] = toScreen(n.x, n.z);
      const head = sy - 19 * this.P;
      if (n.def.kind !== 'encounter' || Math.hypot(n.x - this.px, n.z - this.pz) < 6) this.label(n.def.name.split(' ')[0], sx, head - 4, '#fff', 'rgba(20,12,45,.7)', 11);
      if (this.markerVisible(n.def)) {
        const bob = Math.sin(this.t * 4) * 3;
        this.label(n.def.kind === 'shop' ? '🛒' : n.def.kind === 'mission' ? '🎯' : '❗', sx, head - 24 + bob, '#23194a', '#ffd166', 14);
      }
    }
    for (const it of this.interactables) {
      if (!it.marker || !it.visible()) continue;
      const [sx, sy] = toScreen(it.x, it.z);
      this.label(`${it.marker}🎮`, sx, sy - 6 + Math.sin(this.t * 4 + it.x) * 3, '#23194a', '#8ef0c4', 13);
    }
    const [hx, hy] = toScreen(BED_POS[0], BED_POS[1]);
    if (s.clock >= 21 * 60) this.label('🛏️ 여기서 자기', hx, hy - 10 + Math.sin(this.t * 4) * 3, '#23194a', '#ffd166', 12);
    this.drawGoalArrow(toScreen);
  }

  private label(text: string, x: number, y: number, color: string, bg: string, size: number) {
    const g = this.g;
    g.font = `800 ${size}px Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
    const w = g.measureText(text).width + 10;
    const h = size + 8;
    if (x + w / 2 < 0 || x - w / 2 > this.cssW || y < -h || y > this.cssH + h) return;
    g.fillStyle = bg;
    g.fillRect(Math.round(x - w / 2), Math.round(y - h), Math.round(w), h);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 2);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x, y - h / 2 + 1);
  }

  /** 목적지가 화면 밖이면 가장자리에 화살표 */
  private drawGoalArrow(toScreen: (x: number, z: number) => [number, number]) {
    const t = this.target();
    if (!t) return;
    const [sx, sy] = toScreen(t.x, t.z);
    const top = 190;
    const bottom = this.cssH - 170;
    const m = 28;
    if (sx > m && sx < this.cssW - m && sy > top && sy < bottom) {
      this.label('⬇', sx, sy - 22 * this.P - 26 + Math.sin(this.t * 5) * 4, '#fff', '#ff4f6d', 14);
      return;
    }
    const [px, py] = toScreen(this.px, this.pz);
    const ang = Math.atan2(sy - py, sx - px);
    const cx = Math.max(m, Math.min(this.cssW - m, px + Math.cos(ang) * 1000));
    const cy = Math.max(top, Math.min(bottom, py + Math.sin(ang) * 1000));
    // 가장자리 교점 근사
    const tx = Math.cos(ang) === 0 ? Infinity : ((Math.cos(ang) > 0 ? this.cssW - m : m) - px) / Math.cos(ang);
    const ty = Math.sin(ang) === 0 ? Infinity : ((Math.sin(ang) > 0 ? bottom : top) - py) / Math.sin(ang);
    const tt = Math.min(Math.abs(tx), Math.abs(ty));
    const ex = isFinite(tt) ? px + Math.cos(ang) * tt : cx;
    const ey = isFinite(tt) ? py + Math.sin(ang) * tt : cy;
    const g = this.g;
    g.save();
    g.translate(ex, ey);
    g.rotate(ang);
    g.fillStyle = '#ff4f6d';
    g.strokeStyle = '#fff';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(16, 0);
    g.lineTo(-10, -12);
    g.lineTo(-4, 0);
    g.lineTo(-10, 12);
    g.closePath();
    g.stroke();
    g.fill();
    g.restore();
    const dist = Math.round(Math.hypot(t.x - this.px, t.z - this.pz));
    this.label(`${t.icon} ${dist}m`, ex - Math.cos(ang) * 34, ey - Math.sin(ang) * 26 + 10, '#fff', 'rgba(20,12,45,.8)', 11);
  }

  private darkness(clock: number) {
    const h = clock / 60;
    if (h < 17) return 0;
    if (h < 19) return ((h - 17) / 2) * 0.25;
    if (h < 21) return 0.25 + ((h - 19) / 2) * 0.3;
    return 0.55;
  }

  private drawTree(x: number, y: number) {
    const g = this.g;
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.fillRect(x - 9, y - 1, 18, 4);
    g.fillStyle = '#7a5230';
    g.fillRect(x - 2, y - 8, 4, 9);
    const c = (cx: number, cy: number, r: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(x + cx - r, y + cy - r + 2, r * 2, r * 2 - 4);
      g.fillRect(x + cx - r + 2, y + cy - r, r * 2 - 4, r * 2);
    };
    c(0, -16, 10, '#2f7a3c');
    c(-1, -18, 8, '#3f9a4a');
    c(-3, -21, 4, '#5fbf5f');
  }

  private drawLamp(x: number, y: number) {
    const g = this.g;
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.fillRect(x - 3, y, 6, 2);
    g.fillStyle = '#555';
    g.fillRect(x - 1, y - 26, 2, 27);
    g.fillStyle = '#333';
    g.fillRect(x - 4, y - 29, 8, 3);
    g.fillStyle = '#ffe9a8';
    g.fillRect(x - 3, y - 26, 6, 2);
  }

  private drawCat(x: number, y: number, i: number) {
    const g = this.g;
    const col = ['#f4a259', '#333', '#ddd'][i];
    const tail = Math.floor(this.t * 3 + i) % 2;
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.fillRect(x - 5, y, 10, 2);
    g.fillStyle = col;
    g.fillRect(x - 5, y - 5, 8, 5);
    g.fillRect(x + 2, y - 8, 5, 5);
    g.fillRect(x + 2, y - 10, 1, 2);
    g.fillRect(x + 6, y - 10, 1, 2);
    g.fillRect(x - 7, y - 7 - tail, 2, 4);
    g.fillStyle = '#111';
    g.fillRect(x + 3, y - 6, 1, 1);
    g.fillRect(x + 5, y - 6, 1, 1);
  }

  private drawWallet(x: number, y: number) {
    const g = this.g;
    g.fillStyle = '#8b2e2e';
    g.fillRect(x - 4, y - 3, 8, 5);
    g.fillStyle = '#b04545';
    g.fillRect(x - 4, y - 3, 8, 1);
    if (Math.floor(this.t * 3) % 2) {
      g.fillStyle = '#fff6b0';
      g.fillRect(x + 4, y - 7, 1, 3);
      g.fillRect(x + 3, y - 6, 3, 1);
    }
  }

  // ---------- 지도 ----------
  private drawMini() {
    if (!this.mini) return;
    const g = this.mini.getContext('2d')!;
    const W = this.mini.width;
    // 플레이어 주변 40칸을 보여 준다
    const span = 40 * U;
    let sx = ax(this.px) - span / 2;
    let sy = ax(this.pz) - span / 2;
    sx = Math.max(0, Math.min(MAP_PX - span, sx));
    sy = Math.max(0, Math.min(MAP_PX - span, sy));
    g.imageSmoothingEnabled = true;
    g.drawImage(this.map, sx, sy, span, span, 0, 0, W, W);
    const f = W / span;
    const dot = (x: number, z: number, col: string, r: number) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc((ax(x) - sx) * f, (ax(z) - sy) * f, r, 0, Math.PI * 2);
      g.fill();
    };
    const t = this.target();
    const r = W / 40;
    if (t) {
      dot(t.x, t.z, '#fff', r * 2.2);
      dot(t.x, t.z, '#ff4f6d', r * 1.6);
    }
    dot(this.px, this.pz, '#fff', r * 1.8);
    dot(this.px, this.pz, '#4f6dff', r * 1.2);
  }

  private openMap() {
    const s = this.hooks.save();
    this.pause(true);
    const m = modal(`<h3>🗺️ 동네 지도</h3>
      <div class="bigmap"><canvas id="bigmap"></canvas></div>
      <div class="map-legend"><span><i style="background:#4f6dff"></i>나</span><span><i style="background:#ff4f6d"></i>지금 목표</span><span>🎯 미션</span><span>❗ 퀘스트</span><span>🛒 상점</span><span>🎮 동네 활동</span><span>🛏️ 잠자는 곳</span></div>
      <button class="btn primary" id="ok">닫기</button>`);
    const cv = m.querySelector('#bigmap') as HTMLCanvasElement;
    const css = Math.min(440, window.innerWidth - 32);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = css * dpr;
    cv.height = css * dpr;
    cv.style.width = `${css}px`;
    cv.style.height = `${css}px`;
    const g = cv.getContext('2d')!;
    // 강 아래쪽(-50~-40)도 포함해 전체를 그린다
    g.drawImage(this.map, 0, 0, MAP_PX, MAP_PX, 0, 0, cv.width, cv.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const f = css / MAP_PX;
    const P = (x: number, z: number): [number, number] => [ax(x) * f, ax(z) * f];
    const tag = (text: string, x: number, y: number, bg = 'rgba(35,25,74,.85)', fg = '#fff', size = 11) => {
      g.font = `800 ${size}px Pretendard, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
      const w = g.measureText(text).width + 8;
      const bx = Math.max(2, Math.min(css - w - 2, x - w / 2));
      g.fillStyle = bg;
      g.fillRect(bx, y - size / 2 - 3, w, size + 6);
      g.fillStyle = fg;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(text, bx + 4, y + 1);
    };
    for (const p of PLACES) {
      const [x, y] = P(p.x, p.z);
      tag(p.name, x, y);
    }
    const [px0, py0] = P(-27, -24);
    tag('🌳 공원', px0, py0 - 22, 'rgba(47,122,60,.85)');
    const [rx, ry] = P(0, -45);
    tag('🌊 강', rx + 60, ry, 'rgba(30,90,160,.85)');
    for (const n of NPCS) {
      if (n.kind === 'encounter') continue;
      if (n.kind === 'mission' && !this.markerVisible(n)) continue;
      if (n.kind === 'quest' && !s.flags.includes('wallet:have') && s.flags.includes('wallet:done')) continue;
      const [x, y] = P(n.x, n.z);
      const icon = n.kind === 'shop' ? '🛒' : n.kind === 'mission' ? '🎯' : '❗';
      const extra = n.missionId ? ` ${clockText(MISSION_TIME[n.missionId])}` : '';
      tag(`${icon}${extra}`, x, y + 16, '#ffd166', '#23194a', 11);
    }
    for (const it of this.interactables) {
      if (!it.marker || !it.visible()) continue;
      const [x, y] = P(it.x, it.z);
      tag(`${it.marker}🎮`, x, y + 14, '#8ef0c4', '#23194a', 11);
    }
    const [bx, by] = P(BED_POS[0], BED_POS[1]);
    tag('🛏️', bx - 18, by, '#ffd166', '#23194a', 11);
    const t = this.target();
    if (t) {
      const [x, y] = P(t.x, t.z);
      g.strokeStyle = '#ff4f6d';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.stroke();
    }
    const [mx, my] = P(this.px, this.pz);
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(mx, my, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4f6dff';
    g.beginPath();
    g.arc(mx, my, 5, 0, Math.PI * 2);
    g.fill();
    tag('나', mx, my - 14, '#4f6dff');
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
    };
  }

  private markerVisible(def: NpcDef): boolean {
    const s = this.hooks.save();
    if (def.kind === 'shop') return true;
    if (def.kind === 'quest') return s.flags.includes('wallet:have');
    if (def.missionId) return !s.dayFlags.includes(`mission:${def.missionId}`) && s.clock <= MISSION_TIME[def.missionId];
    return false;
  }

  // ---------- 보상·성장 ----------
  reward(money: number, xp: number, why: string) {
    const s = this.hooks.save();
    s.money += money;
    s.xp += xp;
    toast(`${why} ${money ? `+${won(money)} ` : ''}+${xp}XP`, 'good');
    while (s.xp >= xpToNext(s.level)) {
      s.xp -= xpToNext(s.level);
      s.level += 1;
      setTimeout(() => {
        const m = modal(`<div class="levelup">⬆️</div><h3>레벨 업! Lv.${s.level}</h3>
          <p>${esc(LEVEL_TITLE[Math.min(s.level, LEVEL_TITLE.length - 1)])}이(가) 되었다. 편의점에 새 아이템이 들어왔을지도?</p>
          <button class="btn primary" id="ok">좋아!</button>`);
        (m.querySelector('#ok') as HTMLButtonElement).onclick = () => m.remove();
      }, 600);
    }
    this.hooks.persist();
    this.refreshHud();
  }

  // ---------- 상호작용 ----------
  private pause(p: boolean) {
    this.paused = p;
    this.joy = { x: 0, y: 0, active: false };
    this.keys.clear();
  }

  private talkTo(def: NpcDef) {
    const s = this.hooks.save();
    if (def.kind === 'shop') return this.openShop();
    if (def.kind === 'quest') {
      if (s.flags.includes('wallet:have')) {
        s.flags = s.flags.filter((f) => f !== 'wallet:have');
        s.flags.push('wallet:done');
        this.dialog(def.name, '어머나, 내 지갑! 손주 사진이 들어 있어서 얼마나 찾았는데... 고마워요, 이거 받아요!', () =>
          this.reward(10000, 30, '👛 지갑을 찾아 드렸다!'), this.lookOf(def.id), 'CRY');
      } else if (s.flags.includes('wallet:done')) {
        this.dialog(def.name, '오늘도 출근하나 봐요? 밥 잘 챙겨 먹고 다녀요~', undefined, this.lookOf(def.id), 'HAPPY');
      } else {
        this.dialog(def.name, '아이고, 어제 공원 산책하다가 지갑을 잃어버렸지 뭐야... 혹시 보면 좀 알려줘요.', undefined, this.lookOf(def.id), 'PANIC');
      }
      return;
    }
    if (def.missionId) {
      const id = def.missionId;
      if (s.dayFlags.includes(`mission:${id}`)) return this.dialog(def.name, '오늘은 이미 이야기 나눴잖아요. 내일 또 봐요!', undefined, this.lookOf(def.id), 'HAPPY');
      const at = MISSION_TIME[id];
      if (s.clock > at) return this.dialog(def.name, `(${clockText(at)}가 이미 지났다. ${MISSION_NAME[id]}은(는) 내일 다시 할 수 있다.)`, undefined, this.lookOf(def.id), 'SUSPECT');
      const GREET: Record<string, [string, Emotion]> = {
        MS_301: ['이 대리, 퇴근 전에 잠깐 나 좀 보지. 할 얘기가 좀 많아.', 'SUSPECT'],
        MS_201: ['아, 안녕하세요! 혹시... 오늘 소개팅 상대분 맞으시죠?', 'HAPPY'],
        MS_101: ['어? 오늘 처음 오신 분이죠! 저희 크루 뒤풀이 엄청 재밌어요!', 'HAPPY'],
      };
      const [greet, emo] = GREET[id] ?? ['잠깐 얘기 좀 할까요?', 'NORMAL'];
      this.pause(true);
      const t = new TalkOverlay(`🎯 ${MISSION_NAME[id]} · ${clockText(at)}`);
      const go = () => {
        s.clock = at;
        s.dayFlags.push(`mission:${id}`);
        this.hooks.persist();
        this.stop();
        this.hooks.startMission(id, (grade) => {
          const r = MISSION_REWARD[grade] ?? MISSION_REWARD.F;
          // 미션이 끝나면 대략 40~70분이 흐른다
          s.clock = Math.max(s.clock, at + 60);
          this.start();
          this.reward(r.money, r.xp, `🎯 ${MISSION_NAME[id]} ${grade}등급!`);
        });
      };
      void (async () => {
        await t.say({ name: def.name, look: this.lookOf(def.id), emotion: emo, text: greet });
        const pick = await t.choose([`🎯 미션 시작 (시간이 ${clockText(at)}로 넘어가요)`, '나중에 다시 오기']);
        t.close();
        if (pick === 1) return this.pause(false);
        go();
      })();
    }
  }

  /** 초상화와 함께 한 글자씩 나오는 짧은 대화 */
  private dialog(name: string, line: string, after?: () => void, look?: Look, emotion: Emotion = 'NORMAL') {
    this.pause(true);
    const me = name === '나';
    const t = new TalkOverlay();
    void (async () => {
      await t.say({ name, look: look ?? this.hooks.save().look, emotion, text: line, me });
      await t.waitTap('확인');
      t.close();
      this.pause(false);
      after?.();
    })();
  }

  private lookOf(npcId: string): Look {
    const n = NPCS.find((x) => x.id === npcId);
    return { ...DEFAULT_LOOK, ...(n?.look ?? {}) };
  }

  private encounter(npcId: string) {
    const s = this.hooks.save();
    const e = ENCOUNTERS.find((x) => x.npcId === npcId);
    s.dayFlags.push(`enc:${npcId}`);
    if (!e) return;
    this.pause(true);
    sfx.stamp();
    const def = NPCS.find((x) => x.id === npcId)!;
    const look = this.lookOf(npcId);
    const shuffled = [...e.choices].sort(() => Math.random() - 0.5);
    const t = new TalkOverlay(`💥 ${e.title}`);
    void (async () => {
      await t.say({ name: def.name, look, emotion: e.emotion, text: e.line });
      const c = shuffled[await t.choose(shuffled.map((x) => x.text))];
      await t.say({ name: '나', look: s.look, emotion: 'NORMAL', text: c.text, me: true });
      await t.waitTap();
      await t.say({ name: def.name, look, emotion: c.emotion, text: c.reaction });
      await t.waitTap('확인');
      t.close();
      this.pause(false);
      this.hooks.setBattery(Math.max(0, Math.min(100, this.hooks.battery() + c.battery)));
      if (c.xp || c.money) this.reward(c.money, c.xp, '💥 돌발 만남 해결!');
      else this.refreshHud();
    })();
  }

  private petCat(i: number) {
    const s = this.hooks.save();
    s.flags.push(`cat:${i}`);
    const n = s.flags.filter((f) => f.startsWith('cat:')).length;
    if (n >= CATS.length && !s.flags.includes('cats:done')) {
      s.flags.push('cats:done');
      s.owned.push('catears');
      this.reward(0, 40, `🐈 동네 고양이 ${CATS.length}마리 모두 찾았다! 고양이 귀 머리띠 획득!`);
    } else {
      this.hooks.persist();
      toast(`🐈 냐옹~ (동네 고양이 ${n}/${CATS.length})`, 'info');
    }
  }

  private sleep() {
    const s = this.hooks.save();
    if (s.clock < 21 * 60) {
      this.dialog('나', `아직 ${clockText(s.clock)}... 잠들기엔 이르다. (21시 이후에 잘 수 있어요)`);
      return;
    }
    this.nextDay(100);
  }

  private nextDay(battery: number) {
    const s = this.hooks.save();
    s.day += 1;
    s.clock = 8 * 60;
    s.dayFlags = [];
    s.pos = [...HOME_START];
    [this.px, this.pz] = HOME_START;
    this.hooks.setBattery(battery);
    this.hooks.persist();
    this.pause(true);
    const m = modal(`<div class="levelup">🌅</div><h3>${s.day}일차 아침</h3><p>배터리 ${battery}로 하루를 시작한다. 오늘도 9시까지 출근!</p><button class="btn primary" id="ok">출발</button>`);
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
      this.refreshHud();
    };
  }

  // ---------- 패널 ----------
  private openQuests() {
    const s = this.hooks.save();
    this.pause(true);
    const st = (done: boolean, missed = false) => (done ? '✅' : missed ? '❌' : '⬜');
    const main = ['MS_301', 'MS_201', 'MS_101']
      .sort((a, b) => MISSION_TIME[a] - MISSION_TIME[b])
      .map((id) => {
        const done = s.dayFlags.includes(`mission:${id}`);
        const missed = !done && s.clock > MISSION_TIME[id];
        return `<li>${st(done, missed)} <b>${clockText(MISSION_TIME[id])}</b> ${esc(MISSION_NAME[id])} <span class="muted">· ${esc(MISSION_WHERE[id])}</span></li>`;
      })
      .join('');
    const cats = s.flags.filter((f) => f.startsWith('cat:')).length;
    const m = modal(`<h3>📋 ${s.day}일차 퀘스트</h3>
      <div class="qhead">오늘의 일정</div>
      <ul class="qlist">
        <li>${st(s.dayFlags.includes('commute'), s.dayFlags.includes('late'))} <b>09:00</b> 지각 없이 출근 <span class="muted">· 회사 앞</span></li>
        ${main}
        <li>⬜ <b>21:00~</b> 집 앞에서 잠자기 → 다음 날</li>
      </ul>
      <div class="qhead">동네 서브 퀘스트</div>
      <ul class="qlist">
        <li>${st(s.flags.includes('wallet:done'))} 옆집 할머니의 잃어버린 지갑 ${s.flags.includes('wallet:have') ? '<span class="muted">(주웠다! 할머니께 가져다 드리자)</span>' : '<span class="muted">(공원 근처 어딘가)</span>'}</li>
        <li>${st(s.flags.includes('cats:done'))} 동네 고양이 찾기 ${cats}/${CATS.length}</li>
        <li>💥 길에서 사람과 부딪치면 돌발 만남이 생겨요 (하루 한 번씩)</li>
      </ul>
      <div class="qhead">동네 활동 (하루 한 번씩, 미니게임)</div>
      <ul class="qlist">
        <li>${st(s.dayFlags.includes('job:meeting'))} <b>09~12시</b> 📊 오전 회의 · 말 끊기 타이밍 <span class="muted">· 회사 앞 (출근한 날)</span></li>
        <li>${st(s.dayFlags.includes('job:cafe'))} <b>10~16시</b> ☕ 카페 알바 · 주문 기억하기 <span class="muted">· 카페 앞</span></li>
        <li>${st(s.dayFlags.includes('job:bench'))} <b>08~21시</b> 🪑 사람 구경 · 표정 읽기 <span class="muted">· 공원 벤치 (배터리 회복)</span></li>
      </ul>
      <p class="muted">미션 보상: S ${won(MISSION_REWARD.S.money)} · A ${won(MISSION_REWARD.A.money)} · B ${won(MISSION_REWARD.B.money)}. 놓친 미션은 다음 날 다시 할 수 있어요.</p>
      <button class="btn primary" id="ok">닫기</button>`);
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
    };
  }

  private openShop() {
    const s = this.hooks.save();
    this.pause(true);
    const render = () => {
      box.innerHTML = `<h3>🏪 편의점·옷가게</h3><div class="muted">가진 돈 ${won(s.money)} · Lv.${s.level}</div>
        <div class="shop">${SHOP.map((it) => {
          const owned = s.owned.includes(it.id) && it.id !== 'coffee';
          const locked = s.level < it.minLevel;
          return `<button class="shop-item ${owned ? 'owned' : ''}" data-id="${it.id}" ${owned || locked ? 'disabled' : ''}>
            <span class="si-icon">${it.icon}</span><span class="si-name">${esc(it.name)}</span>
            <span class="si-price">${owned ? '보유' : locked ? `Lv.${it.minLevel}` : won(it.price)}</span></button>`;
        }).join('')}</div>
        <div class="stack"><button class="btn" id="ward">👕 옷장 열기</button><button class="btn primary" id="ok">나가기</button></div>`;
      this.preview(box);
      box.querySelectorAll<HTMLButtonElement>('.shop-item').forEach((b) =>
        (b.onclick = () => {
          const it = SHOP.find((x) => x.id === b.dataset.id)!;
          if (s.money < it.price) return toast('돈이 모자라요. 미션과 퀘스트로 벌어 오세요!', 'bad');
          s.money -= it.price;
          if (it.id === 'coffee') {
            this.hooks.setBattery(Math.min(100, this.hooks.battery() + 25));
            toast('🧋 시원하다! 배터리 +25', 'good');
          } else {
            s.owned.push(it.id);
            this.equip(it);
            toast(`${it.icon} ${it.name} 구매! 바로 입었어요`, 'good');
          }
          this.hooks.persist();
          this.refreshHud();
          render();
        }),
      );
      (box.querySelector('#ok') as HTMLButtonElement).onclick = () => {
        m.remove();
        this.pause(false);
      };
      (box.querySelector('#ward') as HTMLButtonElement).onclick = () => {
        m.remove();
        this.openWardrobe();
      };
    };
    const m = modal('');
    const box = m.querySelector('.modal-box') as HTMLElement;
    render();
  }

  /** 지금 입은 모습을 창 위쪽에 보여 준다 */
  private preview(root: HTMLElement) {
    root.querySelector('.look-preview')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'look-preview';
    const c = lookPreview(this.hooks.save().look, 5);
    c.style.width = '80px';
    c.style.height = '110px';
    wrap.appendChild(c);
    root.querySelector('h3')!.after(wrap);
  }

  private equip(it: ShopItem) {
    const s = this.hooks.save();
    s.look = { ...s.look, ...it.apply };
    this.hooks.persist();
  }

  private openWardrobe() {
    const s = this.hooks.save();
    this.pause(true);
    const all = [...SHOP, ...REWARD_ITEMS].filter((it) => s.owned.includes(it.id) && it.id !== 'coffee');
    const m = modal(`<h3>👕 옷장</h3>
      ${all.length ? `<div class="shop">${all.map((it) => `<button class="shop-item" data-id="${it.id}"><span class="si-icon">${it.icon}</span><span class="si-name">${esc(it.name)}</span><span class="si-price">입기</span></button>`).join('')}</div>` : '<p class="muted">아직 산 옷이 없어요. 편의점·옷가게에서 사 보세요.</p>'}
      <div class="stack"><button class="btn" id="reset">기본 옷으로</button><button class="btn" id="hat">모자·안경 벗기</button><button class="btn primary" id="ok">닫기</button></div>`);
    this.preview(m);
    m.querySelectorAll<HTMLButtonElement>('.shop-item').forEach((b) =>
      (b.onclick = () => {
        this.equip(all.find((x) => x.id === b.dataset.id)!);
        this.preview(m);
        toast('갈아입었다!', 'good');
      }),
    );
    (m.querySelector('#reset') as HTMLButtonElement).onclick = () => {
      s.look = { ...DEFAULT_LOOK };
      this.preview(m);
      this.hooks.persist();
    };
    (m.querySelector('#hat') as HTMLButtonElement).onclick = () => {
      s.look = { ...s.look, hat: null, glasses: null };
      this.preview(m);
      this.hooks.persist();
    };
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
    };
  }
}
