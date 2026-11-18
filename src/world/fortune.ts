// 오늘의 운세: 내 태어난 해의 천간 오행과 오늘 일진(60갑자)의 오행이 어떤 관계인지로 하루 운이 정해진다.
// 오프라인에서 날짜(게임 일차)만으로 계산하므로 같은 캐릭터는 같은 날 같은 운세를 받는다.
import type { Profile } from '../core/profile';

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const ELEMENTS = ['목', '화', '토', '금', '수'] as const;
const ELEMENT_ICON = ['🌳', '🔥', '⛰️', '⚙️', '💧'];

export type Hazard = 'stone' | 'puddle' | 'dog';
export type Buff = 'light' | 'coins' | 'calm';
export type Luck = 'great' | 'good' | 'soso' | 'bad';

export interface Fortune {
  day: number;
  pillar: string; // 예: '갑자일'
  pillarHanja: string; // 예: '甲子日'
  myElement: string;
  dayElement: string;
  relation: string; // 예: '나를 돕는 기운'
  luck: Luck;
  grade: string; // 대길·길·평·흉
  title: string; // 예: '오늘은 돌을 조심하세요'
  text: string;
  hazard?: Hazard;
  hazardCount: number;
  buff?: Buff;
  luckyColor: string;
  luckyDir: string;
}

export const HAZARD_INFO: Record<Hazard, { icon: string; name: string; title: string; text: string }> = {
  stone: { icon: '🪨', name: '돌', title: '오늘은 돌을 조심하세요', text: '길 위의 돌에 발이 걸리면 하루가 꼬입니다. 돌 근처로 가지 마세요. 걸리면 HP가 깎이고 한동안 절뚝거려요.' },
  puddle: { icon: '💧', name: '물웅덩이', title: '오늘은 물을 조심하세요', text: '젖은 발은 기운을 빼앗습니다. 물웅덩이를 밟으면 HP와 배터리가 깎이고 발이 무거워져요.' },
  dog: { icon: '🐕', name: '개', title: '오늘은 개를 조심하세요', text: '짖는 소리에 크게 놀랄 운입니다. 돌아다니는 개에게 가까이 가면 HP가 깎이고 한동안 정신이 없어요.' },
};

const COLORS = ['빨강', '노랑', '초록', '파랑', '보라', '하양', '검정', '주황'];
const DIRS = ['동쪽', '서쪽', '남쪽', '북쪽'];

function hash(n: number) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** 태어난 해의 천간 (1984 = 갑자년) */
export const yearStem = (year: number) => (((year - 4) % 10) + 10) % 10;
const elementOfStem = (stem: number) => Math.floor(stem / 2);

/** a가 b를 생한다 (목→화→토→금→수→목) */
const generates = (a: number, b: number) => (a + 1) % 5 === b;
/** a가 b를 극한다 (목→토, 토→수, 수→화, 화→금, 금→목) */
const overcomes = (a: number, b: number) => (a + 2) % 5 === b;

export function fortuneFor(profile: Profile, day: number): Fortune {
  // 게임 1일차를 갑자일에서 조금 비켜 시작한다 (생일마다 다르게)
  const seed = profile.birthMonth * 31 + profile.birthDay;
  const idx = (day - 1 + seed) % 60;
  const stem = idx % 10;
  const branch = idx % 12;
  const me = elementOfStem(yearStem(profile.birthYear));
  const today = elementOfStem(stem);
  const h = hash(day * 977 + seed * 13 + profile.birthYear);

  let luck: Luck;
  let relation: string;
  let buff: Buff | undefined;
  let hazard: Hazard | undefined;
  let hazardCount = 0;
  let title: string;
  let text: string;
  const hz: Hazard[] = ['stone', 'puddle', 'dog'];

  if (generates(today, me)) {
    luck = 'great';
    relation = `오늘의 ${ELEMENTS[today]} 기운이 나의 ${ELEMENTS[me]} 기운을 살려 줘요`;
    buff = 'light';
    title = '발걸음이 가벼운 날';
    text = '귀인의 기운이 함께해요. 하루 종일 걸음이 빨라지고, 다쳐도 금방 회복돼요.';
  } else if (overcomes(me, today)) {
    luck = 'good';
    relation = `나의 ${ELEMENTS[me]} 기운이 오늘의 ${ELEMENTS[today]} 기운을 다스려요 (재물운)`;
    buff = 'coins';
    title = '재물운이 들어오는 날';
    text = '길 위에 반짝이는 동전이 흩어져 있어요. 주우면 용돈이 돼요! 다만 작은 돌부리 몇 개는 조심하세요.';
    hazard = 'stone';
    hazardCount = 6;
  } else if (overcomes(today, me)) {
    luck = 'bad';
    relation = `오늘의 ${ELEMENTS[today]} 기운이 나의 ${ELEMENTS[me]} 기운을 누르는 날`;
    hazard = hz[(branch + (h % 3)) % 3];
    hazardCount = 34;
    title = HAZARD_INFO[hazard].title;
    text = HAZARD_INFO[hazard].text;
  } else if (generates(me, today)) {
    luck = 'soso';
    relation = `나의 ${ELEMENTS[me]} 기운이 오늘의 ${ELEMENTS[today]} 기운으로 흘러 나가요`;
    hazard = hz[h % 3];
    hazardCount = 14;
    buff = 'calm';
    title = `무난한 날, ${HAZARD_INFO[hazard].name}만 살짝 조심`;
    text = `크게 좋지도 나쁘지도 않아요. 기운이 조금 빠지니 무리하지 말고, ${HAZARD_INFO[hazard].name}만 조심하면 돼요.`;
  } else {
    luck = 'soso';
    relation = `오늘은 나와 같은 ${ELEMENTS[me]} 기운의 날`;
    hazard = hz[(h >> 3) % 3];
    hazardCount = 10;
    title = '평범하고 편안한 날';
    text = `익숙한 기운이라 마음이 편해요. 늘 하던 대로 하면 돼요. ${HAZARD_INFO[hazard].name}은 조금만 조심하세요.`;
  }
  const grade = { great: '대길 大吉', good: '길 吉', soso: '평 平', bad: '흉 凶' }[luck];
  return {
    day,
    pillar: `${STEMS[stem]}${BRANCHES[branch]}일`,
    pillarHanja: `${STEMS_HANJA[stem]}${BRANCHES_HANJA[branch]}日`,
    myElement: `${ELEMENT_ICON[me]} ${ELEMENTS[me]}`,
    dayElement: `${ELEMENT_ICON[today]} ${ELEMENTS[today]}`,
    relation,
    luck,
    grade,
    title,
    text,
    hazard,
    hazardCount,
    buff,
    luckyColor: COLORS[h % COLORS.length],
    luckyDir: DIRS[(h >> 5) % 4],
  };
}

/** 날마다 같은 자리에 놓이도록 시드로 위치를 뽑는다 */
export function seeded(day: number, salt: number) {
  let s = hash(day * 7919 + salt) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
