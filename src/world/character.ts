// 블록형 레트로 3D 캐릭터. 파츠를 조합하고 색을 바꿔 꾸민다.
import * as THREE from 'three';

export interface Look {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  hat?: 'cap' | 'beanie' | 'catears' | null;
  hatColor?: string;
  glasses?: 'round' | 'sun' | null;
  bag?: boolean;
}

export const DEFAULT_LOOK: Look = { skin: '#f2c9a0', hair: '#2b2118', shirt: '#4f6dff', pants: '#2d3047', hat: null, glasses: null, bag: false };

const mat = (c: string) => new THREE.MeshLambertMaterial({ color: new THREE.Color(c), flatShading: true });
const box = (w: number, h: number, d: number, c: string) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));

export interface CharRig {
  root: THREE.Group;
  parts: { body: THREE.Mesh; head: THREE.Group; armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group; acc: THREE.Group };
  look: Look;
}

function limb(w: number, h: number, c: string, y: number, x: number): THREE.Group {
  const g = new THREE.Group();
  const m = box(w, h, w, c);
  m.position.y = -h / 2;
  g.add(m);
  g.position.set(x, y, 0);
  return g;
}

export function buildCharacter(look: Look = DEFAULT_LOOK): CharRig {
  const root = new THREE.Group();
  const body = box(0.7, 0.75, 0.42, look.shirt);
  body.position.y = 1.15;
  const head = new THREE.Group();
  const face = box(0.6, 0.6, 0.55, look.skin);
  head.add(face);
  const hair = box(0.64, 0.2, 0.6, look.hair);
  hair.position.set(0, 0.25, -0.02);
  head.add(hair);
  const back = box(0.64, 0.45, 0.12, look.hair);
  back.position.set(0, 0.05, -0.27);
  head.add(back);
  const eyeL = box(0.08, 0.1, 0.02, '#1a1a1a');
  eyeL.position.set(-0.13, 0.02, 0.28);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.13;
  head.add(eyeL, eyeR);
  head.position.y = 1.85;
  const armL = limb(0.2, 0.7, look.shirt, 1.5, -0.47);
  const armR = limb(0.2, 0.7, look.shirt, 1.5, 0.47);
  // 손
  [armL, armR].forEach((a) => {
    const hand = box(0.18, 0.15, 0.18, look.skin);
    hand.position.y = -0.75;
    a.add(hand);
  });
  const legL = limb(0.26, 0.78, look.pants, 0.78, -0.18);
  const legR = limb(0.26, 0.78, look.pants, 0.78, 0.18);
  const acc = new THREE.Group();
  root.add(body, head, armL, armR, legL, legR, acc);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
  });
  const rig: CharRig = { root, parts: { body, head, armL, armR, legL, legR, acc }, look: { ...look } };
  applyLook(rig, look);
  return rig;
}

function setColor(o: THREE.Object3D, c: string) {
  const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial;
  m.color.set(c);
}

export function applyLook(rig: CharRig, look: Look) {
  rig.look = { ...look };
  const { body, head, armL, armR, legL, legR } = rig.parts;
  setColor(body, look.shirt);
  setColor(head.children[0], look.skin);
  setColor(head.children[1], look.hair);
  setColor(head.children[2], look.hair);
  setColor(armL.children[0], look.shirt);
  setColor(armR.children[0], look.shirt);
  setColor(armL.children[1], look.skin);
  setColor(armR.children[1], look.skin);
  setColor(legL.children[0], look.pants);
  setColor(legR.children[0], look.pants);

  // 액세서리 다시 만들기
  const headAcc = head.getObjectByName('acc');
  if (headAcc) head.remove(headAcc);
  const ha = new THREE.Group();
  ha.name = 'acc';
  const hc = look.hatColor ?? '#e2445c';
  if (look.hat === 'cap') {
    const top = box(0.68, 0.18, 0.64, hc);
    top.position.set(0, 0.36, 0);
    const brim = box(0.6, 0.05, 0.3, hc);
    brim.position.set(0, 0.28, 0.42);
    ha.add(top, brim);
  } else if (look.hat === 'beanie') {
    const b = box(0.7, 0.3, 0.66, hc);
    b.position.set(0, 0.36, 0);
    const pom = box(0.14, 0.14, 0.14, '#ffffff');
    pom.position.set(0, 0.58, 0);
    ha.add(b, pom);
  } else if (look.hat === 'catears') {
    const band = box(0.66, 0.06, 0.12, '#333');
    band.position.set(0, 0.36, 0);
    const e1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), mat('#333'));
    e1.position.set(-0.2, 0.5, 0);
    const e2 = e1.clone();
    e2.position.x = 0.2;
    ha.add(band, e1, e2);
  }
  if (look.glasses === 'round' || look.glasses === 'sun') {
    const c = look.glasses === 'sun' ? '#111' : '#5a3b22';
    const l = box(0.2, 0.16, 0.03, c);
    l.position.set(-0.13, 0.02, 0.3);
    const r = l.clone();
    r.position.x = 0.13;
    const bridge = box(0.08, 0.03, 0.03, c);
    bridge.position.set(0, 0.05, 0.3);
    ha.add(l, r, bridge);
  }
  head.add(ha);

  rig.parts.acc.clear();
  if (look.bag) {
    const bag = box(0.55, 0.6, 0.25, '#ff9f1a');
    bag.position.set(0, 1.15, -0.34);
    rig.parts.acc.add(bag);
  }
}

/** 걷기 애니메이션 */
export function animateWalk(rig: CharRig, t: number, speed: number) {
  const s = Math.min(1, speed);
  const a = Math.sin(t * 10) * 0.7 * s;
  rig.parts.armL.rotation.x = a;
  rig.parts.armR.rotation.x = -a;
  rig.parts.legL.rotation.x = -a;
  rig.parts.legR.rotation.x = a;
  rig.parts.body.position.y = 1.15 + Math.abs(Math.sin(t * 10)) * 0.06 * s;
  rig.parts.head.position.y = 1.85 + Math.abs(Math.sin(t * 10)) * 0.06 * s;
}
