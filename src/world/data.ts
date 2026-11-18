// 동네 맵 배치, 퀘스트, 상점, 성장 규칙 (오프라인, 전부 앱 안에 포함)
import type { Look } from './character';
import type { Emotion } from '../data/stages';

export type NpcKind = 'mission' | 'quest' | 'encounter' | 'shop';

export interface NpcDef {
  id: string;
  name: string;
  kind: NpcKind;
  x: number;
  z: number;
  look: Look;
  missionId?: string;
  /** 돌아다니는 경로 (encounter) */
  patrol?: [number, number][];
  line?: string;
}

export const NPCS: NpcDef[] = [
  { id: 'boss', name: '박 팀장', kind: 'mission', missionId: 'MS_301', x: 114, z: 32.8,
    look: { skin: '#e8b98c', hair: '#555', shirt: '#2d3047', pants: '#2d3047', glasses: 'round', hairStyle: 'part', tie: true } },
  { id: 'hana', name: '하나 (러닝크루)', kind: 'mission', missionId: 'MS_101', x: 30, z: 45,
    look: { skin: '#f2c9a0', hair: '#7a3e1d', shirt: '#ff6b81', pants: '#222', hat: 'cap', hatColor: '#fff', hairStyle: 'pony' } },
  { id: 'jiwoo', name: '지우 (소개팅)', kind: 'mission', missionId: 'MS_201', x: 106, z: 94.8,
    look: { skin: '#f6d2b0', hair: '#c47f3d', shirt: '#ffd166', pants: '#4f6dff', hairStyle: 'long' } },
  { id: 'clerk', name: '편의점 사장님', kind: 'shop', x: 55, z: 94.8,
    look: { skin: '#e8b98c', hair: '#222', shirt: '#1e88e5', pants: '#333', hat: 'cap', hatColor: '#1e88e5' } },
  { id: 'grandma', name: '옆집 할머니', kind: 'quest', x: 7.5, z: 94.8,
    look: { skin: '#e9c4a0', hair: '#ddd', shirt: '#8e6bbf', pants: '#5a4a6a', hairStyle: 'bun' } },
  { id: 'courier', name: '택배 기사님', kind: 'encounter', x: 10, z: 62.8, patrol: [[6, 62.8], [150, 62.8]],
    look: { skin: '#d9a77c', hair: '#222', shirt: '#2e8b57', pants: '#2e8b57', hat: 'cap', hatColor: '#2e8b57' } },
  { id: 'neighbor', name: '윗집 이웃', kind: 'encounter', x: 20, z: 100.8, patrol: [[4, 100.8], [70, 100.8]],
    look: { skin: '#f2c9a0', hair: '#111', shirt: '#999', pants: '#555', glasses: 'sun' } },
  { id: 'flyer', name: '전단지 알바생', kind: 'encounter', x: 90, z: 38.8, patrol: [[86, 38.8], [156, 38.8]],
    look: { skin: '#f6d2b0', hair: '#e2445c', shirt: '#fff', pants: '#222', hat: 'beanie', hatColor: '#ffd166' } },
];

export interface Encounter {
  npcId: string;
  title: string;
  line: string;
  emotion: Emotion;
  choices: { text: string; xp: number; money: number; battery: number; reaction: string; emotion: Emotion }[];
}

/** 길에서 부딪치면 일어나는 돌발 만남 (하루에 한 번씩) */
export const ENCOUNTERS: Encounter[] = [
  { npcId: 'courier', title: '택배 기사님과 쾅!', line: '아이고, 죄송해요! 바빠서 앞을 못 봤네요. 혹시 302호 택배인데, 그 집 사람 아세요?', emotion: 'PANIC',
    choices: [
      { text: '제가 302호 이웃이에요. 대신 받아서 전해 드릴게요!', xp: 25, money: 0, battery: -5, reaction: '정말요? 덕분에 한 집 줄었네요! 감사합니다! (+이웃 신뢰)', emotion: 'HAPPY' },
      { text: '괜찮아요! 302호는 저쪽 아파트 3층이에요.', xp: 15, money: 0, battery: 0, reaction: '아 고마워요! 길 찾는 시간 줄었네요.', emotion: 'HAPPY' },
      { text: '(못 본 척 지나간다)', xp: 0, money: 0, battery: 5, reaction: '...(기사님이 다른 사람에게 물어본다)', emotion: 'SUSPECT' },
    ] },
  { npcId: 'neighbor', title: '엘리베이터 앞 윗집 이웃', line: '아, 아랫집 분이시죠? 어제 밤에 좀 시끄러우셨죠... 저희 애들이 뛰어서요. 죄송해요.', emotion: 'CRY',
    choices: [
      { text: '괜찮아요! 대신 밤 10시 이후에만 조금 조심해 주시면 좋겠어요.', xp: 30, money: 0, battery: -8, reaction: '네, 꼭 그럴게요! 이거 애들이 만든 쿠키예요. (+쿠키)', emotion: 'HAPPY' },
      { text: '아니에요, 전혀 몰랐어요! 하하.', xp: 10, money: 0, battery: -12, reaction: '다행이다~ (오늘 밤도 쿵쿵거릴 것 같다)', emotion: 'NORMAL' },
      { text: '솔직히 좀 많이 시끄러웠어요.', xp: 5, money: 0, battery: 5, reaction: '아... 네. 죄송합니다. (분위기가 어색하다)', emotion: 'PANIC' },
    ] },
  { npcId: 'flyer', title: '전단지 알바생', line: '안녕하세요! 새로 생긴 헬스장인데요, 지금 등록하시면 첫 달 무료예요! 딱 1분만요!', emotion: 'HAPPY',
    choices: [
      { text: '전단지 남은 거 저 주세요. 회사 사람들한테 나눠 줄게요.', xp: 20, money: 3000, battery: -6, reaction: '헐 대박! 이거 제 사장님이 주신 커피 쿠폰인데 드릴게요! (+3,000원)', emotion: 'HAPPY' },
      { text: '아 네, 생각해 볼게요~', xp: 10, money: 0, battery: -3, reaction: '네! 꼭 와 주세요~', emotion: 'NORMAL' },
      { text: '죄송해요, 바빠서요.', xp: 0, money: 0, battery: 3, reaction: '(다음 사람에게 간다)', emotion: 'NORMAL' },
    ] },
];

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  minLevel: number;
  apply: Partial<Look>;
  icon: string;
}

export const SHOP: ShopItem[] = [
  { id: 'coffee', name: '아이스 아메리카노 (배터리 +25)', price: 1500, minLevel: 1, apply: {}, icon: '🧋' },
  { id: 'bandage', name: '반창고 (HP +30, 상태 회복)', price: 2000, minLevel: 1, apply: {}, icon: '🩹' },
  { id: 'shirt_red', name: '빨간 티셔츠', price: 3000, minLevel: 1, apply: { shirt: '#e2445c' }, icon: '👕' },
  { id: 'shirt_mint', name: '민트 티셔츠', price: 3000, minLevel: 1, apply: { shirt: '#43d39e' }, icon: '👕' },
  { id: 'shirt_yellow', name: '노란 후드', price: 5000, minLevel: 1, apply: { shirt: '#ffd166' }, icon: '🧥' },
  { id: 'pants_jean', name: '청바지', price: 4000, minLevel: 1, apply: { pants: '#3b5b92' }, icon: '👖' },
  { id: 'pants_beige', name: '베이지 면바지', price: 4000, minLevel: 1, apply: { pants: '#c8b48a' }, icon: '👖' },
  { id: 'hair_brown', name: '갈색 염색', price: 6000, minLevel: 1, apply: { hair: '#7a4a24' }, icon: '💇' },
  { id: 'hair_pink', name: '핑크 염색', price: 9000, minLevel: 2, apply: { hair: '#ff8fab' }, icon: '💇' },
  { id: 'cap', name: '야구 모자', price: 5000, minLevel: 1, apply: { hat: 'cap', hatColor: '#e2445c' }, icon: '🧢' },
  { id: 'beanie', name: '비니', price: 8000, minLevel: 2, apply: { hat: 'beanie', hatColor: '#4f6dff' }, icon: '🧶' },
  { id: 'glasses', name: '뿔테 안경', price: 6000, minLevel: 1, apply: { glasses: 'round' }, icon: '👓' },
  { id: 'sunglasses', name: '선글라스', price: 12000, minLevel: 3, apply: { glasses: 'sun' }, icon: '🕶️' },
  { id: 'bag', name: '주황 백팩', price: 15000, minLevel: 3, apply: { bag: true }, icon: '🎒' },
];

/** 퀘스트 보상으로만 얻는 아이템 */
export const REWARD_ITEMS: ShopItem[] = [
  { id: 'catears', name: '고양이 귀 머리띠', price: 0, minLevel: 1, apply: { hat: 'catears' }, icon: '🐱' },
];

export const MISSION_REWARD: Record<string, { money: number; xp: number }> = {
  S: { money: 30000, xp: 120 },
  A: { money: 20000, xp: 90 },
  B: { money: 10000, xp: 60 },
  F: { money: 0, xp: 20 },
};

export const xpToNext = (level: number) => 100 * level;

export const LEVEL_TITLE = ['', '사회생활 새내기', '눈치 수습생', '동네 인싸', '처세술 고수', '인간관계 마스터'];

export const CATS: [number, number][] = [
  [50, 19],
  [150, 82],
  [64, 116],
];
export const WALLET_POS: [number, number] = [14, 40];
export const BED_POS: [number, number] = [19, 94.6];

// ---------- 교통 ----------
export interface Stop {
  id: string;
  name: string;
  x: number;
  z: number;
}
/** 버스 정류장 (한 노선이 모두 돈다) */
export const BUS_STOPS: Stop[] = [
  { id: 'home', name: '주택가', x: 27, z: 94.7 },
  { id: 'park', name: '공원 앞', x: 44, z: 54.7 },
  { id: 'office', name: '회사 앞', x: 104, z: 32.7 },
  { id: 'pasta', name: '파스타 거리', x: 96, z: 94.7 },
];
export const BUS_FARE = 1500;
/** 지하철역 출입구 (두 역만 잇는다) */
export const SUBWAY: Stop[] = [
  { id: 'homest', name: '주택가역', x: 66, z: 94.6 },
  { id: 'cityst', name: '시청역', x: 136, z: 32.6 },
];
export const SUBWAY_FARE = 1400;
/** 공공자전거 대여소 */
export const BIKE_RACKS: Stop[] = [
  { id: 'home', name: '주택가', x: 11, z: 101.6 },
  { id: 'park', name: '공원 앞', x: 52, z: 54.7 },
  { id: 'office', name: '회사 앞', x: 128, z: 32.7 },
  { id: 'pasta', name: '파스타 거리', x: 114, z: 94.7 },
];
export const BIKE_FARE = 1000;
