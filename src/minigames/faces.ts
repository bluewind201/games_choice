// MG_703 표정 읽기: 말과 표정이 다를 때 "진짜 기분"을 빠르게 고른다. 대화 장면의 도트 초상화를 그대로 쓴다.
import { MinigameDef, MgContext, MgResult, hud, vibrate } from './types';
import { Portrait } from '../ui/portrait';
import { DEFAULT_LOOK, Look } from '../world/character';
import type { Emotion } from '../data/stages';

const PEOPLE: Look[] = [
  { ...DEFAULT_LOOK, hair: '#7a3e1d', shirt: '#ff6b81', hairStyle: 'pony' },
  { ...DEFAULT_LOOK, skin: '#e8b98c', hair: '#555', shirt: '#2d3047', glasses: 'round', hairStyle: 'part', tie: true },
  { ...DEFAULT_LOOK, skin: '#f6d2b0', hair: '#c47f3d', shirt: '#ffd166', hairStyle: 'long' },
  { ...DEFAULT_LOOK, skin: '#d9a77c', hair: '#222', shirt: '#2e8b57', hat: 'cap', hatColor: '#2e8b57' },
  { ...DEFAULT_LOOK, hair: '#e2445c', shirt: '#fff', hat: 'beanie', hatColor: '#ffd166' },
];

const ROUNDS: { say: string; emo: Emotion }[] = [
  { say: '괜찮아요, 진짜 괜찮아요.', emo: 'CRY' },
  { say: '아~ 그거 재밌겠네요.', emo: 'SUSPECT' },
  { say: '아니 전혀 안 바빠요!', emo: 'PANIC' },
  { say: '네, 좋은 의견이네요.', emo: 'ANGRY' },
  { say: '별로 기대 안 했어요.', emo: 'HAPPY' },
  { say: '저 원래 이런 거 안 좋아해요.', emo: 'HAPPY' },
  { say: '하하, 농담도 잘하시네요.', emo: 'ANGRY' },
];

const LABEL: Record<Emotion, string> = { HAPPY: '😄 사실 신남', NORMAL: '🙂 평소대로', PANIC: '😳 사실 당황', ANGRY: '😠 사실 화남', SUSPECT: '🤨 사실 의심', CRY: '😢 사실 서운' };
const OPTIONS: Emotion[] = ['HAPPY', 'PANIC', 'ANGRY', 'SUSPECT', 'CRY'];

export const MG_703: MinigameDef = {
  id: 'MG_703',
  title: '표정 읽기',
  howTo: '말은 믿지 마세요! 얼굴을 보고 상대의 진짜 기분을 골라요. 5명, 한 명당 3초!',
  timeSec: 3,
  run(ctx: MgContext): Promise<MgResult> {
    const ui = hud(ctx.root, this.title);
    ui.play.innerHTML = `<div class="fc-stage"><div class="fc-portrait" id="fcP"></div><div class="fc-say" id="fcSay"></div></div>`;
    const pw = ui.play.querySelector('#fcP') as HTMLElement;
    const sayEl = ui.play.querySelector('#fcSay') as HTMLElement;
    const portrait = new Portrait(PEOPLE[0]);
    pw.appendChild(portrait.el);
    const rounds = [...ROUNDS].sort(() => Math.random() - 0.5).slice(0, 5);
    const per = ctx.hostile ? 2.5 : 3;

    return new Promise((resolve) => {
      let i = 0;
      let score = 0;
      let deadline = 0;
      let locked = false;
      let done = false;
      const finish = (r: MgResult) => {
        if (done) return;
        done = true;
        portrait.destroy();
        resolve(r);
      };
      const answer = (pick: Emotion | null) => {
        if (locked || done) return;
        locked = true;
        const ok = pick === rounds[i].emo;
        if (ok) score++;
        vibrate(ok ? 30 : [80, 40, 80]);
        ctx.root.classList.add(ok ? 'mg-flash' : 'mg-warning');
        sayEl.innerHTML = ok ? '<b class="ok">정답! 눈치 만렙</b>' : `<b class="ng">땡! 진짜 기분: ${LABEL[rounds[i].emo]}</b>`;
        i++;
        ui.goal.textContent = `${score} / ${i}`;
        setTimeout(() => {
          ctx.root.classList.remove('mg-flash', 'mg-warning');
          if (i >= rounds.length) finish(score >= 5 ? 'great' : score >= 3 ? 'normal' : 'fail');
          else show();
        }, 800);
      };
      const show = () => {
        locked = false;
        const r = rounds[i];
        portrait.setLook(PEOPLE[i % PEOPLE.length]);
        portrait.setEmotion(r.emo);
        sayEl.textContent = `"${r.say}"`;
        const opts = [...OPTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
        if (!opts.includes(r.emo)) opts[Math.floor(Math.random() * 3)] = r.emo;
        ui.control.innerHTML = `<div class="fc-grid">${opts.map((o) => `<button class="mem-btn" data-e="${o}">${LABEL[o]}</button>`).join('')}</div>`;
        ui.control.querySelectorAll<HTMLButtonElement>('button').forEach((b) => (b.onclick = () => answer(b.dataset.e as Emotion)));
        deadline = performance.now() + per * 1000;
      };
      ui.goal.textContent = '0 / 0';
      show();
      const tick = () => {
        if (done) return;
        const left = Math.max(0, (deadline - performance.now()) / 1000);
        ui.timer.textContent = locked ? '-' : left.toFixed(1);
        ui.timer.classList.toggle('danger', left <= 1);
        if (!locked && left <= 0) answer(null);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
};
