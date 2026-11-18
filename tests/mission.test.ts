import { describe, it, expect } from 'vitest';
import { MISSION_OFFWORK as M, missionResult, startPatience, patienceDelta } from '../src/data/missions';

type Pick = 'best' | 'yield' | 'badPush';
function simulate(picks: Pick[], mg: 'great' | 'normal' | 'fail', objOk: boolean, acc: number, mult = 1, init = 50) {
  let progress = 0, patience = startPatience(init), clock = M.startClock, k = 0;
  for (const b of M.beats) {
    if (b.minigame) {
      progress += b.minigame.progress[mg];
      if (mg === 'fail') patience += patienceDelta(b.minigame.failPatience, mult);
      clock += b.minigame.minutes;
    } else if (b.objection) {
      clock += b.objection.minutes;
      if (objOk) progress += Math.round(b.objection.progressBase + b.objection.progressAccuracy * acc);
      else patience += patienceDelta(b.objection.failPatience, mult);
    } else if (b.options) {
      const p = picks[k++] ?? 'best';
      const o = p === 'yield' ? b.options.find((x) => x.tactic === 'yield')!
        : p === 'best' ? b.options.find((x) => x.tactic === 'push' && x.patience >= 0)!
        : b.options.find((x) => x.tactic === 'push' && x.patience < 0)!;
      progress += o.progress; patience += patienceDelta(o.patience, mult); clock += o.minutes;
    }
  }
  return missionResult(progress, Math.min(100, patience), clock, M.deadline);
}

describe('미션 모드 6시 칼퇴 작전', () => {
  it('선택 비트마다 맞춰주기 1개, 밀어붙이기 2개(맞는 방식 1개)', () => {
    for (const b of M.beats.filter((x) => x.options)) {
      expect(b.options!.filter((o) => o.tactic === 'yield')).toHaveLength(1);
      const push = b.options!.filter((o) => o.tactic === 'push');
      expect(push).toHaveLength(2);
      expect(push.filter((o) => o.patience >= 0)).toHaveLength(1);
    }
  });
  it('모두 정확히 읽으면 S', () => {
    expect(simulate([], 'great', true, 1).grade).toBe('S');
  });
  it('한 번 맞춰주기는 여유가 있다', () => {
    expect(simulate(['yield'], 'normal', true, 0.5).grade).not.toBe('F');
  });
  it('계속 맞춰주기만 하면 미션 실패', () => {
    expect(simulate(['yield', 'yield', 'yield', 'yield'], 'normal', true, 1)).toEqual({ grade: 'F', fail: 'progress' });
  });
  it('상극 상대에게 잘못 밀면 인내심 폭발', () => {
    expect(simulate(['badPush', 'badPush'], 'normal', true, 1, 2.0, 20).fail).toBe('patience');
  });
  it('판정 순서', () => {
    expect(missionResult(100, 0, 1000, 1080).fail).toBe('patience');
    expect(missionResult(100, 50, 1090, 1080).fail).toBe('time');
    expect(missionResult(90, 50, 1070, 1080).fail).toBe('progress');
  });
});
