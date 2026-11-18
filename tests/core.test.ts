import { describe, it, expect } from 'vitest';
import { zodiacKrIndex, signIndex, generationOf, ZODIAC_KR, SIGNS } from '../src/core/profile';
import { computeCompat, mbtiCompat, zodiacKrCompat, elementCompat, genCompat, bloodCompat } from '../src/core/compat';
import { batteryDelta, gradeOf } from '../src/core/rules';
import { scoreQuiz } from '../src/data/onboarding';
import { accuracy } from '../src/core/notebook';
import { STAGES, DIMS_BY_LEVEL } from '../src/data/stages';

describe('profile 자동 산출', () => {
  it('띠: 시트 NPC 프로필과 일치', () => {
    expect(ZODIAC_KR[zodiacKrIndex(1993)]).toBe('닭');
    expect(ZODIAC_KR[zodiacKrIndex(1996)]).toBe('쥐');
    expect(ZODIAC_KR[zodiacKrIndex(1975)]).toBe('토끼');
    expect(ZODIAC_KR[zodiacKrIndex(2021)]).toBe('소');
    expect(ZODIAC_KR[zodiacKrIndex(1988)]).toBe('용');
  });
  it('별자리 경계일', () => {
    expect(SIGNS[signIndex(3, 21)]).toBe('양자리');
    expect(SIGNS[signIndex(3, 20)]).toBe('물고기자리');
    expect(SIGNS[signIndex(1, 5)]).toBe('염소자리');
    expect(SIGNS[signIndex(12, 25)]).toBe('염소자리');
    expect(SIGNS[signIndex(12, 24)]).toBe('사수자리');
    expect(SIGNS[signIndex(9, 10)]).toBe('처녀자리');
  });
  it('세대', () => {
    expect(generationOf(1975)).toBe('X');
    expect(generationOf(1995)).toBe('Z');
    expect(generationOf(2012)).toBe('ALPHA');
  });
});

describe('상성 엔진', () => {
  it('시트 값이 우선 (INFP→ESTJ 대환장 상극)', () => {
    expect(mbtiCompat('INFP', 'ESTJ')).toEqual([-15, 1.5, '대환장 상극']);
    expect(mbtiCompat('ESTJ', 'INFP')[0]).toBe(-15);
  });
  it('MBTI 규칙 기본값', () => {
    expect(mbtiCompat('ESFP', 'ISTJ')[0]).toBe(-12); // 시트 ISTJ>ESFP 역방향
    expect(mbtiCompat('ENTP', 'INFJ')[0]).toBe(15);
    expect(mbtiCompat('ESTJ', 'ENTJ')[0]).toBe(8);
  });
  it('12지신: 삼합·육합·상충·원진', () => {
    expect(zodiacKrCompat(4, 8)[2]).toBe('삼합'); // 용-원숭이
    expect(zodiacKrCompat(0, 1)[2]).toBe('육합'); // 쥐-소
    expect(zodiacKrCompat(3, 9)[2]).toBe('상충살'); // 토끼-닭 (시트 BZ_12)
    expect(zodiacKrCompat(2, 9)[2]).toBe('원진살'); // 호랑이-닭 (시트 BZ_15)
  });
  it('별자리는 4원소 규칙', () => {
    expect(elementCompat('FIRE', 'AIR')[0]).toBe(10);
    expect(elementCompat('FIRE', 'WATER')[0]).toBe(-10);
    expect(elementCompat('EARTH', 'AIR')[0]).toBe(-8);
    expect(elementCompat('FIRE', 'EARTH')[0]).toBe(0);
  });
  it('세대·혈액형 시트 값', () => {
    expect(genCompat('Z', 'X')[0]).toBe(-12);
    expect(genCompat('X', 'Z')[0]).toBe(-12);
    expect(bloodCompat('A', 'B')).toEqual([-8, 1.2, '직설 충돌']);
  });
  it('초기 호감은 20~80, 배터리 배율은 덧셈 합산 후 0.6~2.0', () => {
    const worst = computeCompat(
      { mbti: 'INFP', blood: 'B', birthYear: 1999, birthMonth: 3, birthDay: 1 },
      { mbti: 'ESTJ', blood: 'A', birthYear: 1975, birthMonth: 4, birthDay: 1 },
      5,
    );
    expect(worst.initFavor).toBeGreaterThanOrEqual(20);
    expect(worst.batteryMult).toBeLessThanOrEqual(2.0);
    const lv1 = computeCompat(
      { mbti: 'INFP', blood: 'B', birthYear: 1999, birthMonth: 3, birthDay: 1 },
      { mbti: 'ESTJ', blood: 'A', birthYear: 1975, birthMonth: 4, birthDay: 1 },
      1,
    );
    expect(lv1.layers).toHaveLength(1);
    expect(lv1.initFavor).toBe(35);
    expect(lv1.batteryMult).toBe(1.5);
  });
});

describe('규칙', () => {
  it('배터리: 소모만 배율 적용', () => {
    expect(batteryDelta('mask', 1.5)).toBe(-18);
    expect(batteryDelta('match', 1)).toBe(-6);
    expect(batteryDelta('honest', 2)).toBe(4);
  });
  it('등급', () => {
    expect(gradeOf(95, 50)).toBe('S');
    expect(gradeOf(95, 10)).toBe('A');
    expect(gradeOf(72, 10)).toBe('B');
    expect(gradeOf(60, 90)).toBe('F');
  });
  it('퀴즈 채점', () => {
    expect(scoreQuiz(Array(12).fill('a'))).toBe('ESFJ');
    expect(scoreQuiz(Array(12).fill('b'))).toBe('INTP');
  });
});

describe('스테이지 데이터 무결성', () => {
  for (const s of STAGES) {
    it(`${s.id}: 턴마다 공략/가면/본심 1개씩, 정답 증거 존재`, () => {
      for (const t of s.turns) {
        expect(t.choices.map((c) => c.kind).sort()).toEqual(['honest', 'mask', 'match']);
        const match = t.choices.find((c) => c.kind === 'match')!;
        const mask = t.choices.find((c) => c.kind === 'mask')!;
        expect(match.favor).toBeGreaterThan(mask.favor);
        expect(t.observations.length).toBeGreaterThan(0);
      }
      expect(s.objection.evidence.some((e) => e.id === s.objection.correctId)).toBe(true);
    });
  }
  it('추리 정확도', () => {
    const s = STAGES[0];
    expect(accuracy(s.npc, DIMS_BY_LEVEL[0], { EI: 'E', SN: 'S', TF: 'F', JP: 'J' })).toBe(1);
    expect(accuracy(s.npc, DIMS_BY_LEVEL[0], { EI: 'E' })).toBe(0.25);
  });
});
