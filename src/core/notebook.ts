// 추리수첩: 상대의 숨겨진 성향을 플레이어가 직접 추측해 체크한다.
import { Profile, derive, GEN_LABEL, GEN_ORDER } from './profile';
import type { DimKey } from '../data/stages';

export interface DimDef {
  key: DimKey;
  label: string;
  options: { value: string; label: string }[];
}

export const DIM_DEFS: Record<DimKey, DimDef> = {
  EI: { key: 'EI', label: '에너지', options: [{ value: 'E', label: 'E 외향' }, { value: 'I', label: 'I 내향' }] },
  SN: { key: 'SN', label: '정보', options: [{ value: 'S', label: 'S 감각' }, { value: 'N', label: 'N 직관' }] },
  TF: { key: 'TF', label: '판단', options: [{ value: 'T', label: 'T 사고' }, { value: 'F', label: 'F 감정' }] },
  JP: { key: 'JP', label: '생활', options: [{ value: 'J', label: 'J 계획' }, { value: 'P', label: 'P 즉흥' }] },
  BLOOD: { key: 'BLOOD', label: '혈액형', options: ['A', 'B', 'O', 'AB'].map((b) => ({ value: b, label: `${b}형` })) },
  GEN: { key: 'GEN', label: '세대', options: GEN_ORDER.map((g) => ({ value: g, label: GEN_LABEL[g] })) },
};

export function answerOf(npc: Profile, key: DimKey): string {
  switch (key) {
    case 'EI':
      return npc.mbti[0];
    case 'SN':
      return npc.mbti[1];
    case 'TF':
      return npc.mbti[2];
    case 'JP':
      return npc.mbti[3];
    case 'BLOOD':
      return npc.blood;
    case 'GEN':
      return derive(npc).gen;
  }
}

export type Guesses = Partial<Record<DimKey, string>>;

/** 정확도 0~1. 비워 둔 칸은 오답으로 친다. */
export function accuracy(npc: Profile, dims: DimKey[], guesses: Guesses): number {
  if (dims.length === 0) return 0;
  const correct = dims.filter((d) => guesses[d] === answerOf(npc, d)).length;
  return correct / dims.length;
}
