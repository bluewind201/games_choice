// 5대 성향 상성 엔진.
// 기준: 03 DB 마스터시트를 정본으로 쓰고, 시트에 없는 조합은 GDD의 규칙으로 채운다.
// 별자리는 4원소 규칙만 사용한다 (각도 규칙은 쓰지 않음).
import { Blood, GenId, GEN_ORDER, Profile, derive, ELEMENT_OF_SIGN, Element } from './profile';

export type Layer = 'MBTI' | 'BLOOD' | 'GEN' | 'ZODIAC_KR' | 'WEST';
export const LAYERS_BY_LEVEL: Layer[] = ['MBTI', 'BLOOD', 'GEN', 'ZODIAC_KR', 'WEST'];

export interface LayerResult {
  layer: Layer;
  label: string; // 예: '천생연분', '상충살'
  favor: number; // 초기 호감 보정
  mult: number; // 배터리 소모 배율
}

export interface CompatResult {
  layers: LayerResult[];
  initFavor: number;
  batteryMult: number;
}

type Entry = [number, number, string]; // favor, mult, label

// ---------- MBTI ----------
// 시트 TB_MBTI_COMPAT (user → target)
const MBTI_SHEET: Record<string, Entry> = {
  'INFP>ESTJ': [-15, 1.5, '대환장 상극'],
  'INFP>ENFJ': [15, 0.8, '천생연분'],
  'ENFP>INTJ': [15, 0.9, '환상 보완'],
  'ENFP>ISTJ': [-12, 1.4, '현실 충돌'],
  'INTP>ENTJ': [12, 0.9, '전략 파트너'],
  'INTP>ESFJ': [-10, 1.4, '기빨림 주의'],
  'INFJ>ENTP': [15, 0.9, '지적 인력'],
  'INFJ>ESTP': [-12, 1.4, '극과 극 긴장'],
  'ISFP>ENTJ': [-15, 1.5, '멘탈 위기'],
  'ISFP>ESFJ': [12, 0.9, '평화로운 합'],
  'ISTP>ESTJ': [10, 1.0, '일처리 최강'],
  'ISTP>ENFJ': [-10, 1.3, '온도차 주의'],
  'ISFJ>ESTP': [12, 0.9, '상호 보완'],
  'ISTJ>ESFP': [-12, 1.4, '극한의 인내'],
  'ESTP>INFP': [-14, 1.4, '화성 금성'],
};
// GDD 2.2 환상의 보완 관계
const MBTI_COMPLEMENT = ['ENFP-INTJ', 'ENTP-INFJ', 'ESFP-ISTJ', 'ESTP-ISFJ', 'INFP-ENFJ', 'INTP-ENTJ'];

function lookupDirectional<T>(table: Record<string, T>, a: string, b: string): T | undefined {
  return table[`${a}>${b}`] ?? table[`${b}>${a}`];
}

export function mbtiCompat(a: string, b: string): Entry {
  const sheet = lookupDirectional(MBTI_SHEET, a, b);
  if (sheet) return sheet;
  if (MBTI_COMPLEMENT.includes(`${a}-${b}`) || MBTI_COMPLEMENT.includes(`${b}-${a}`)) return [15, 0.85, '환상 보완'];
  if (a === b) return [5, 1.0, '거울 같은 사이'];
  const diff = [1, 2, 3].filter((i) => a[i] !== b[i]).length; // S/N, T/F, J/P
  if (diff === 3) return [-12, 1.4, '대화 핀트 어긋남'];
  if (a[2] === b[2] && a[3] === b[3]) return [8, 0.9, '비즈니스 시너지'];
  return [0, 1.0, '무난'];
}

// ---------- 혈액형 ----------
// GDD 7장 4x4 표를 기본으로, 시트 TB_BLOOD_ZODIAC_GEN 값이 있으면 시트 우선.
const BLOOD_TABLE: Record<string, Entry> = {
  'A>A': [6, 1.05, '예의바른 눈치전'],
  'A>B': [-8, 1.2, '직설 충돌'], // 시트
  'A>O': [8, 0.9, '안정 조화'], // 시트
  'A>AB': [4, 1.05, '차분한 문서형'],
  'B>A': [-8, 1.3, '직구 화법 주의보'],
  'B>B': [6, 0.95, '스파크 튀는 텐션'],
  'B>O': [6, 1.0, '텐션 폭발'], // 시트
  'B>AB': [10, 0.9, '호기심 공명'], // 시트
  'O>A': [8, 0.9, '리더 케어'], // 시트
  'O>B': [8, 0.9, '유쾌한 행동파'],
  'O>O': [4, 1.15, '자존심과 의리 사이'],
  'O>AB': [-6, 1.25, '친근감 vs 사생활'],
  'AB>A': [6, 0.95, '합리적 평화'],
  'AB>B': [8, 0.9, '마이웨이 존중'],
  'AB>O': [-6, 1.1, '온도차 조율'], // 시트
  'AB>AB': [10, 0.8, '스마트 무간섭'],
};
export function bloodCompat(a: Blood, b: Blood): Entry {
  return BLOOD_TABLE[`${a}>${b}`];
}

// ---------- 세대 ----------
const GEN_SHEET: Record<string, Entry> = {
  'Z>X': [-12, 1.3, '세대 장벽'],
  'M>X': [-5, 1.1, '중간관리 조율'],
  'M>Z': [-8, 1.2, '후배 코칭'],
  'M>ALPHA': [-10, 1.3, '눈높이 육아'],
  'Z>BOOM': [-15, 1.4, '격세대 소통'],
};
export function genCompat(a: GenId, b: GenId): Entry {
  const sheet = lookupDirectional(GEN_SHEET, a, b);
  if (sheet) return sheet;
  const dist = Math.abs(GEN_ORDER.indexOf(a) - GEN_ORDER.indexOf(b));
  if (dist === 0) return [5, 0.95, '같은 세대 공감'];
  if (dist === 1) return [-5, 1.1, '한 세대 차이'];
  if (dist === 2) return [-10, 1.25, '두 세대 차이'];
  return [-15, 1.4, '격세대 소통'];
}

// ---------- 12지신 ----------
// 인덱스: 0쥐 1소 2호랑이 3토끼 4용 5뱀 6말 7양 8원숭이 9닭 10개 11돼지
const WONJIN: [number, number][] = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
export function zodiacKrCompat(a: number, b: number): Entry {
  const diff = Math.abs(a - b);
  const d = Math.min(diff, 12 - diff);
  if (a === b) return [3, 1.0, '같은 띠'];
  if (d === 4) return [15, 0.85, '삼합'];
  if (d === 6) return [-15, 1.4, '상충살'];
  if ((a + b) % 12 === 1) return [10, 0.9, '육합'];
  if (WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return [-12, 1.3, '원진살'];
  return [0, 1.0, '무난'];
}

// ---------- 서양 별자리 (4원소 규칙만) ----------
export function elementCompat(a: Element, b: Element): Entry {
  if (a === b) return [5, 0.95, '같은 원소'];
  const pair = [a, b].sort().join('-');
  switch (pair) {
    case 'AIR-FIRE':
      return [10, 0.9, '불과 공기 상생'];
    case 'EARTH-WATER':
      return [10, 0.9, '흙과 물 상생'];
    case 'FIRE-WATER':
      return [-10, 1.3, '불과 물 상극'];
    case 'AIR-EARTH':
      return [-8, 1.2, '흙과 공기 충돌'];
    default:
      return [0, 1.0, '무난'];
  }
}

// ---------- 합산 ----------
export const INIT_FAVOR_MIN = 20;
export const INIT_FAVOR_MAX = 80;
export const MULT_MIN = 0.6;
export const MULT_MAX = 2.0;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * level: 해금된 레이어 수 (1=MBTI만, 5=전체)
 * 초기 호감 = clamp(50 + Σ보정, 20, 80)
 * 배터리 배율 = clamp(1 + Σ(배율-1), 0.6, 2.0)  ← 곱셈 대신 덧셈으로 합산해 폭주 방지
 */
export function computeCompat(player: Profile, npc: Profile, level: number): CompatResult {
  const pd = derive(player);
  const nd = derive(npc);
  const all: Record<Layer, Entry> = {
    MBTI: mbtiCompat(player.mbti, npc.mbti),
    BLOOD: bloodCompat(player.blood, npc.blood),
    GEN: genCompat(pd.gen, nd.gen),
    ZODIAC_KR: zodiacKrCompat(pd.zodiacKr, nd.zodiacKr),
    WEST: elementCompat(ELEMENT_OF_SIGN[pd.sign], ELEMENT_OF_SIGN[nd.sign]),
  };
  const layers: LayerResult[] = LAYERS_BY_LEVEL.slice(0, clamp(level, 1, 5)).map((layer) => {
    const [favor, mult, label] = all[layer];
    return { layer, label, favor, mult };
  });
  const favorSum = layers.reduce((s, l) => s + l.favor, 0);
  const multSum = layers.reduce((s, l) => s + (l.mult - 1), 0);
  return {
    layers,
    initFavor: clamp(50 + favorSum, INIT_FAVOR_MIN, INIT_FAVOR_MAX),
    batteryMult: Math.round(clamp(1 + multSum, MULT_MIN, MULT_MAX) * 100) / 100,
  };
}
