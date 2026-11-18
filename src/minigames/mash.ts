// MG_04_MASH 엔진 → MG_402 집에 가고 싶은 본능 억제 (Stop & Go)
import { MinigameDef, MgContext, MgResult, hud, vibrate } from './types';

export const MG_402: MinigameDef = {
  id: 'MG_402',
  title: '집에 가고 싶은 본능 억제',
  howTo: "연타해서 '이불 속 상상' 말풍선을 밀어내세요. 화면이 빨개지면(상대가 눈치채는 중!) 손을 떼고 미소 유지!",
  timeSec: 8,
  run(ctx: MgContext): Promise<MgResult> {
    const TIME = this.timeSec;
    const ADVANCE = ctx.hostile ? 0.22 : 0.18; // 초당 전진
    const PUSH = 0.07; // 탭당 후퇴
    const ui = hud(ctx.root, this.title);
    ui.goal.textContent = '버티기!';
    ui.play.innerHTML = `
      <div class="mash-stage">
        <div class="mash-face">😊</div>
        <div class="mash-bubble">🛏️ 집... 이불... 넷플릭스...</div>
        <div class="mash-line"></div>
      </div>`;
    ui.control.innerHTML = `<button class="mash-btn">꾹 참기! (연타)</button>`;
    const bubble = ui.play.querySelector('.mash-bubble') as HTMLElement;
    const face = ui.play.querySelector('.mash-face') as HTMLElement;
    const btn = ui.control.querySelector('.mash-btn') as HTMLButtonElement;

    return new Promise((resolve) => {
      let pos = 0.3; // 0 = 입 안, 1 = 튀어나옴
      let warnUntil = 0;
      let nextWarn = 2 + Math.random();
      let caughtDuringWarn = 0;
      const start = performance.now();
      let last = start;
      let done = false;

      const tap = (e: Event) => {
        e.preventDefault();
        const now = performance.now();
        if (now < warnUntil) {
          // 눈치채는 중에 연타하면 오히려 들킨다
          pos += 0.1;
          caughtDuringWarn++;
          vibrate(150);
        } else {
          pos -= PUSH;
          vibrate(15);
        }
        pos = Math.max(0, pos);
      };
      btn.addEventListener('pointerdown', tap);

      const finish = (result: MgResult) => {
        done = true;
        btn.removeEventListener('pointerdown', tap);
        resolve(result);
      };

      const frame = (now: number) => {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const elapsed = (now - start) / 1000;
        const left = Math.max(0, TIME - elapsed);
        const warning = now < warnUntil;
        if (!warning && elapsed >= nextWarn) {
          warnUntil = now + 1500;
          nextWarn = elapsed + 1.5 + 1.2 + Math.random() * 1.2;
          vibrate([80, 40, 80]);
        }
        // 경고 중에는 말풍선이 천천히 움직인다 (손을 떼고 있어도 안전하게)
        pos += (warning ? ADVANCE * 0.25 : ADVANCE) * dt;

        // pos 0 = 얼굴 바로 위, pos 1 = 점선(본심 폭발선)에 닿음
        const playH = ui.play.clientHeight;
        const lineY = playH * 0.82; // 점선은 위에서 18% 지점
        bubble.style.bottom = `${110 + pos * Math.max(0, lineY - 110 - bubble.offsetHeight)}px`;
        bubble.style.transform = `scale(${0.7 + pos * 0.4})`;
        bubble.style.opacity = String(0.5 + pos * 0.5);
        ctx.root.classList.toggle('mg-warning', warning);
        face.textContent = warning ? '😬' : pos > 0.7 ? '😫' : '😊';
        btn.textContent = warning ? '✋ 손 떼고 미소 유지!' : '꾹 참기! (연타)';
        ui.timer.textContent = left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 3);

        if (pos >= 1) {
          ctx.root.classList.remove('mg-warning');
          finish('fail');
        } else if (left <= 0) {
          ctx.root.classList.remove('mg-warning');
          finish(caughtDuringWarn === 0 && pos < 0.5 ? 'great' : 'normal');
        } else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },
};
