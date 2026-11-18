// MG_701 말 끊기 타이밍: 상대가 숨 쉬는 순간(초록 구간)에 탭해서 내 의견을 끼워 넣는다.
import { MinigameDef, MgContext, MgResult, hud, vibrate, speedFactor } from './types';

const LINES = ['그러니까 내 말은 말이야', '라떼는 이런 거 없었고', '그리고 또 하나 더 있는데', '아 맞다 그 얘기도 해야지', '결론부터 말하자면 서론이'];

export const MG_701: MinigameDef = {
  id: 'MG_701',
  title: '말 끊기 타이밍',
  howTo: '상대가 숨 쉬는 순간(초록 구간)에 바늘이 오면 [지금!]을 누르세요. 3번 중 2번 성공하면 내 의견을 말할 수 있어요.',
  timeSec: 15,
  run(ctx: MgContext): Promise<MgResult> {
    const ui = hud(ctx.root, this.title);
    const speed = 0.9 * speedFactor(ctx.npc) * (ctx.hostile ? 1.15 : 1);
    ui.play.innerHTML = `
      <div class="tm-stage">
        <div class="tm-bubble" id="tmLine">…</div>
        <div class="tm-bar"><div class="tm-zone" id="tmZone"></div><div class="tm-needle" id="tmNeedle"></div></div>
        <div class="tm-dots" id="tmDots"><i></i><i></i><i></i></div>
      </div>`;
    ui.control.innerHTML = `<button class="mash-btn" id="tmBtn">✋ 지금!</button>`;
    const needle = ui.play.querySelector('#tmNeedle') as HTMLElement;
    const zone = ui.play.querySelector('#tmZone') as HTMLElement;
    const line = ui.play.querySelector('#tmLine') as HTMLElement;
    const dots = [...ui.play.querySelectorAll<HTMLElement>('#tmDots i')];
    const btn = ui.control.querySelector('#tmBtn') as HTMLButtonElement;

    return new Promise((resolve) => {
      let round = 0;
      let hits = 0;
      let pos = 0;
      let dir = 1;
      let zStart = 0;
      let zW = 0;
      let lock = 0;
      let done = false;
      const start = performance.now();
      let last = start;
      ui.goal.textContent = '0 / 3';
      const newRound = () => {
        zW = Math.max(0.1, 0.2 - round * 0.04);
        zStart = 0.15 + Math.random() * (0.7 - zW);
        zone.style.left = `${zStart * 100}%`;
        zone.style.width = `${zW * 100}%`;
        line.textContent = LINES[(round + Math.floor(Math.random() * LINES.length)) % LINES.length] + '...';
      };
      newRound();
      const finish = (r: MgResult) => {
        if (done) return;
        done = true;
        btn.removeEventListener('pointerdown', tap);
        resolve(r);
      };
      const tap = (e: Event) => {
        e.preventDefault();
        if (lock > performance.now() || done) return;
        const ok = pos >= zStart && pos <= zStart + zW;
        dots[round].className = ok ? 'ok' : 'ng';
        if (ok) {
          hits++;
          vibrate(40);
          line.textContent = '(...지금이다!) 저 그 부분에 의견이 있는데요!';
          ctx.root.classList.add('mg-flash');
        } else {
          vibrate([100, 50, 100]);
          line.textContent = '내 말 아직 안 끝났어!';
          ctx.root.classList.add('mg-warning');
        }
        round++;
        ui.goal.textContent = `${hits} / 3`;
        lock = performance.now() + 700;
        setTimeout(() => {
          ctx.root.classList.remove('mg-flash', 'mg-warning');
          if (round >= 3) finish(hits === 3 ? 'great' : hits === 2 ? 'normal' : 'fail');
          else newRound();
        }, 700);
      };
      btn.addEventListener('pointerdown', tap);
      const frame = (now: number) => {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (lock < now) {
          pos += dir * speed * (1 + round * 0.25) * dt;
          if (pos > 1) {
            pos = 1;
            dir = -1;
          } else if (pos < 0) {
            pos = 0;
            dir = 1;
          }
        }
        needle.style.left = `${pos * 100}%`;
        const left = Math.max(0, this.timeSec - (now - start) / 1000);
        ui.timer.textContent = left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 3);
        if (left <= 0) return finish(hits >= 2 ? 'normal' : 'fail');
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },
};
