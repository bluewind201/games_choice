// v0.5 웹판(src/) 전용 옛 지도. 넓은 새 지도는 map.ts (고도 판이 씀).
// 2D 탑다운 동네 지도. 월드 좌표 -50~50 (1칸 = 1), 그림은 1칸 = 16 도트.
import { PLACES, Place } from './data_v05';

export const U = 16;
export const HALF = 50;
export const MAP_PX = HALF * 2 * U;

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** 월드 → 지도 도트 */
export const ax = (x: number) => (x + HALF) * U;

export const TREES: [number, number][] = [
  [-36, -10], [-18, -10], [-36, -30], [-18, -30], [-28, -36], [-10, -20], [-40, 10], [-40, 30], [-12, 40], [16, 40],
  [40, 34], [40, 12], [12, -14], [40, -36], [-10, -40], [14, 12], [-14, 22], [38, -12], [-44, -44], [44, 44], [-44, 44], [30, 40],
];
export const LAMPS: [number, number][] = [[-5, -5], [5, 5], [-5, 20], [5, -20], [20, -5], [-20, 5], [12, 30], [-30, -5]];
const CARS: { x: number; z: number; c: string; v: boolean }[] = [
  { x: 14, z: -4.2, c: '#e2445c', v: false },
  { x: -16, z: 4.2, c: '#ffd166', v: false },
  { x: 4.2, z: 18, c: '#4f6dff', v: true },
];
export const BENCH: Rect = { minX: -32.2, maxX: -29.8, minZ: -13.2, maxZ: -12.4 };

/** 문이 어느 쪽에 있는지: 큰길 쪽 */
export const doorSide = (p: Place) => (p.z > 0 ? 'north' : 'south');

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function placeRect(p: Place): Rect {
  return { minX: p.x - p.w / 2, maxX: p.x + p.w / 2, minZ: p.z - p.d / 2, maxZ: p.z + p.d / 2 };
}

export function buildColliders(): Rect[] {
  const c: Rect[] = PLACES.map(placeRect);
  for (const [x, z] of TREES) c.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.2, maxZ: z + 0.35 });
  for (const [x, z] of LAMPS) c.push({ minX: x - 0.15, maxX: x + 0.15, minZ: z - 0.1, maxZ: z + 0.15 });
  for (const car of CARS) {
    const w = car.v ? 1.8 : 3.4;
    const d = car.v ? 3.4 : 1.8;
    c.push({ minX: car.x - w / 2, maxX: car.x + w / 2, minZ: car.z - d / 2, maxZ: car.z + d / 2 });
  }
  c.push(BENCH);
  c.push({ minX: -60, maxX: 60, minZ: -60, maxZ: -40 }); // 강
  c.push({ minX: 46, maxX: 60, minZ: -60, maxZ: 60 }, { minX: -60, maxX: -46, minZ: -60, maxZ: 60 }, { minX: -60, maxX: 60, minZ: 46, maxZ: 60 });
  return c;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** 움직이지 않는 바닥·건물을 한 번 그려 둔다 */
export function renderMap(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = MAP_PX;
  c.height = MAP_PX;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const R = (x: number, z: number, w: number, d: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(Math.round(ax(x)), Math.round(ax(z)), Math.round(w * U), Math.round(d * U));
  };
  const rand = rng(7);

  // 잔디
  R(-50, -50, 100, 100, '#7cbf5a');
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = rand() < 0.5 ? '#6faf4f' : '#8bcc66';
    g.fillRect(Math.floor(rand() * MAP_PX), Math.floor(rand() * MAP_PX), 2, 1);
  }
  for (let i = 0; i < 500; i++) {
    const x = Math.floor(rand() * MAP_PX);
    const y = Math.floor(rand() * MAP_PX);
    g.fillStyle = '#5f9e44';
    g.fillRect(x, y, 1, 3);
    g.fillRect(x + 2, y + 1, 1, 2);
  }
  // 공원
  R(-42, -36, 30, 24, '#6db34d');
  for (let i = 0; i < 160; i++) {
    const x = ax(-41 + rand() * 28);
    const y = ax(-35 + rand() * 22);
    g.fillStyle = ['#ff8fab', '#ffd166', '#fff'][i % 3];
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  // 러닝 트랙
  g.strokeStyle = '#d98c5f';
  g.lineWidth = 1.4 * U;
  g.strokeRect(ax(-39), ax(-34), 24 * U, 20 * U);
  g.strokeStyle = 'rgba(255,255,255,.6)';
  g.lineWidth = 1;
  g.strokeRect(ax(-39) + 0.5, ax(-34) + 0.5, 24 * U, 20 * U);
  // 연못
  g.fillStyle = '#4aa3df';
  g.beginPath();
  g.ellipse(ax(-27), ax(-24), 4 * U, 2.6 * U, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7cc4f0';
  g.fillRect(ax(-29), ax(-25), 12, 2);
  g.fillRect(ax(-26), ax(-23), 10, 2);

  // 강
  R(-50, -50, 100, 10, '#3b8fd0');
  R(-50, -40.6, 100, 0.6, '#d9c38f');
  for (let i = 0; i < 260; i++) {
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.fillRect(Math.floor(rand() * MAP_PX), Math.floor(ax(-49.5 + rand() * 8.5)), 6, 1);
  }

  // 인도
  R(-4.5, -40, 9, 67, '#cfc8bb');
  R(-50, -4.5, 100, 9, '#cfc8bb');
  // 보도블록 줄
  g.fillStyle = 'rgba(0,0,0,.07)';
  for (let v = -40; v < 27; v += 1) {
    g.fillRect(ax(-4.5), ax(v), 9 * U, 1);
  }
  for (let v = -50; v < 50; v += 1) g.fillRect(ax(v), ax(-4.5), 1, 9 * U);
  // 도로
  R(-3, -40, 6, 66, '#4a4a55');
  R(-50, -3, 100, 6, '#4a4a55');
  for (let v = -40; v < 25; v += 3) if (Math.abs(v) > 4) R(-0.1, v, 0.2, 1.6, '#f5f0d0');
  for (let v = -50; v < 50; v += 3) if (Math.abs(v) > 4) R(v, -0.1, 1.6, 0.2, '#f5f0d0');
  // 횡단보도
  for (let k = 0; k < 6; k++) {
    R(-3 + k, -4.4, 0.6, 1.3, '#f2f2f2');
    R(-3 + k, 3.1, 0.6, 1.3, '#f2f2f2');
    R(-4.4, -3 + k, 1.3, 0.6, '#f2f2f2');
    R(3.1, -3 + k, 1.3, 0.6, '#f2f2f2');
  }
  // 건물 앞 길
  for (const p of PLACES) {
    const r = placeRect(p);
    if (doorSide(p) === 'north') R(p.x - 1, -4.5 + 9, 2, Math.max(0, r.minZ - 4.5), '#d8cfbe');
    else R(p.x - 1, r.maxZ, 2, Math.max(0, -4.5 - r.maxZ), '#d8cfbe');
  }

  // 벤치
  R(BENCH.minX, BENCH.minZ, BENCH.maxX - BENCH.minX, 0.8, '#8b5a2b');
  R(BENCH.minX, BENCH.minZ + 0.3, BENCH.maxX - BENCH.minX, 0.1, '#5e3b1c');

  // 차
  for (const car of CARS) {
    const w = car.v ? 1.8 : 3.4;
    const d = car.v ? 3.4 : 1.8;
    R(car.x - w / 2, car.z - d / 2 + 0.2, w, d, 'rgba(0,0,0,.25)');
    R(car.x - w / 2, car.z - d / 2, w, d, car.c);
    if (car.v) R(car.x - w / 2 + 0.2, car.z - 0.8, w - 0.4, 1.4, '#cfe8ff');
    else R(car.x - 0.8, car.z - d / 2 + 0.2, 1.4, d - 0.4, '#cfe8ff');
    R(car.x - w / 2, car.z - d / 2, w, 0.12, shade(car.c, 1.3));
  }

  // 건물
  for (const p of PLACES) drawBuilding(g, p, R);
  return c;
}

function drawBuilding(g: CanvasRenderingContext2D, p: Place, R: (x: number, z: number, w: number, d: number, c: string) => void) {
  const r = placeRect(p);
  const roof = p.roof ?? '#7d6fa8';
  const north = doorSide(p) === 'north';
  // 그림자
  R(r.minX + 0.3, r.minZ + 0.4, p.w, p.d, 'rgba(0,0,0,.22)');
  // 지붕
  R(r.minX, r.minZ, p.w, p.d, roof);
  g.fillStyle = shade(roof, 0.85);
  for (let z = r.minZ + 0.5; z < r.maxZ; z += 1) g.fillRect(Math.round(ax(r.minX)), Math.round(ax(z)), p.w * U, 2);
  R(r.minX, r.minZ, p.w, 0.25, shade(roof, 1.25));
  R(r.minX, r.maxZ - 0.25, p.w, 0.25, shade(roof, 0.6));
  R(r.minX, r.minZ, 0.25, p.d, shade(roof, 1.1));
  R(r.maxX - 0.25, r.minZ, 0.25, p.d, shade(roof, 0.7));
  // 큰 건물은 옥상 설비
  if (p.h >= 10) {
    R(p.x - 1.5, p.z - 1, 3, 2, '#9aa3ad');
    R(p.x - 1.5, p.z - 1, 3, 0.3, '#c3cad1');
    R(r.minX + 1, r.minZ + 1, 1.2, 1.2, '#cfd6dd');
  }
  // 정면 벽 (큰길 쪽)
  const wallD = Math.min(2.4, p.d * 0.35);
  const wz = north ? r.minZ : r.maxZ - wallD;
  R(r.minX, wz, p.w, wallD, p.color);
  R(r.minX, north ? wz + wallD - 0.15 : wz, p.w, 0.15, shade(p.color, 0.7));
  // 창문
  const n = Math.max(2, Math.floor(p.w / 3));
  for (let i = 0; i < n; i++) {
    const wx = r.minX + ((i + 0.5) * p.w) / n - 0.6;
    if (Math.abs(wx + 0.6 - p.x) < 1.4) continue;
    R(wx, wz + wallD * 0.25, 1.2, wallD * 0.45, '#8fc9ff');
    R(wx, wz + wallD * 0.25, 1.2, 0.12, '#e8f6ff');
  }
  // 문 + 차양
  R(p.x - 0.8, wz + wallD * 0.2, 1.6, wallD * 0.8, '#6b4226');
  R(p.x - 0.1, wz + wallD * 0.55, 0.15, 0.2, '#ffd166');
  const aw = north ? wz + wallD - 0.1 : wz + wallD - 0.1;
  for (let k = 0; k < 6; k++) R(p.x - 1.5 + k * 0.5, aw, 0.5, 0.5, k % 2 ? '#fff' : roof);
  // 문 앞 매트
  R(p.x - 0.9, north ? r.minZ - 0.6 : r.maxZ + 0.1, 1.8, 0.5, '#a0522d');
}
