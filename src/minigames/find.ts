// MG_06_FIND 엔진 → MG_602 진짜 이유 찾기 (소개팅 버전)
import { MinigameDef, MgContext, MgResult, hud, vibrate } from './types';

interface Spot {
  id: string;
  icon: string;
  label: string;
  correct: boolean;
}

const SPOTS: Spot[] = [
  { id: 'phone', icon: '📱', label: '휴대폰 화면: "방탈출 9시 타임 마감 임박!"', correct: true },
  { id: 'menu', icon: '📖', label: '파스타 메뉴판', correct: false },
  { id: 'watch', icon: '⌚', label: '손목시계 (8시 10분)', correct: false },
  { id: 'bubble', icon: '💬', label: '"괜찮아요"', correct: false },
];

export const MG_602: MinigameDef = {
  id: 'MG_602',
  title: '갑자기 조용해진 진짜 이유 찾기',
  howTo: '상대가 "괜찮아요"라고 한 진짜 이유를 찾아 터치한 뒤 [제시!]를 누르세요. 말풍선을 믿으면 안 돼요!',
  timeSec: 10,
  run(ctx: MgContext): Promise<MgResult> {
    const TIME = this.timeSec;
    const ui = hud(ctx.root, this.title);
    ui.goal.textContent = '단서 1개';
    const shuffled = [...SPOTS].sort(() => Math.random() - 0.5);
    ui.play.innerHTML = `<div class="find-grid">${shuffled
      .map((s) => `<button class="find-spot" data-id="${s.id}"><span class="find-icon">${s.icon}</span><span class="find-label">${s.label}</span></button>`)
      .join('')}</div>`;
    ui.control.innerHTML = `<button class="find-present" disabled>제시!</button>`;
    const present = ui.control.querySelector('.find-present') as HTMLButtonElement;
    let selected: string | null = null;

    return new Promise((resolve) => {
      const start = performance.now();
      let done = false;
      ui.play.querySelectorAll<HTMLButtonElement>('.find-spot').forEach((b) =>
        b.addEventListener('click', () => {
          selected = b.dataset.id ?? null;
          ui.play.querySelectorAll('.find-spot').forEach((x) => x.classList.toggle('selected', x === b));
          present.disabled = false;
          vibrate(15);
        }),
      );
      const finish = (r: MgResult) => {
        if (done) return;
        done = true;
        resolve(r);
      };
      present.addEventListener('click', () => {
        const spot = SPOTS.find((s) => s.id === selected);
        const elapsed = (performance.now() - start) / 1000;
        if (spot?.correct) {
          vibrate(250);
          finish(elapsed <= 5 ? 'great' : 'normal');
        } else {
          vibrate(150);
          finish('fail');
        }
      });
      const tick = () => {
        if (done) return;
        const left = Math.max(0, TIME - (performance.now() - start) / 1000);
        ui.timer.textContent = left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 3);
        if (left <= 0) finish('fail');
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
};
