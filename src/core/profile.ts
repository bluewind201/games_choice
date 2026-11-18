// 플레이어/NPC 성향 프로필과 생년월일 기반 자동 산출 (모두 기기 안에서 계산, 네트워크 없음)

export type Blood = 'A' | 'B' | 'O' | 'AB';
export type GenId = 'BOOM' | 'X' | 'M' | 'Z' | 'ALPHA';
export type Element = 'FIRE' | 'EARTH' | 'AIR' | 'WATER';

export interface Profile {
  mbti: string; // 예: 'ESTJ'
  blood: Blood;
  birthYear: number;
  birthMonth: number; // 1~12
  birthDay: number; // 1~31
}

export const ZODIAC_KR = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;

export const SIGNS = [
  '양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리',
  '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리',
] as const;

// 각 별자리 시작일(월, 일). 인덱스는 SIGNS와 같음.
const SIGN_START: [number, number][] = [
  [3, 21], [4, 20], [5, 21], [6, 22], [7, 23], [8, 23],
  [9, 24], [10, 23], [11, 23], [12, 25], [1, 20], [2, 19],
];

export const ELEMENT_OF_SIGN: Element[] = SIGNS.map((_, i) => (['FIRE', 'EARTH', 'AIR', 'WATER'] as Element[])[i % 4]);

export const ELEMENT_LABEL: Record<Element, string> = { FIRE: '불', EARTH: '흙', AIR: '공기', WATER: '물' };

export const GEN_LABEL: Record<GenId, string> = {
  BOOM: '베이비붐', X: 'X세대', M: 'M세대', Z: 'Z세대', ALPHA: '알파세대',
};
export const GEN_ORDER: GenId[] = ['BOOM', 'X', 'M', 'Z', 'ALPHA'];

/** 띠 인덱스 (양력 연도 기준 단순화: 1900년 = 쥐띠) */
export function zodiacKrIndex(year: number): number {
  return (((year - 1900) % 12) + 12) % 12;
}

/** 서양 별자리 인덱스 */
export function signIndex(month: number, day: number): number {
  // 시작일이 (month, day) 이전이거나 같은 별자리 중 가장 늦은 것
  let best = 9; // 1월 1일~1월 19일은 염소자리
  let bestKey = -1;
  const key = month * 100 + day;
  SIGN_START.forEach(([m, d], i) => {
    const k = m * 100 + d;
    if (k <= key && k > bestKey) {
      bestKey = k;
      best = i;
    }
  });
  return best;
}

export function generationOf(year: number): GenId {
  if (year <= 1964) return 'BOOM';
  if (year <= 1979) return 'X';
  if (year <= 1994) return 'M';
  if (year <= 2009) return 'Z';
  return 'ALPHA';
}

export interface Derived {
  zodiacKr: number;
  sign: number;
  element: Element;
  gen: GenId;
}

export function derive(p: Profile): Derived {
  const sign = signIndex(p.birthMonth, p.birthDay);
  return {
    zodiacKr: zodiacKrIndex(p.birthYear),
    sign,
    element: ELEMENT_OF_SIGN[sign],
    gen: generationOf(p.birthYear),
  };
}

export function describe(p: Profile): string {
  const d = derive(p);
  return `${p.mbti} · ${p.blood}형 · ${String(p.birthYear).slice(2)}년생 ${ZODIAC_KR[d.zodiacKr]}띠 · ${SIGNS[d.sign]}`;
}
