// MG_702 주문 기억하기: 손님 주문을 잠깐 보여 준 뒤 같은 순서로 누른다 (카페 알바).
import { MinigameDef, MgContext, MgResult, hud, vibrate } from './types';

const MENU = [
  { icon: '☕', name: '아메리카노' },
  { icon: '🧋', name: '버블티' },
  { icon: '🥐', name: '크루아상' },
  { icon: '🍰', name: '케이크' },
  { icon: '🍵', name: '녹차' },
  { icon: '🧃', name: '주스' },
];

export const MG_702: MinigameDef = {
  id: 'MG_702',
  title: '주문 기억하기',
  howTo: '손님이 주문을 빠르게 말해요. 주문이 사라지면 같은 순서로 메뉴를 누르세요. 손님 3명!',
  timeSec: 30,
  run(ctx: MgContext): Promise<MgResult> {
    const ui = hud(ctx.root, this.title);
    ui.play.innerHTML = `
      <div class="mem-stage">
        <div class="mem-customer" id="memCus">🙂</div>
        <div class="mem-order" id="memOrder"></div>
        <div class="mem-input" id="memInput"></div>
      </div>`;
    ui.control.innerHTML = `<div class="mem-grid">${MENU.map((m, i) => `<button class="mem-btn" data-i="${i}" disabled><span>${m.icon}</span>${m.name}</button>`).join('')}</div>`;
    const order = ui.play.querySelector('#memOrder') as HTMLElement;
    const input = ui.play.querySelector('#memInput') as HTMLElement;
    const cus = ui.play.querySelector('#memCus') as HTMLElement;
    const btns = [...ui.control.querySelectorAll<HTMLButtonElement>('.mem-btn')];
    const faces = ['🙂', '🧐', '😤'];

    return new Promise((resolve) => {
      let customer = 0;
      let perfect = 0;
      let seq: number[] = [];
      let typed: number[] = [];
      let done = false;
      const start = performance.now();
      const setBtns = (on: boolean) => btns.forEach((b) => (b.disabled = !on));
      const finish = (r: MgResult) => {
        if (done) return;
        done = true;
        setBtns(false);
        resolve(r);
      };
      const next = () => {
        if (customer >= 3) return finish(perfect === 3 ? 'great' : perfect >= 2 ? 'normal' : 'fail');
        const len = 3 + customer + (ctx.hostile ? 1 : 0);
        seq = Array.from({ length: len }, () => Math.floor(Math.random() * MENU.length));
        typed = [];
        cus.textContent = faces[customer];
        ui.goal.textContent = `손님 ${customer + 1}/3`;
        input.innerHTML = '';
        setBtns(false);
        order.innerHTML = '';
        order.classList.remove('hide');
        seq.forEach((k, i) =>
          setTimeout(() => {
            if (done) return;
            order.insertAdjacentHTML('beforeend', `<span class="mem-chip">${MENU[k].icon}</span>`);
          }, i * 420),
        );
        setTimeout(() => {
          if (done) return;
          order.classList.add('hide');
          order.innerHTML = '<span class="mem-hint">주문을 순서대로 눌러 주세요!</span>';
          setBtns(true);
        }, seq.length * 420 + 1100);
      };
      btns.forEach((b) =>
        b.addEventListener('click', () => {
          if (done) return;
          const k = +b.dataset.i!;
          const pos = typed.length;
          typed.push(k);
          const ok = seq[pos] === k;
          input.insertAdjacentHTML('beforeend', `<span class="mem-chip ${ok ? 'ok' : 'ng'}">${MENU[k].icon}</span>`);
          vibrate(ok ? 15 : [80, 40, 80]);
          if (!ok) {
            setBtns(false);
            cus.textContent = '😠';
            order.innerHTML = `<span class="mem-hint">정답: ${seq.map((x) => MENU[x].icon).join(' ')}</span>`;
            customer++;
            setTimeout(next, 1300);
          } else if (typed.length === seq.length) {
            setBtns(false);
            perfect++;
            cus.textContent = '😍';
            customer++;
            setTimeout(next, 700);
          }
        }),
      );
      const tick = () => {
        if (done) return;
        const left = Math.max(0, this.timeSec - (performance.now() - start) / 1000);
        ui.timer.textContent = left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 5);
        if (left <= 0) return finish(perfect >= 2 ? 'normal' : 'fail');
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      next();
    });
  },
};
