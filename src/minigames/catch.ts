// MG_01_CATCH 엔진 → MG_101 날아오는 결재서류 받기
import { MinigameDef, MgContext, MgResult, hud, speedFactor, vibrate } from './types';

export const MG_101: MinigameDef = {
  id: 'MG_101',
  title: '날아오는 결재서류 받기',
  howTo: '좌우로 드래그해서 하얀 기안서📄를 받으세요. 빨간 시말서📕와 커피☕는 피하세요!',
  timeSec: 10,
  run(ctx: MgContext): Promise<MgResult> {
    const fast = speedFactor(ctx.npc);
    const TIME = this.timeSec + (fast > 1 ? 1 : 0); // 속도형 상대는 +1초 보너스
    const GOAL = 10;
    const badRate = ctx.hostile ? 0.4 : 0.25;
    const ui = hud(ctx.root, this.title);
    const canvas = document.createElement('canvas');
    ui.play.appendChild(canvas);
    ui.control.textContent = '← 손가락으로 좌우 드래그 →';
    const g = canvas.getContext('2d')!;

    return new Promise((resolve) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let W = 0;
      let H = 0;
      const resize = () => {
        const r = ui.play.getBoundingClientRect();
        W = r.width;
        H = r.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      let px = W / 2;
      const PY = () => H * 0.82;
      let stunUntil = 0;
      let caught = 0;
      let missesBad = 0;
      let shake = 0;
      type Item = { x: number; y: number; v: number; bad: boolean; icon: string };
      const items: Item[] = [];
      let spawnAcc = 0;
      const start = performance.now();
      let last = start;
      let done = false;

      const move = (clientX: number) => {
        const r = canvas.getBoundingClientRect();
        if (performance.now() < stunUntil) return;
        px = Math.max(24, Math.min(W - 24, clientX - r.left));
      };
      const onPointer = (e: PointerEvent) => move(e.clientX);
      canvas.addEventListener('pointerdown', onPointer);
      canvas.addEventListener('pointermove', onPointer);

      const finish = () => {
        done = true;
        canvas.removeEventListener('pointerdown', onPointer);
        canvas.removeEventListener('pointermove', onPointer);
        const left = TIME - (performance.now() - start) / 1000;
        if (caught >= GOAL) resolve(left >= 3 || missesBad === 0 ? 'great' : 'normal');
        else resolve('fail');
      };

      const frame = (now: number) => {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const elapsed = (now - start) / 1000;
        const left = Math.max(0, TIME - elapsed);
        const fever = left <= 3 ? 1.3 : 1;

        spawnAcc += dt;
        if (spawnAcc >= 0.45) {
          spawnAcc = 0;
          const bad = Math.random() < badRate;
          items.push({
            x: 20 + Math.random() * (W - 40),
            y: -20,
            v: (H * 0.45 + Math.random() * H * 0.3) * fast * fever,
            bad,
            icon: bad ? (Math.random() < 0.5 ? '📕' : '☕') : '📄',
          });
        }

        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.v * dt;
          // 히트박스는 관대하게 (80%)
          if (Math.abs(it.y - PY()) < 26 && Math.abs(it.x - px) < 38) {
            items.splice(i, 1);
            if (it.bad) {
              missesBad++;
              stunUntil = now + 800;
              shake = 0.3;
              vibrate(150);
            } else {
              caught++;
              vibrate(20);
            }
            continue;
          }
          if (it.y > H + 30) items.splice(i, 1);
        }

        // draw
        g.save();
        if (shake > 0) {
          shake -= dt;
          g.translate((Math.random() - 0.5) * 12, 0);
        }
        g.clearRect(-20, 0, W + 40, H);
        g.font = '30px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        items.forEach((it) => g.fillText(it.icon, it.x, it.y));
        const stunned = now < stunUntil;
        g.font = '44px sans-serif';
        g.fillText(stunned ? '😵' : '🙆', px, PY());
        g.fillStyle = 'rgba(255,255,255,.6)';
        g.fillRect(px - 36, PY() + 26, 72, 6);
        g.restore();

        ui.timer.textContent = left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 3);
        ui.goal.textContent = `📄 ${caught} / ${GOAL}`;

        if (caught >= GOAL || left <= 0) finish();
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  },
};
