// 미션 대화 장면의 도트 배경 (128x80 도트). 시간대에 따라 창밖 하늘색이 바뀐다.
export type SceneKind = 'office' | 'pasta' | 'park';

export const SCENE_W = 128;
export const SCENE_H = 80;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function sky(clock: number): [string, string] {
  const h = clock / 60;
  if (h < 16.5) return ['#7ec8ff', '#bfe6ff'];
  if (h < 18.5) return ['#ff9a6b', '#ffd27a'];
  if (h < 19.5) return ['#6a4a9c', '#ff8f7a'];
  return ['#141a3c', '#2c2f6b'];
}

export function drawScene(c: HTMLCanvasElement, kind: SceneKind, clock: number) {
  c.width = SCENE_W;
  c.height = SCENE_H;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const rand = rng(kind.length * 99);
  const [s1, s2] = sky(clock);
  const night = clock >= 19.5 * 60;

  if (kind === 'office') {
    // 벽
    r(0, 0, 128, 80, '#d9dde6');
    for (let x = 0; x < 128; x += 16) r(x, 0, 1, 56, '#cdd2dc');
    // 큰 창문
    const win = (x: number) => {
      r(x, 6, 34, 30, '#5b6b7c');
      for (let y = 0; y < 26; y++) r(x + 2, 8 + y, 30, 1, y < 13 ? s1 : s2);
      // 건물 실루엣
      r(x + 4, 24, 6, 12, '#4b5a72');
      r(x + 12, 18, 7, 18, '#56657d');
      r(x + 21, 22, 9, 14, '#4b5a72');
      for (let k = 0; k < 8; k++) r(x + 5 + ((k * 7) % 24), 20 + ((k * 5) % 13), 1, 1, night ? '#ffe08a' : '#9fb4c7');
      r(x + 16, 8, 1, 28, '#5b6b7c');
      r(x + 2, 21, 30, 1, '#5b6b7c');
    };
    win(10);
    win(84);
    // 벽시계
    r(58, 8, 12, 12, '#fff');
    r(57, 9, 1, 10, '#333');
    r(70, 9, 1, 10, '#333');
    r(58, 7, 12, 1, '#333');
    r(58, 20, 12, 1, '#333');
    r(63, 10, 1, 4, '#222');
    r(63, 13, 4, 1, '#c0392b');
    // 화분
    r(50, 40, 6, 8, '#b5651d');
    r(48, 32, 10, 9, '#3f9a4a');
    r(50, 30, 3, 4, '#5fbf5f');
    // 바닥
    r(0, 56, 128, 24, '#9aa3ad');
    for (let x = 0; x < 128; x += 12) r(x, 56, 1, 24, '#8a929b');
    r(0, 56, 128, 1, '#7d858e');
    // 책상 + 모니터 (앞)
    r(0, 60, 40, 6, '#a9744f');
    r(0, 66, 40, 14, '#8b5a2b');
    r(6, 48, 16, 12, '#2d3047');
    r(8, 50, 12, 8, '#4f8cff');
    r(9, 51, 6, 1, '#cfe8ff');
    r(13, 58, 2, 2, '#2d3047');
    r(26, 54, 8, 6, '#fff');
    r(27, 55, 6, 1, '#999');
    r(27, 57, 5, 1, '#999');
    r(96, 60, 32, 6, '#a9744f');
    r(96, 66, 32, 14, '#8b5a2b');
    r(104, 52, 10, 8, '#f4f4f4');
    r(106, 50, 6, 2, '#ddd');
    r(118, 54, 5, 6, '#c0392b');
    r(119, 52, 3, 2, '#fff');
  } else if (kind === 'pasta') {
    // 따뜻한 벽 + 벽돌
    r(0, 0, 128, 80, '#f3d9b1');
    for (let y = 0; y < 50; y += 5)
      for (let x = (y / 5) % 2 ? 0 : 6; x < 128; x += 12) {
        r(x, y, 11, 4, '#ecc99a');
      }
    // 창문 (밤 하늘)
    r(14, 8, 30, 26, '#6b3f1f');
    for (let y = 0; y < 22; y++) r(16, 10 + y, 26, 1, y < 11 ? s1 : s2);
    r(28, 10, 2, 22, '#6b3f1f');
    r(16, 20, 26, 2, '#6b3f1f');
    if (night) {
      r(20, 13, 1, 1, '#fff');
      r(36, 15, 1, 1, '#fff');
      r(24, 26, 1, 1, '#ffe08a');
    }
    // 메뉴판
    r(84, 8, 32, 26, '#2e3b2f');
    r(83, 7, 34, 1, '#8b5a2b');
    r(83, 34, 34, 1, '#8b5a2b');
    for (let k = 0; k < 4; k++) {
      r(88, 12 + k * 5, 14 + ((k * 5) % 9), 1, '#e8e8e8');
      r(108, 12 + k * 5, 4, 1, '#ffd166');
    }
    // 조명
    for (const x of [56, 72]) {
      r(x, 0, 1, 10, '#333');
      r(x - 4, 10, 9, 4, '#2e8b57');
      r(x - 2, 14, 5, 2, '#ffe08a');
      g.fillStyle = 'rgba(255,220,140,.18)';
      g.beginPath();
      g.moveTo(x - 4, 14);
      g.lineTo(x + 5, 14);
      g.lineTo(x + 16, 50);
      g.lineTo(x - 15, 50);
      g.fill();
    }
    // 바닥
    r(0, 50, 128, 30, '#a0522d');
    for (let x = 0; x < 128; x += 8) r(x, 50, 1, 30, '#8f4826');
    // 테이블 (체크 식탁보)
    r(0, 60, 128, 20, '#fff');
    for (let y = 60; y < 80; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 128; x += 8) r(x, y, 4, 4, '#e2445c');
    r(0, 59, 128, 1, '#b8323f');
    // 파스타 접시 + 와인잔 + 촛불
    r(14, 62, 22, 6, '#f4f4f4');
    r(18, 61, 14, 4, '#ffcf6b');
    r(20, 60, 4, 2, '#e2445c');
    r(92, 54, 6, 6, 'rgba(200,230,255,.8)');
    r(94, 60, 2, 6, '#ddd');
    r(92, 66, 6, 1, '#ddd');
    r(60, 58, 4, 8, '#fff6e0');
    r(61, 55, 2, 3, '#ffb347');
    r(61, 54, 2, 1, '#fff2a8');
  } else {
    // 밤 공원
    for (let y = 0; y < 50; y++) r(0, y, 128, 1, y < 25 ? s1 : s2);
    if (night || clock >= 19 * 60) {
      for (let k = 0; k < 30; k++) r(Math.floor(rand() * 128), Math.floor(rand() * 30), 1, 1, rand() < 0.3 ? '#ffe08a' : '#fff');
      r(100, 6, 8, 8, '#fff6c8');
      r(99, 7, 1, 6, '#fff6c8');
      r(108, 7, 1, 6, '#fff6c8');
      r(102, 8, 2, 2, '#e8dca0');
    }
    // 먼 나무 실루엣
    for (let x = -4; x < 132; x += 10) {
      const h = 10 + ((x * 7) % 9);
      r(x, 50 - h, 10, h, '#1f3d2b');
      r(x + 2, 48 - h, 6, 2, '#1f3d2b');
    }
    // 잔디 + 트랙
    r(0, 50, 128, 30, '#2f6b3a');
    for (let k = 0; k < 60; k++) r(Math.floor(rand() * 128), 50 + Math.floor(rand() * 30), 1, 2, '#3f8a4a');
    r(0, 58, 128, 8, '#b5643a');
    r(0, 61, 128, 1, 'rgba(255,255,255,.5)');
    r(0, 58, 128, 1, '#8f4826');
    // 가로등 + 불빛
    r(18, 22, 2, 36, '#444');
    r(14, 20, 10, 3, '#333');
    r(15, 23, 8, 2, '#ffe9a8');
    g.fillStyle = 'rgba(255,230,160,.18)';
    g.beginPath();
    g.moveTo(15, 25);
    g.lineTo(23, 25);
    g.lineTo(36, 66);
    g.lineTo(2, 66);
    g.fill();
    // 벤치 + 음료 박스
    r(86, 58, 30, 3, '#8b5a2b');
    r(88, 61, 2, 6, '#5e3b1c');
    r(112, 61, 2, 6, '#5e3b1c');
    r(86, 52, 30, 2, '#8b5a2b');
    r(96, 50, 12, 8, '#1e88e5');
    r(97, 51, 10, 2, '#fff');
    // 러닝크루 깃발
    r(60, 30, 1, 28, '#ddd');
    r(61, 30, 14, 8, '#ff6b81');
    r(64, 32, 8, 1, '#fff');
    r(64, 35, 6, 1, '#fff');
  }
}
