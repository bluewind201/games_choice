// 레트로 3D 동네: 돌아다니며 사람과 부딪치고, 미션·퀘스트를 하고, 돈을 벌어 캐릭터를 꾸민다.
import * as THREE from 'three';
import { buildCharacter, applyLook, animateWalk, CharRig, Look, DEFAULT_LOOK } from './character';
import {
  PLACES, NPCS, NpcDef, ENCOUNTERS, SHOP, REWARD_ITEMS, ShopItem, MISSION_REWARD, xpToNext, LEVEL_TITLE,
  CATS, WALLET_POS, BED_POS,
} from './data';
import { esc, toast, modal, won } from '../ui/common';

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

export function newWorldSave(): WorldSave {
  return { day: 1, clock: 8 * 60, level: 1, xp: 0, money: 5000, look: { ...DEFAULT_LOOK }, owned: [], dayFlags: [], flags: [], pos: [-24, 13] };
}

export interface WorldHooks {
  save: () => WorldSave;
  battery: () => number;
  setBattery: (v: number) => void;
  persist: () => void;
  startMission: (missionId: string, done: (grade: string) => void) => void;
  playerName: () => string;
  openMenu: () => void;
}

/** 미션 시작 시각 (이 시각이 지나면 오늘은 못 함) */
const MISSION_TIME: Record<string, number> = { MS_301: 16 * 60 + 50, MS_201: 19 * 60, MS_101: 20 * 60 };
const MISSION_NAME: Record<string, string> = { MS_301: '6시 칼퇴 작전', MS_201: '애프터 확정 작전', MS_101: '뒤풀이 탈출 작전' };
const MISSION_WHERE: Record<string, string> = { MS_301: '회사 앞 박 팀장', MS_201: '파스타 가게 앞 지우', MS_101: '공원 러닝크루 하나' };

const clockText = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const MIN_PER_SEC = 4; // 현실 1초 = 게임 4분
const OFFICE_DOOR: [number, number] = [26, -15];

interface Npc {
  def: NpcDef;
  rig: CharRig;
  marker?: THREE.Sprite;
  label: THREE.Sprite;
  dir: number;
  seg: number;
}

interface Interactable {
  label: string;
  x: number;
  z: number;
  action: () => void;
  visible: () => boolean;
}

function textSprite(text: string, color = '#fff', bg = 'rgba(20,12,45,.75)', scale = 1): THREE.Sprite {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = 'bold 28px sans-serif';
  const w = Math.ceil(g.measureText(text).width) + 24;
  c.width = w;
  c.height = 44;
  g.font = 'bold 28px sans-serif';
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(0, 0, w, 44, 14);
  g.fill();
  g.fillStyle = color;
  g.textBaseline = 'middle';
  g.fillText(text, 12, 23);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set((w / 44) * 0.6 * scale, 0.6 * scale, 1);
  s.renderOrder = 10;
  return s;
}

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private player: CharRig;
  private npcs: Npc[] = [];
  private colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
  private interactables: Interactable[] = [];
  private cats: THREE.Group[] = [];
  private wallet?: THREE.Mesh;
  private sun!: THREE.DirectionalLight;
  private hemi!: THREE.HemisphereLight;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0, active: false };
  private paused = false;
  private running = false;
  private last = 0;
  private t = 0;
  private clockAcc = 0;
  private hud: HTMLElement;
  private actionBtn!: HTMLButtonElement;
  private current: Interactable | null = null;
  private heading = 0;
  /** 카메라와 플레이어 사이를 가리면 반투명해지는 건물 */
  private fadeables: { meshes: THREE.Mesh[]; sign?: THREE.Sprite; minX: number; maxX: number; minZ: number; faded: boolean }[] = [];

  constructor(private host: HTMLElement, private hooks: WorldHooks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.domElement.className = 'world-canvas';
    host.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.5, 200);
    this.scene.fog = new THREE.Fog(0x9fd3ff, 40, 95);
    this.buildWorld();
    const s = hooks.save();
    this.player = buildCharacter(s.look);
    this.player.root.position.set(s.pos[0], 0, s.pos[1]);
    this.scene.add(this.player.root);
    this.buildNpcs();
    this.buildPickups();
    this.hud = document.createElement('div');
    this.hud.className = 'world-hud';
    host.appendChild(this.hud);
    this.buildHud();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  // ---------- 맵 만들기 ----------
  private addBox(w: number, h: number, d: number, color: string, x: number, y: number, z: number, collide = true, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, flatShading: true }));
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    this.scene.add(m);
    if (collide) this.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return m;
  }

  private buildWorld() {
    this.hemi = new THREE.HemisphereLight(0xdff1ff, 0x5a7a4a, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.1);
    this.sun.position.set(30, 50, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(512, 512);
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -50;
    sc.right = 50;
    sc.top = 50;
    sc.bottom = -50;
    this.scene.add(this.sun);

    // 땅, 도로, 인도, 공원, 강
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshLambertMaterial({ color: '#8cc06a' }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const flat = (w: number, d: number, color: string, x: number, z: number, y = 0.02) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      this.scene.add(m);
    };
    flat(9, 100, '#c9c3b8', 0, 0, 0.01); // 인도
    flat(100, 9, '#c9c3b8', 0, 0, 0.01);
    flat(6, 100, '#4a4a55', 0, 0); // 도로
    flat(100, 6, '#4a4a55', 0, 0, 0.021);
    for (let i = -46; i < 50; i += 6) {
      flat(0.3, 2.4, '#f5f0d0', 0, i, 0.03);
      flat(2.4, 0.3, '#f5f0d0', i, 0, 0.03);
    }
    flat(30, 24, '#79b85a', -27, -24, 0.015); // 공원 잔디
    flat(100, 10, '#4aa3df', 0, -45, 0.04); // 강
    this.colliders.push({ minX: -50, maxX: 50, minZ: -50, maxZ: -40 });
    // 러닝 트랙
    flat(24, 1.4, '#d98c5f', -27, -14, 0.03);
    flat(24, 1.4, '#d98c5f', -27, -34, 0.03);
    flat(1.4, 20, '#d98c5f', -39, -24, 0.03);
    flat(1.4, 20, '#d98c5f', -15, -24, 0.03);

    // 건물
    for (const p of PLACES) {
      const meshes = [this.addBox(p.w, p.h, p.d, p.color, p.x, p.h / 2, p.z)];
      if (p.roof) meshes.push(this.addBox(p.w + 0.6, 0.6, p.d + 0.6, p.roof, p.x, p.h + 0.3, p.z, false));
      this.fadeables.push({ meshes, minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.d / 2, faded: false });
      // 창문
      const rows = Math.max(1, Math.floor(p.h / 3));
      for (let r = 0; r < rows; r++)
        for (let c = -1; c <= 1; c++) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), new THREE.MeshLambertMaterial({ color: '#cfe8ff', emissive: '#223' }));
          win.position.set(p.x + c * (p.w / 3.2), 1.8 + r * 3, p.z + (p.z > 0 ? -p.d / 2 - 0.01 : p.d / 2 + 0.01));
          if (p.z > 0) win.rotation.y = Math.PI;
          this.scene.add(win);
        }
      if (p.sign) {
        const s = textSprite(p.sign, '#fff', 'rgba(35,25,74,.85)', 1.6);
        s.position.set(p.x, p.h + 1.6, p.z);
        this.scene.add(s);
        this.fadeables[this.fadeables.length - 1].sign = s;
      }
    }
    // 나무
    const tree = (x: number, z: number) => {
      this.addBox(0.5, 1.6, 0.5, '#7a5230', x, 0.8, z);
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.6, 6), new THREE.MeshLambertMaterial({ color: '#3f8f4a', flatShading: true }));
      leaf.position.set(x, 2.9, z);
      leaf.castShadow = true;
      this.scene.add(leaf);
    };
    const treePos: [number, number][] = [
      [-36, -10], [-18, -10], [-36, -30], [-18, -30], [-28, -36], [-10, -20], [-40, 10], [-40, 30], [-12, 40], [16, 40],
      [40, 34], [40, 12], [12, -14], [40, -36], [-10, -40], [14, 12], [-14, 22], [38, -12],
    ];
    treePos.forEach(([x, z]) => tree(x, z));
    // 벤치, 가로등, 주차된 차
    this.addBox(2.4, 0.5, 0.8, '#8b5a2b', -31, 0.45, -12.8);
    const lamp = (x: number, z: number) => {
      this.addBox(0.2, 4, 0.2, '#555', x, 2, z);
      this.addBox(0.6, 0.3, 0.6, '#ffe9a8', x, 4.1, z, false);
    };
    [[-5, -5], [5, 5], [-5, 20], [5, -20], [20, -5], [-20, 5]].forEach(([x, z]) => lamp(x, z));
    const car = (x: number, z: number, c: string, rot = false) => {
      const w = rot ? 1.8 : 3.6;
      const d = rot ? 3.6 : 1.8;
      this.addBox(w, 1, d, c, x, 0.7, z);
      this.addBox(rot ? 1.6 : 2, 0.8, rot ? 2 : 1.6, '#cfe8ff', x, 1.5, z, false);
    };
    car(14, -4.5, '#e2445c');
    car(-16, 4.5, '#ffd166');
    car(4.5, 18, '#4f6dff', true);
    // 경계
    this.colliders.push({ minX: 46, maxX: 60, minZ: -60, maxZ: 60 }, { minX: -60, maxX: -46, minZ: -60, maxZ: 60 }, { minX: -60, maxX: 60, minZ: 46, maxZ: 60 });
  }

  private buildNpcs() {
    for (const def of NPCS) {
      const rig = buildCharacter({ ...DEFAULT_LOOK, ...def.look });
      rig.root.position.set(def.x, 0, def.z);
      rig.root.rotation.y = def.kind === 'encounter' ? 0 : Math.atan2(0 - def.x, 0 - def.z) * 0 + Math.PI * (def.z < 0 ? 0 : 1);
      this.scene.add(rig.root);
      const label = textSprite(def.name, '#fff', 'rgba(20,12,45,.7)', 0.9);
      label.position.y = 2.75;
      rig.root.add(label);
      let marker: THREE.Sprite | undefined;
      if (def.kind === 'mission' || def.kind === 'quest' || def.kind === 'shop') {
        marker = textSprite(def.kind === 'shop' ? '🛒' : '!', '#23194a', '#ffd166', 1.2);
        marker.position.y = 3.5;
        rig.root.add(marker);
      }
      this.npcs.push({ def, rig, marker, label, dir: 1, seg: 0 });
      if (def.kind !== 'encounter') {
        this.interactables.push({
          label: def.kind === 'shop' ? `🛒 ${def.name}` : `💬 ${def.name}`,
          x: def.x,
          z: def.z,
          visible: () => true,
          action: () => this.talkTo(def),
        });
      }
    }
    this.interactables.push({
      label: '🛏️ 잠자기 (다음 날)',
      x: BED_POS[0],
      z: BED_POS[1],
      visible: () => true,
      action: () => this.sleep(),
    });
  }

  private buildPickups() {
    const s = this.hooks.save();
    CATS.forEach(([x, z], i) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.4), new THREE.MeshLambertMaterial({ color: ['#f4a259', '#333', '#ddd'][i] }));
      body.position.y = 0.35;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.38), body.material);
      head.position.set(0.45, 0.6, 0);
      const e1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 4), body.material);
      e1.position.set(0.45, 0.85, -0.1);
      const e2 = e1.clone();
      e2.position.z = 0.1;
      g.add(body, head, e1, e2);
      g.position.set(x, 0, z);
      g.visible = !s.flags.includes(`cat:${i}`);
      this.scene.add(g);
      this.cats.push(g);
      this.interactables.push({
        label: '🐈 고양이 쓰다듬기',
        x,
        z,
        visible: () => g.visible,
        action: () => this.petCat(i),
      });
    });
    this.wallet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.35), new THREE.MeshLambertMaterial({ color: '#8b2e2e' }));
    this.wallet.position.set(WALLET_POS[0], 0.1, WALLET_POS[1]);
    this.wallet.visible = !s.flags.includes('wallet:have') && !s.flags.includes('wallet:done');
    this.scene.add(this.wallet);
    this.interactables.push({
      label: '👛 떨어진 지갑 줍기',
      x: WALLET_POS[0],
      z: WALLET_POS[1],
      visible: () => !!this.wallet?.visible,
      action: () => {
        this.wallet!.visible = false;
        const sv = this.hooks.save();
        sv.flags.push('wallet:have');
        this.hooks.persist();
        toast('👛 지갑을 주웠다. 안에 할머니 사진이... 옆집 할머니 것 같다!', 'info');
        this.refreshHud();
      },
    });
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
      <div class="hud-btns">
        <button id="hQuest" class="hud-btn">📋<span>퀘스트</span></button>
        <button id="hWard" class="hud-btn">👕<span>옷장</span></button>
        <button id="hMenu" class="hud-btn">🎭<span>캐릭터</span></button>
      </div>
      <div class="hud-next" id="hNext"></div>
      <div class="joy" id="joy"><div class="joy-knob" id="joyKnob"></div></div>
      <button class="hud-action" id="hAction" hidden></button>`;
    this.actionBtn = this.hud.querySelector('#hAction') as HTMLButtonElement;
    this.actionBtn.onclick = () => this.current?.action();
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
    q('#hNext').textContent = this.nextGoal();
  }

  /** 지금 가장 할 만한 일 한 줄 */
  private nextGoal(): string {
    const s = this.hooks.save();
    if (!s.dayFlags.includes('commute') && !s.dayFlags.includes('late') && s.clock <= 9 * 60) return '🎯 9시 전에 회사 앞까지 출근하기';
    for (const id of ['MS_301', 'MS_201', 'MS_101']) {
      if (s.dayFlags.includes(`mission:${id}`)) continue;
      if (s.clock <= MISSION_TIME[id]) return `🎯 ${clockText(MISSION_TIME[id])} ${MISSION_NAME[id]} · ${MISSION_WHERE[id]}`;
    }
    if (s.clock >= 21 * 60) return '🛏️ 집 앞에서 잠자기 → 다음 날';
    return '🗺️ 자유 시간: 동네를 돌아다니며 서브 퀘스트를 찾아보세요';
  }

  // ---------- 입력 ----------
  private bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if ((e.key === ' ' || e.key === 'e') && this.current && !this.paused && this.running && !document.querySelector('.modal')) this.current.action();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    const joy = this.hud.querySelector('#joy') as HTMLElement;
    const knob = this.hud.querySelector('#joyKnob') as HTMLElement;
    let id = -1;
    const move = (e: PointerEvent) => {
      const r = joy.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2);
      let dy = (e.clientY - cy) / (r.height / 2);
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
    this.refreshHud();
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) this.update(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    this.hooks.save().pos = [this.player.root.position.x, this.player.root.position.z];
    this.hooks.persist();
    this.host.hidden = true;
  }

  private resize() {
    const w = this.host.clientWidth || window.innerWidth;
    const h = this.host.clientHeight || window.innerHeight;
    // 레트로 느낌: 낮은 해상도로 그리고 픽셀 그대로 키운다
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * 0.42);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private collide(x: number, z: number, r = 0.45): [number, number] {
    for (const c of this.colliders) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d === 0) {
          // 안쪽에 들어간 경우 가장 가까운 면으로
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
    const p = this.player.root.position;
    if (len > 0.08) {
      const sp = 7 * Math.min(1, len);
      const nx = p.x + (mx / Math.max(1, len)) * sp * dt;
      const nz = p.z + (mz / Math.max(1, len)) * sp * dt;
      const [cx, cz] = this.collide(nx, nz);
      p.x = cx;
      p.z = cz;
      const target = Math.atan2(mx, mz);
      let diff = target - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 12);
      this.player.root.rotation.y = this.heading;
      animateWalk(this.player, this.t, len);
    } else animateWalk(this.player, 0, 0);

    // 카메라
    const camTarget = new THREE.Vector3(p.x, 11, p.z + 12);
    this.camera.position.lerp(camTarget, Math.min(1, dt * 5));
    this.camera.lookAt(p.x, 1.2, p.z);
    for (const f of this.fadeables) {
      const hide = p.z < f.minZ && this.camera.position.z > f.minZ - 0.5 && p.x > f.minX - 1.5 && p.x < f.maxX + 1.5;
      if (hide === f.faded) continue;
      f.faded = hide;
      for (const m of f.meshes) {
        const mt = m.material as THREE.MeshLambertMaterial;
        mt.transparent = hide;
        mt.opacity = hide ? 0.15 : 1;
        mt.depthWrite = !hide;
        mt.needsUpdate = true;
        m.castShadow = !hide;
      }
      if (f.sign) f.sign.visible = !hide;
    }

    // NPC
    for (const n of this.npcs) {
      if (n.def.patrol) {
        const [a, b] = n.def.patrol;
        const to = n.dir > 0 ? b : a;
        const dx = to[0] - n.rig.root.position.x;
        const dz = to[1] - n.rig.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.3) n.dir *= -1;
        else {
          n.rig.root.position.x += (dx / d) * 2.2 * dt;
          n.rig.root.position.z += (dz / d) * 2.2 * dt;
          n.rig.root.rotation.y = Math.atan2(dx, dz);
          animateWalk(n.rig, this.t + n.def.x, 0.6);
        }
        // 부딪침 → 돌발 만남
        if (!s.dayFlags.includes(`enc:${n.def.id}`) && Math.hypot(p.x - n.rig.root.position.x, p.z - n.rig.root.position.z) < 1.3) {
          this.encounter(n.def.id);
          return;
        }
      }
      if (n.marker) {
        n.marker.position.y = 3.5 + Math.sin(this.t * 3) * 0.15;
        n.marker.visible = this.markerVisible(n.def);
      }
    }
    this.cats.forEach((c, i) => (c.rotation.y = Math.sin(this.t + i) * 0.6));

    // 상호작용 대상
    let best: Interactable | null = null;
    let bestD = 2.6;
    for (const it of this.interactables) {
      if (!it.visible()) continue;
      const d = Math.hypot(p.x - it.x, p.z - it.z);
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
    if (!s.dayFlags.includes('commute') && !s.dayFlags.includes('late') && Math.hypot(p.x - OFFICE_DOOR[0], p.z - OFFICE_DOOR[1]) < 4) {
      if (s.clock <= 9 * 60) {
        s.dayFlags.push('commute');
        this.reward(3000, 20, '⏰ 지각 없이 출근 완료!');
      } else {
        s.dayFlags.push('late');
        toast('😰 지각이다... 팀장 눈치가 보인다', 'bad');
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
      s.pos = [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10];
      this.refreshHud();
    }
    this.updateSky(s.clock);
  }

  private updateSky(clock: number) {
    const h = clock / 60;
    const day = new THREE.Color('#9fd3ff');
    const eve = new THREE.Color('#ffb48a');
    const night = new THREE.Color('#1d2147');
    let c: THREE.Color;
    let light: number;
    if (h < 16) {
      c = day;
      light = 1.1;
    } else if (h < 19) {
      c = day.clone().lerp(eve, (h - 16) / 3);
      light = 1.1 - (h - 16) * 0.12;
    } else if (h < 21) {
      c = eve.clone().lerp(night, (h - 19) / 2);
      light = 0.74 - (h - 19) * 0.22;
    } else {
      c = night;
      light = 0.3;
    }
    this.scene.background = c;
    (this.scene.fog as THREE.Fog).color = c;
    this.sun.intensity = light;
    this.hemi.intensity = 0.5 + light * 0.4;
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
        this.dialog(def.name, '어머나, 내 지갑! 손주 사진이 들어 있어서 얼마나 찾았는데... 고마워요, 이거 받아요.', () =>
          this.reward(10000, 30, '👛 지갑을 찾아 드렸다!'),
        );
      } else if (s.flags.includes('wallet:done')) {
        this.dialog(def.name, '오늘도 출근하나 봐요? 밥 잘 챙겨 먹고 다녀요~');
      } else {
        this.dialog(def.name, '아이고, 어제 공원 산책하다가 지갑을 잃어버렸지 뭐야... 혹시 보면 좀 알려줘요.');
      }
      return;
    }
    if (def.missionId) {
      const id = def.missionId;
      if (s.dayFlags.includes(`mission:${id}`)) return this.dialog(def.name, '오늘은 이미 이야기 나눴잖아요. 내일 또 봐요!');
      const at = MISSION_TIME[id];
      if (s.clock > at) return this.dialog(def.name, `(${clockText(at)}가 이미 지났다. ${MISSION_NAME[id]}은(는) 내일 다시 할 수 있다.)`);
      const m = modal(`<h3>🎯 ${esc(MISSION_NAME[id])}</h3>
        <p>${clockText(at)}에 시작하는 메인 미션이에요. 지금 시작하면 시간이 ${clockText(at)}로 넘어가요.</p>
        <p class="muted">지금 시각 ${clockText(s.clock)} · 배터리 ${this.hooks.battery()}</p>
        <div class="stack"><button class="btn primary" id="go">미션 시작</button><button class="btn" id="no">나중에</button></div>`);
      this.pause(true);
      (m.querySelector('#no') as HTMLButtonElement).onclick = () => {
        m.remove();
        this.pause(false);
      };
      (m.querySelector('#go') as HTMLButtonElement).onclick = () => {
        m.remove();
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
    }
  }

  private dialog(name: string, line: string, after?: () => void) {
    this.pause(true);
    const m = modal(`<div class="speaker">${esc(name)}</div><p class="dlg">${esc(line)}</p><button class="btn primary" id="ok">확인</button>`);
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
      after?.();
    };
  }

  private encounter(npcId: string) {
    const s = this.hooks.save();
    const e = ENCOUNTERS.find((x) => x.npcId === npcId);
    s.dayFlags.push(`enc:${npcId}`);
    if (!e) return;
    this.pause(true);
    const shuffled = [...e.choices].sort(() => Math.random() - 0.5);
    const m = modal(`<div class="enc-title">💥 ${esc(e.title)}</div><p class="dlg">${esc(e.line)}</p>
      <div class="stack">${shuffled.map((c, i) => `<button class="btn choice" data-i="${i}">${esc(c.text)}</button>`).join('')}</div>`);
    m.querySelectorAll<HTMLButtonElement>('.choice').forEach((b) =>
      (b.onclick = () => {
        const c = shuffled[+b.dataset.i!];
        m.remove();
        this.hooks.setBattery(Math.max(0, Math.min(100, this.hooks.battery() + c.battery)));
        this.dialog(e.title.split(' ')[0], c.reaction, () => {
          if (c.xp || c.money) this.reward(c.money, c.xp, '💥 돌발 만남 해결!');
          else this.refreshHud();
        });
      }),
    );
  }

  private petCat(i: number) {
    const s = this.hooks.save();
    this.cats[i].visible = false;
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
    s.pos = [-24, 13];
    this.player.root.position.set(-24, 0, 13);
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

  private equip(it: ShopItem) {
    const s = this.hooks.save();
    s.look = { ...s.look, ...it.apply };
    applyLook(this.player, s.look);
    this.hooks.persist();
  }

  private openWardrobe() {
    const s = this.hooks.save();
    this.pause(true);
    const all = [...SHOP, ...REWARD_ITEMS].filter((it) => s.owned.includes(it.id) && it.id !== 'coffee');
    const m = modal(`<h3>👕 옷장</h3>
      ${all.length ? `<div class="shop">${all.map((it) => `<button class="shop-item" data-id="${it.id}"><span class="si-icon">${it.icon}</span><span class="si-name">${esc(it.name)}</span><span class="si-price">입기</span></button>`).join('')}</div>` : '<p class="muted">아직 산 옷이 없어요. 편의점·옷가게에서 사 보세요.</p>'}
      <div class="stack"><button class="btn" id="reset">기본 옷으로</button><button class="btn" id="hat">모자·안경 벗기</button><button class="btn primary" id="ok">닫기</button></div>`);
    m.querySelectorAll<HTMLButtonElement>('.shop-item').forEach((b) =>
      (b.onclick = () => {
        this.equip(all.find((x) => x.id === b.dataset.id)!);
        toast('갈아입었다!', 'good');
      }),
    );
    (m.querySelector('#reset') as HTMLButtonElement).onclick = () => {
      s.look = { ...DEFAULT_LOOK };
      applyLook(this.player, s.look);
      this.hooks.persist();
    };
    (m.querySelector('#hat') as HTMLButtonElement).onclick = () => {
      s.look = { ...s.look, hat: null, glasses: null };
      applyLook(this.player, s.look);
      this.hooks.persist();
    };
    (m.querySelector('#ok') as HTMLButtonElement).onclick = () => {
      m.remove();
      this.pause(false);
    };
  }
}
