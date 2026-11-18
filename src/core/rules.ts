// 게임 밸런스 규칙. 수치는 전부 여기 모아 두고 조정한다.

export type ChoiceKind = 'match' | 'mask' | 'honest';

/**
 * 선택지 3종
 * - match(공략): 상대 성향을 정확히 읽은 말. 호감 크게 오르고 배터리 소모 적음. 어느 게 공략인지는 추리해야 함.
 * - mask(가면): 누구에게나 통하는 무난한 사회생활 멘트. 호감 조금 오르고 배터리 많이 소모.
 * - honest(본심): 내 마음대로 말하기. 호감이 떨어지지만 배터리를 회복.
 */
export const BATTERY_BASE: Record<ChoiceKind, number> = {
  match: -6,
  mask: -12,
  honest: +4,
};

export const KIND_LABEL: Record<ChoiceKind, string> = {
  match: '공략',
  mask: '사회생활 가면',
  honest: '본심',
};

/** 배터리 변화량. 소모(음수)에만 상성 배율을 곱한다. */
export function batteryDelta(kind: ChoiceKind, mult: number): number {
  const base = BATTERY_BASE[kind];
  return base < 0 ? Math.round(base * mult) : base;
}

export const FAVOR_MAX = 100;
export const BATTERY_START = 100;
export const BATTERY_REST_BETWEEN_STAGES = 25;

// 미니게임
export const MG_FAVOR = { great: 16, normal: 12, fail: -12 };
export const MG_GREAT_BATTERY = 8;

// 결정적 한마디(잠깐만요!)
export const OBJECTION = {
  baseGain: 10,
  accuracyGain: 15, // 추리수첩 정확도(0~1) × 15 추가
  failFavor: -8,
  failBattery: -15,
};

// 보상형 광고 보상
export const AD_REWARD = { battery: 30 };

export type Grade = 'S' | 'A' | 'B' | 'F';

/** 클리어 기준: 호감 70 이상. S는 호감 90 이상 + 배터리 40 이상 */
export function gradeOf(favor: number, battery: number): Grade {
  if (favor >= 90 && battery >= 40) return 'S';
  if (favor >= 80) return 'A';
  if (favor >= 70) return 'B';
  return 'F';
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
