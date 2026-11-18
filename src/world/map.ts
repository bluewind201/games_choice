// 넓은 동네 지도 (160 x 120칸, 1칸 = 16 도트). 타일을 깔고, 건물은 정면 벽이 보이는 3/4 시점으로 그린다.
// 모든 건물의 문은 아래쪽(남쪽) 인도를 향한다.

export const U = 16;
export const MAP_W = 160;
export const MAP_H = 120;
export const MAP_PXW = MAP_W * U;
export const MAP_PXH = MAP_H * U;

/** 월드(칸) → 지도 도트 */
export const ax = (v: number) => v * U;

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const enum T {
  GRASS,
  PARK,
  FLOWER,
  ROAD,
  WALK,
  WATER,
  SAND,
  DIRT,
  TRACK,
  PLAZA,
  LOT,
}

export interface Building {
  id: string;
  name: string;
  x: number;
  z: number;
  w: number;
  d: number;
  wall: number; // 정면 벽 높이(칸)
  color: string;
  roof: string;
  sign?: string;
  /** 지도·이름표에 보일지 */
  label?: boolean;
}

export const BUILDINGS: Building[] = [
  // 도심 (북동)
  { id: 'office', name: '회사', x: 110, z: 12, w: 16, d: 20, wall: 12, color: '#9fb4c7', roof: '#5b6b7c', sign: '🏢 회사', label: true },
  { id: 'cafe', name: '카페', x: 92, z: 22, w: 10, d: 10, wall: 4, color: '#f7e1d7', roof: '#8d5b4c', sign: '☕ 카페', label: true },
  { id: 'cityst', name: '시청역', x: 132, z: 25, w: 8, d: 7, wall: 3, color: '#dfe6ee', roof: '#2e7d32', sign: '🚇 시청역', label: true },
  { id: 'tower', name: '빌딩', x: 142, z: 10, w: 13, d: 22, wall: 14, color: '#b9c6d6', roof: '#6a7b90' },
  { id: 'bank', name: '은행', x: 90, z: 42, w: 12, d: 12, wall: 5, color: '#e9e2c8', roof: '#3b5b92', sign: '🏦 은행' },
  { id: 'tower2', name: '빌딩', x: 128, z: 40, w: 14, d: 14, wall: 8, color: '#c8d3c0', roof: '#5f7a55' },
  { id: 'gym', name: '헬스장', x: 106, z: 44, w: 14, d: 10, wall: 4, color: '#ffe0e0', roof: '#e2445c', sign: '💪 헬스장' },
  // 주택가 (남서)
  { id: 'grandma', name: '할머니 댁', x: 3, z: 85, w: 9, d: 9, wall: 4, color: '#efe3cf', roof: '#7d5ba6' },
  { id: 'home', name: '우리 집', x: 14, z: 84, w: 10, d: 10, wall: 4, color: '#f4d6a0', roof: '#c0504d', sign: '🏠 우리 집', label: true },
  { id: 'apt', name: '아파트', x: 28, z: 66, w: 18, d: 28, wall: 16, color: '#d9d4e7', roof: '#7d6fa8', sign: '🏬 아파트', label: true },
  { id: 'store', name: '편의점·옷가게', x: 50, z: 86, w: 10, d: 8, wall: 4, color: '#e8f6ff', roof: '#1e88e5', sign: '🏪 편의점', label: true },
  { id: 'homest', name: '주택가역', x: 62, z: 87, w: 8, d: 7, wall: 3, color: '#dfe6ee', roof: '#2e7d32', sign: '🚇 주택가역', label: true },
  // 파스타 거리 (남동)
  { id: 'flower', name: '꽃집', x: 88, z: 86, w: 9, d: 8, wall: 4, color: '#fff0f5', roof: '#e86fa0', sign: '💐 꽃집' },
  { id: 'pasta', name: '파스타 가게', x: 100, z: 84, w: 12, d: 10, wall: 4, color: '#fff1e0', roof: '#2e8b57', sign: '🍝 파스타', label: true },
  { id: 'book', name: '서점', x: 116, z: 85, w: 10, d: 9, wall: 4, color: '#f0ead6', roof: '#8b5a2b', sign: '📚 서점' },
  { id: 'school', name: '학교', x: 120, z: 62, w: 30, d: 16, wall: 6, color: '#f2e6c9', roof: '#b5643a', sign: '🏫 학교' },
  // 남쪽 주택
  ...[8, 24, 40, 56, 92, 108, 124, 140].map((x, i) => ({
    id: `house${i}`, name: '주택', x, z: 104, w: 10, d: 9, wall: 4,
    color: ['#f6e7c1', '#e7f0d8', '#f3d8d8', '#dfe9f5'][i % 4], roof: ['#a0522d', '#4f6dff', '#2e8b57', '#c0504d'][i % 4],
  })),
];

export const doorOf = (b: Building): [number, number] => [b.x + b.w / 2, b.z + b.d];
export const placeRect = (b: Building): Rect => ({ minX: b.x, maxX: b.x + b.w, minZ: b.z, maxZ: b.z + b.d });

// 길
const H_ROADS = [
  { z: 56, x0: 0, x1: 160 }, // 중앙로
  { z: 96, x0: 0, x1: 160 }, // 주택가·파스타 거리
  { z: 34, x0: 84, x1: 160 }, // 회사길
];
const V_ROADS = [{ x: 76, z0: 8, z1: 120 }];

export const TREES: [number, number][] = [];
export const LAMPS: [number, number][] = [];
export const BENCHES: [number, number][] = [[18, 24], [46, 24], [100, 79]];
export const CARS: { x: number; z: number; c: string; v: boolean }[] = [];
const FENCES: Rect[] = [];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let grid: Uint8Array | null = null;

export function tileAt(x: number, z: number): T {
  const g = buildGrid();
  const tx = Math.floor(x);
  const tz = Math.floor(z);
  if (tx < 0 || tz < 0 || tx >= MAP_W || tz >= MAP_H) return T.WATER;
  return g[tz * MAP_W + tx] as T;
}

export function buildGrid(): Uint8Array {
  if (grid) return grid;
  const g = new Uint8Array(MAP_W * MAP_H);
  const set = (x0: number, z0: number, w: number, d: number, t: T) => {
    for (let z = Math.max(0, z0); z < Math.min(MAP_H, z0 + d); z++) for (let x = Math.max(0, x0); x < Math.min(MAP_W, x0 + w); x++) g[z * MAP_W + x] = t;
  };
  const rand = rng(11);
  set(0, 0, MAP_W, MAP_H, T.GRASS);
  // 강
  set(0, 0, MAP_W, 7, T.WATER);
  set(0, 7, MAP_W, 1, T.SAND);
  // 공원
  set(3, 9, 59, 43, T.PARK);
  for (let i = 0; i < 260; i++) {
    const x = 4 + Math.floor(rand() * 56);
    const z = 10 + Math.floor(rand() * 40);
    g[z * MAP_W + x] = T.FLOWER;
  }
  // 러닝 트랙 (사각 고리)
  set(8, 14, 48, 2, T.TRACK);
  set(8, 44, 48, 2, T.TRACK);
  set(8, 14, 2, 32, T.TRACK);
  set(54, 14, 2, 32, T.TRACK);
  // 연못
  for (let z = 24; z < 37; z++)
    for (let x = 22; x < 44; x++) {
      const dx = (x + 0.5 - 32) / 9;
      const dz = (z + 0.5 - 30) / 5.5;
      if (dx * dx + dz * dz < 1) g[z * MAP_W + x] = T.WATER;
    }
  // 공원 흙길
  set(39, 46, 3, 6, T.DIRT);
  set(56, 29, 6, 3, T.DIRT);
  set(16, 22, 6, 4, T.DIRT);
  // 도심 광장 바닥
  set(84, 9, 76, 23, T.PLAZA);
  set(84, 40, 76, 14, T.PLAZA);
  // 주차장
  set(86, 64, 28, 16, T.LOT);
  // 길 + 인도
  for (const r of H_ROADS) {
    set(r.x0, r.z - 2, r.x1 - r.x0, 2, T.WALK);
    set(r.x0, r.z, r.x1 - r.x0, 4, T.ROAD);
    set(r.x0, r.z + 4, r.x1 - r.x0, 2, T.WALK);
  }
  for (const r of V_ROADS) {
    set(r.x - 2, r.z0, 2, r.z1 - r.z0, T.WALK);
    set(r.x, r.z0, 6, r.z1 - r.z0, T.ROAD);
    set(r.x + 6, r.z0, 2, r.z1 - r.z0, T.WALK);
  }
  // 교차로는 도로로
  for (const r of H_ROADS) set(76, r.z, 6, 4, T.ROAD);
  // 남쪽 주택 앞 골목
  set(0, 113, MAP_W, 2, T.WALK);
  for (const x of [13, 29, 45, 61, 97, 113, 129, 145]) set(x - 1, 102, 2, 11, T.WALK);
  // 학교 앞 마당
  set(120, 78, 30, 14, T.PLAZA);
  grid = g;
  buildDecor();
  return g;
}

function buildDecor() {
  const rand = rng(23);
  const isFree = (x: number, z: number, r = 1.2) => {
    for (const b of BUILDINGS) if (x > b.x - r && x < b.x + b.w + r && z > b.z - r && z < b.z + b.d + r) return false;
    const t = tileAt(x, z);
    return t === T.GRASS || t === T.PARK || t === T.FLOWER;
  };
  // 공원 둘레 나무 + 숲
  for (let x = 5; x < 60; x += 4) {
    if (x < 36 || x > 44) if (isFree(x, 11)) TREES.push([x, 11]);
    if (isFree(x, 49.5) && (x < 36 || x > 44)) TREES.push([x, 49.5]);
  }
  for (let z = 14; z < 48; z += 4) {
    if (isFree(5, z)) TREES.push([5, z]);
    if (isFree(59, z) && (z < 26 || z > 34)) TREES.push([59, z]);
  }
  for (let i = 0; i < 18; i++) {
    const x = 12 + rand() * 40;
    const z = 18 + rand() * 24;
    const t = tileAt(x, z);
    if (t !== T.WATER && t !== T.TRACK && t !== T.DIRT && isFree(x, z) && !(x > 20 && x < 46 && z > 22 && z < 38)) TREES.push([x, z]);
  }
  // 가로수 + 가로등 (인도 바깥 잔디에)
  for (let x = 4; x < MAP_W; x += 9) {
    for (const z of [53, 63.5, 93, 103]) if (isFree(x, z, 0.6)) TREES.push([x, z]);
  }
  for (let z = 12; z < MAP_H; z += 9) for (const x of [73, 85]) if (isFree(x, z, 0.6)) TREES.push([x, z]);
  // 빈 잔디에 흩어진 나무
  for (let i = 0; i < 90; i++) {
    const x = 2 + rand() * (MAP_W - 4);
    const z = 9 + rand() * (MAP_H - 11);
    if (isFree(x, z, 1.6) && tileAt(x, z) === T.GRASS && !TREES.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 3)) TREES.push([x, z]);
  }
  for (let x = 6; x < MAP_W; x += 14) {
    LAMPS.push([x, 54.4], [x + 7, 61.6], [x, 94.4], [x + 7, 101.6]);
  }
  for (let z = 14; z < MAP_H; z += 14) LAMPS.push([74.4, z], [83.6, z + 7]);
  for (let x = 90; x < MAP_W; x += 14) LAMPS.push([x, 32.4], [x + 7, 39.6]);
  // 주차된 차
  const cc = ['#e2445c', '#ffd166', '#4f6dff', '#43d39e', '#f4f4f4', '#2d3047'];
  for (let i = 0; i < 9; i++) if (i % 3 !== 1) CARS.push({ x: 89 + i * 3, z: 67, c: cc[i % cc.length], v: true });
  for (let i = 0; i < 9; i++) if (i % 4 !== 2) CARS.push({ x: 89 + i * 3, z: 76.5, c: cc[(i + 2) % cc.length], v: true });
  CARS.push({ x: 30, z: 59.5, c: '#ffd166', v: false }, { x: 140, z: 37.5, c: '#e2445c', v: false }, { x: 79, z: 80, c: '#4f6dff', v: true });
  // 공원 울타리 (입구 비움)
  FENCES.push(
    { minX: 3, maxX: 37, minZ: 51.2, maxZ: 51.8 },
    { minX: 44, maxX: 62, minZ: 51.2, maxZ: 51.8 },
    { minX: 61.2, maxX: 61.8, minZ: 9, maxZ: 28 },
    { minX: 61.2, maxX: 61.8, minZ: 33, maxZ: 51.8 },
    { minX: 2.4, maxX: 3, minZ: 9, maxZ: 51.8 },
  );
}

export function buildColliders(): Rect[] {
  buildGrid();
  const c: Rect[] = BUILDINGS.map(placeRect);
  for (const [x, z] of TREES) c.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.25, maxZ: z + 0.35 });
  for (const [x, z] of LAMPS) c.push({ minX: x - 0.15, maxX: x + 0.15, minZ: z - 0.1, maxZ: z + 0.15 });
  for (const [x, z] of BENCHES) c.push({ minX: x - 1.1, maxX: x + 1.1, minZ: z - 0.3, maxZ: z + 0.3 });
  for (const car of CARS) {
    const w = car.v ? 1.6 : 3;
    const d = car.v ? 3 : 1.6;
    c.push({ minX: car.x - w / 2, maxX: car.x + w / 2, minZ: car.z - d / 2, maxZ: car.z + d / 2 });
  }
  c.push(...FENCES);
  c.push({ minX: -10, maxX: MAP_W + 10, minZ: -10, maxZ: 7.3 }); // 강
  c.push({ minX: 22.5, maxX: 41.5, minZ: 25.5, maxZ: 34.5 }); // 연못 (대략)
  c.push({ minX: -10, maxX: 0.3, minZ: -10, maxZ: MAP_H + 10 }, { minX: MAP_W - 0.3, maxX: MAP_W + 10, minZ: -10, maxZ: MAP_H + 10 }, { minX: -10, maxX: MAP_W + 10, minZ: MAP_H - 0.3, maxZ: MAP_H + 10 });
  return c;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// ---------- 타일 그리기 ----------
function drawTile(g: CanvasRenderingContext2D, t: T, px: number, py: number, rand: () => number, n: (dx: number, dz: number) => T) {
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(px + x, py + y, w, h);
  };
  switch (t) {
    case T.GRASS:
    case T.PARK:
    case T.FLOWER: {
      const base = t === T.GRASS ? '#78c850' : '#6cbd4a';
      r(0, 0, 16, 16, base);
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(rand() * 14);
        const y = Math.floor(rand() * 13);
        r(x, y + 1, 1, 2, '#4f9a35');
        r(x + 2, y, 1, 3, '#4f9a35');
      }
      if (rand() < 0.3) r(Math.floor(rand() * 15), Math.floor(rand() * 15), 1, 1, '#a8e070');
      if (t === T.FLOWER) {
        const fc = ['#ff8fab', '#ffd166', '#ffffff', '#b28dff'][Math.floor(rand() * 4)];
        const x = 3 + Math.floor(rand() * 9);
        const y = 3 + Math.floor(rand() * 9);
        r(x, y - 1, 1, 1, fc);
        r(x - 1, y, 3, 1, fc);
        r(x, y + 1, 1, 1, fc);
        r(x, y, 1, 1, '#ffb347');
        r(x + 1, y + 2, 1, 2, '#3f8a2a');
      }
      break;
    }
    case T.ROAD: {
      r(0, 0, 16, 16, '#55555f');
      if (rand() < 0.5) r(Math.floor(rand() * 15), Math.floor(rand() * 15), 1, 1, '#4a4a53');
      if (rand() < 0.3) r(Math.floor(rand() * 15), Math.floor(rand() * 15), 1, 1, '#62626d');
      // 연석
      if (n(0, -1) === T.WALK) r(0, 0, 16, 1, '#3b3b44');
      if (n(0, 1) === T.WALK) r(0, 15, 16, 1, '#3b3b44');
      if (n(-1, 0) === T.WALK) r(0, 0, 1, 16, '#3b3b44');
      if (n(1, 0) === T.WALK) r(15, 0, 1, 16, '#3b3b44');
      break;
    }
    case T.WALK: {
      r(0, 0, 16, 16, '#d8cfc0');
      r(0, 7, 16, 1, '#c4baa8');
      r(0, 15, 16, 1, '#c4baa8');
      r(7, 0, 1, 7, '#c4baa8');
      r(15, 8, 1, 7, '#c4baa8');
      r(1, 1, 5, 1, '#e8e0d2');
      r(9, 9, 5, 1, '#e8e0d2');
      if (n(0, 1) === T.ROAD) r(0, 14, 16, 2, '#a9a090');
      if (n(0, -1) === T.ROAD) r(0, 0, 16, 2, '#a9a090');
      if (n(1, 0) === T.ROAD) r(14, 0, 2, 16, '#a9a090');
      if (n(-1, 0) === T.ROAD) r(0, 0, 2, 16, '#a9a090');
      break;
    }
    case T.WATER: {
      r(0, 0, 16, 16, '#3a8ee6');
      r(2 + Math.floor(rand() * 8), 3 + Math.floor(rand() * 10), 4, 1, '#6cb4ff');
      r(Math.floor(rand() * 10), Math.floor(rand() * 14), 3, 1, '#2f78c8');
      const land = (t2: T) => t2 !== T.WATER;
      if (land(n(0, -1))) {
        r(0, 0, 16, 2, '#b8e3ff');
        r(0, 2, 16, 1, '#2f78c8');
      }
      if (land(n(0, 1))) r(0, 14, 16, 2, '#2f78c8');
      if (land(n(-1, 0))) r(0, 0, 2, 16, '#b8e3ff');
      if (land(n(1, 0))) r(14, 0, 2, 16, '#b8e3ff');
      break;
    }
    case T.SAND:
      r(0, 0, 16, 16, '#e8d49a');
      r(Math.floor(rand() * 14), Math.floor(rand() * 14), 2, 1, '#d4bd7c');
      r(0, 0, 16, 2, '#f6ecc4');
      break;
    case T.DIRT:
      r(0, 0, 16, 16, '#d2a86b');
      r(Math.floor(rand() * 14), Math.floor(rand() * 14), 2, 1, '#b98d50');
      r(Math.floor(rand() * 14), Math.floor(rand() * 14), 1, 1, '#e8c58c');
      break;
    case T.TRACK:
      r(0, 0, 16, 16, '#c8643c');
      r(0, 7, 16, 1, 'rgba(255,255,255,.55)');
      r(7, 0, 1, 16, 'rgba(255,255,255,.0)');
      if (rand() < 0.4) r(Math.floor(rand() * 15), Math.floor(rand() * 15), 1, 1, '#b55530');
      break;
    case T.PLAZA: {
      r(0, 0, 16, 16, '#cfc7d8');
      r(0, 0, 8, 8, '#d9d2e2');
      r(8, 8, 8, 8, '#d9d2e2');
      r(0, 15, 16, 1, '#b8afc4');
      r(15, 0, 1, 16, '#b8afc4');
      break;
    }
    case T.LOT:
      r(0, 0, 16, 16, '#6a6a74');
      r(0, 0, 1, 16, '#f2f2f2');
      break;
  }
}

function drawBuilding(g: CanvasRenderingContext2D, b: Building) {
  const R = (x: number, z: number, w: number, d: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.round(ax(x)), Math.round(ax(z)), Math.round(w * U), Math.round(d * U));
  };
  const P = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  const OUT = '#2a2140';
  const wallTop = b.z + b.d - b.wall;
  // 그림자
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.fillRect(ax(b.x + b.w), ax(b.z + 0.5), 10, ax(b.d) - 4);
  g.fillRect(ax(b.x) + 6, ax(b.z + b.d), ax(b.w), 6);
  // 지붕
  R(b.x, b.z, b.w, b.d - b.wall, b.roof);
  const tall = b.wall >= 8;
  if (tall) {
    // 옥상: 평평 + 난간 + 설비
    R(b.x, b.z, b.w, 0.25, shade(b.roof, 1.3));
    R(b.x + 1, b.z + 1, b.w - 2, b.d - b.wall - 2, shade(b.roof, 1.12));
    R(b.x + 2, b.z + 1.6, 3, 2, '#9aa3ad');
    R(b.x + 2, b.z + 1.6, 3, 0.3, '#c9d0d8');
    R(b.x + b.w - 5, b.z + 2, 2, 2, '#cfd6dd');
  } else {
    // 기와/슬레이트 줄
    for (let z = b.z; z < wallTop; z += 0.5) R(b.x, z, b.w, 0.12, shade(b.roof, (z - b.z) % 1 < 0.5 ? 0.8 : 0.9));
    R(b.x, b.z, b.w, 0.3, shade(b.roof, 1.3));
    R(b.x + b.w / 2 - 0.1, b.z, 0.2, b.d - b.wall, shade(b.roof, 0.75));
  }
  R(b.x, wallTop - 0.35, b.w, 0.35, shade(b.roof, 0.6)); // 처마
  // 정면 벽
  R(b.x, wallTop, b.w, b.wall, b.color);
  R(b.x, wallTop, b.w, 0.2, shade(b.color, 0.75));
  R(b.x, b.z + b.d - 0.3, b.w, 0.3, shade(b.color, 0.7));
  // 창문 (층마다)
  const floors = Math.max(1, Math.floor((b.wall - 1.6) / 2));
  const cols = Math.max(2, Math.floor(b.w / 2.6));
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = b.x + ((c + 0.5) * b.w) / cols - 0.6;
      const wz = wallTop + 0.6 + f * 2;
      if (f === floors - 1 && Math.abs(wx + 0.6 - (b.x + b.w / 2)) < 1.4) continue;
      const px = Math.round(ax(wx));
      const py = Math.round(ax(wz));
      P(px - 1, py - 1, 21, 17, OUT);
      P(px, py, 19, 15, '#8fd0ff');
      P(px, py, 19, 4, '#c8ecff');
      P(px + 9, py, 1, 15, OUT);
      P(px + 2, py + 6, 3, 1, '#ffffff');
    }
  }
  // 문 + 차양
  const dx = Math.round(ax(b.x + b.w / 2)) - 10;
  const dy = Math.round(ax(b.z + b.d)) - 26;
  P(dx - 1, dy - 1, 22, 27, OUT);
  P(dx, dy, 20, 26, '#7a4a2a');
  P(dx + 2, dy + 2, 16, 22, '#8f5a34');
  P(dx + 14, dy + 13, 2, 2, '#ffd166');
  if (b.sign) {
    for (let k = 0; k < 8; k++) P(dx - 6 + k * 4, dy - 8, 4, 6, k % 2 ? '#fff' : b.roof);
    P(dx - 6, dy - 2, 32, 1, OUT);
  }
  // 외곽선
  g.strokeStyle = OUT;
  g.lineWidth = 2;
  g.strokeRect(ax(b.x) + 1, ax(b.z) + 1, ax(b.w) - 2, ax(b.d) - 2);
  // 문 앞 매트
  P(dx - 2, Math.round(ax(b.z + b.d)) + 1, 24, 5, '#b04545');
}

function drawFence(g: CanvasRenderingContext2D, f: Rect) {
  const horiz = f.maxX - f.minX > f.maxZ - f.minZ;
  g.fillStyle = '#8b5a2b';
  if (horiz) {
    const y = ax(f.minZ);
    g.fillRect(ax(f.minX), y - 4, ax(f.maxX - f.minX), 3);
    g.fillRect(ax(f.minX), y + 2, ax(f.maxX - f.minX), 3);
    for (let x = ax(f.minX); x < ax(f.maxX); x += 8) {
      g.fillStyle = '#a0703a';
      g.fillRect(x, y - 8, 4, 16);
      g.fillStyle = '#5e3b1c';
      g.fillRect(x, y + 7, 4, 1);
      g.fillStyle = '#8b5a2b';
    }
  } else {
    const x = ax(f.minX);
    g.fillRect(x, ax(f.minZ), 4, ax(f.maxZ - f.minZ));
    for (let y = ax(f.minZ); y < ax(f.maxZ); y += 8) {
      g.fillStyle = '#a0703a';
      g.fillRect(x - 2, y, 8, 4);
      g.fillStyle = '#8b5a2b';
    }
  }
}

/** 움직이지 않는 바닥·건물을 한 번 그려 둔다 */
export function renderMap(): HTMLCanvasElement {
  const grid0 = buildGrid();
  const c = document.createElement('canvas');
  c.width = MAP_PXW;
  c.height = MAP_PXH;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const rand = rng(5);
  for (let z = 0; z < MAP_H; z++)
    for (let x = 0; x < MAP_W; x++) {
      const n = (dx: number, dz: number) => {
        const xx = x + dx;
        const zz = z + dz;
        if (xx < 0 || zz < 0 || xx >= MAP_W || zz >= MAP_H) return grid0[z * MAP_W + x] as T;
        return grid0[zz * MAP_W + xx] as T;
      };
      drawTile(g, grid0[z * MAP_W + x] as T, x * U, z * U, rand, n);
    }
  // 차선·횡단보도
  g.fillStyle = '#f5e6a0';
  for (const r of H_ROADS)
    for (let x = r.x0; x < r.x1; x += 3) if (x < 72 || x > 84) g.fillRect(ax(x), ax(r.z + 2) - 1, 24, 2);
  for (const r of V_ROADS)
    for (let z = r.z0; z < r.z1; z += 3) if (!H_ROADS.some((h) => z > h.z - 4 && z < h.z + 7)) g.fillRect(ax(r.x + 3) - 1, ax(z), 2, 24);
  g.fillStyle = '#f2f2f2';
  for (const h of H_ROADS) {
    for (let k = 0; k < 6; k++) {
      g.fillRect(ax(76 + k) + 3, ax(h.z - 2) + 4, 10, 24);
      g.fillRect(ax(76 + k) + 3, ax(h.z + 4) + 4, 10, 24);
    }
    for (let k = 0; k < 4; k++) {
      g.fillRect(ax(74) + 4, ax(h.z + k) + 3, 24, 10);
      g.fillRect(ax(82) + 4, ax(h.z + k) + 3, 24, 10);
    }
  }
  // 주차선
  g.fillStyle = '#f2f2f2';
  for (let i = 0; i <= 9; i++) {
    g.fillRect(ax(87.5 + i * 3), ax(65.5), 2, 48);
    g.fillRect(ax(87.5 + i * 3), ax(75), 2, 48);
  }
  // 울타리
  for (const f of FENCES) drawFence(g, f);
  // 벤치
  for (const [x, z] of BENCHES) {
    const px = ax(x - 1.1);
    const py = ax(z) - 6;
    g.fillStyle = '#5e3b1c';
    g.fillRect(px + 2, py + 6, 3, 8);
    g.fillRect(px + 30, py + 6, 3, 8);
    g.fillStyle = '#a0703a';
    g.fillRect(px, py, 35, 4);
    g.fillRect(px, py + 6, 35, 4);
    g.fillStyle = '#c58b4e';
    g.fillRect(px, py, 35, 1);
  }
  // 차
  for (const car of CARS) {
    const w = car.v ? 1.6 : 3;
    const d = car.v ? 3 : 1.6;
    const px = Math.round(ax(car.x - w / 2));
    const py = Math.round(ax(car.z - d / 2));
    const W = Math.round(ax(w));
    const D = Math.round(ax(d));
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.fillRect(px + 2, py + 4, W, D);
    g.fillStyle = '#2a2140';
    g.fillRect(px - 1, py - 1, W + 2, D + 2);
    g.fillStyle = car.c;
    g.fillRect(px, py, W, D);
    g.fillStyle = '#9fd3ff';
    if (car.v) {
      g.fillRect(px + 3, py + 8, W - 6, 8);
      g.fillRect(px + 3, py + D - 12, W - 6, 5);
    } else {
      g.fillRect(px + 8, py + 3, 8, D - 6);
      g.fillRect(px + W - 12, py + 3, 5, D - 6);
    }
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillRect(px, py, W, 2);
  }
  // 건물 (위에서 아래 순서로)
  for (const b of [...BUILDINGS].sort((a, b2) => a.z + a.d - (b2.z + b2.d))) drawBuilding(g, b);
  return c;
}
