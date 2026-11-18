import type { Profile } from '../core/profile';

export type MgResult = 'great' | 'normal' | 'fail';

export interface MgContext {
  root: HTMLElement; // 미니게임이 그려질 전체 화면 컨테이너
  npc: Profile;
  /** 상극 관계(원진살·상충살 등) 여부: 방해물 비율 증가 */
  hostile: boolean;
}

export interface MinigameDef {
  id: string;
  title: string;
  howTo: string;
  timeSec: number;
  run(ctx: MgContext): Promise<MgResult>;
}

/** 상대 성향에 따른 동적 난이도 (02 문서 5.2) */
export function speedFactor(npc: Profile): number {
  const fast = ['ESTJ', 'ENTJ', 'ESTP'].includes(npc.mbti) || npc.blood === 'B' || npc.blood === 'O';
  return fast ? 1.2 : 1.0;
}

export function vibrate(ms: number | number[]): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* 진동 미지원 */
  }
}

export function hud(root: HTMLElement, title: string): { timer: HTMLElement; goal: HTMLElement; play: HTMLElement; control: HTMLElement } {
  root.innerHTML = `
    <div class="mg-hud"><div class="mg-timer">10.0</div><div class="mg-title"></div><div class="mg-goal"></div></div>
    <div class="mg-play"></div>
    <div class="mg-control"></div>`;
  (root.querySelector('.mg-title') as HTMLElement).textContent = title;
  return {
    timer: root.querySelector('.mg-timer') as HTMLElement,
    goal: root.querySelector('.mg-goal') as HTMLElement,
    play: root.querySelector('.mg-play') as HTMLElement,
    control: root.querySelector('.mg-control') as HTMLElement,
  };
}
