import './styles.css';
import { Profile, Blood, derive, describe, ZODIAC_KR, SIGNS, ELEMENT_LABEL, GEN_LABEL } from './core/profile';
import { computeCompat, CompatResult } from './core/compat';
import {
  batteryDelta, clamp, gradeOf, Grade, KIND_LABEL, FAVOR_MAX, BATTERY_START, BATTERY_REST_BETWEEN_STAGES,
  MG_FAVOR, MG_GREAT_BATTERY, OBJECTION, AD_REWARD,
} from './core/rules';
import { loadSave, writeSave, clearSave, SaveData } from './core/save';
import { ads, AD_LABEL, AdReason } from './core/ads';
import { DIM_DEFS, answerOf, accuracy, Guesses } from './core/notebook';
import { QUIZ, scoreQuiz, PERSONAS } from './data/onboarding';
import { STAGES, Stage, DIMS_BY_LEVEL, Choice, Emotion, MinigameId, DimKey } from './data/stages';
import { MG_101 } from './minigames/catch';
import { MG_402 } from './minigames/mash';
import { MG_602 } from './minigames/find';
import type { MinigameDef, MgResult } from './minigames/types';
import { shareCard } from './ui/share';
import { MISSIONS, MissionStage, MissionOption, clockText, missionResult, startPatience, patienceDelta } from './data/missions';

const MINIGAMES: Record<MinigameId, MinigameDef> = { MG_101, MG_402, MG_602 };
const EMOTION_ICON: Record<Emotion, string> = { HAPPY: '😄', NORMAL: '🙂', PANIC: '😳', ANGRY: '😠', SUSPECT: '🤨', CRY: '😢' };

const app = document.getElementById('app') as HTMLElement;
let save: SaveData = loadSave();

// ---------- 유틸 ----------
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = app) => root.querySelector(sel) as T;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function render(html: string) {
  app.innerHTML = html;
  app.scrollTop = 0;
}

function persist() {
  writeSave(save);
}

function activeProfile(): Profile | undefined {
  if (!save.personaId || save.personaId === 'REAL') return save.realProfile;
  return PERSONAS.find((p) => p.id === save.personaId)?.profile ?? save.realProfile;
}

function activeName(): string {
  if (!save.personaId || save.personaId === 'REAL') return '진짜 나';
  return PERSONAS.find((p) => p.id === save.personaId)?.name ?? '진짜 나';
}

function toast(text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${tone}`;
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 1400);
  setTimeout(() => t.remove(), 1900);
}

function modal(html: string): HTMLElement {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(m);
  return m;
}

function typeText(el: HTMLElement, text: string): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    let done = false;
    el.textContent = '';
    const finish = () => {
      if (done) return;
      done = true;
      el.textContent = text;
      el.removeEventListener('click', finish);
      resolve();
    };
    el.addEventListener('click', finish);
    const step = () => {
      if (done) return;
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) finish();
      else setTimeout(step, 22);
    };
    step();
  });
}

async function offerAd(reason: AdReason): Promise<boolean> {
  if (!ads.isAvailable()) {
    toast('오프라인이라 광고를 볼 수 없어요', 'info');
    return false;
  }
  return ads.show(reason);
}

// ---------- 타이틀 ----------
function screenTitle() {
  const has = !!save.realProfile;
  render(`
    <div class="screen title-screen">
      <div class="logo">선택의<br/>연속</div>
      <p class="sub">상대의 성향을 추리하고, 말 한마디로 판을 뒤집어라</p>
      <div class="stack">
        ${has ? `<button class="btn primary" id="continue">이어하기</button>` : ''}
        <button class="btn ${has ? '' : 'primary'}" id="new">${has ? '처음부터 다시' : '시작하기'}</button>
      </div>
      <p class="fine">이 게임의 성향 궁합은 재미로 즐기는 밈이에요. 실제 사람을 판단하는 기준이 아니에요.<br/>입력한 정보는 이 기기에만 저장돼요.</p>
    </div>`);
  $('#new').onclick = () => {
    if (has) {
      clearSave();
      save = loadSave();
    }
    screenBirth();
  };
  if (has) $('#continue').onclick = () => screenMap();
}

// ---------- 온보딩: 생년월일·혈액형 ----------
function screenBirth() {
  const years = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => 2015 - i);
  render(`
    <div class="screen">
      <h2>당신의 사회생활 캐릭터 만들기</h2>
      <p class="sub">생년월일과 혈액형만 넣으면 띠·별자리·세대가 자동으로 나와요.</p>
      <label class="field">태어난 해
        <select id="y">${years.map((y) => `<option ${y === 1995 ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      <div class="row">
        <label class="field">월 <select id="m">${Array.from({ length: 12 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></label>
        <label class="field">일 <select id="d">${Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select></label>
      </div>
      <div class="field">혈액형
        <div class="seg" id="blood">${['A', 'B', 'O', 'AB'].map((b) => `<button data-v="${b}" class="${b === 'A' ? 'on' : ''}">${b}형</button>`).join('')}</div>
      </div>
      <div class="derived" id="derived"></div>
      <button class="btn primary" id="next">성향 진단 시작 (12문항)</button>
    </div>`);
  let blood: Blood = 'A';
  const update = () => {
    const p: Profile = { mbti: 'XXXX', blood, birthYear: +$<HTMLSelectElement>('#y').value, birthMonth: +$<HTMLSelectElement>('#m').value, birthDay: +$<HTMLSelectElement>('#d').value };
    const d = derive(p);
    $('#derived').innerHTML = `<span>${ZODIAC_KR[d.zodiacKr]}띠</span><span>${SIGNS[d.sign]} (${ELEMENT_LABEL[d.element]})</span><span>${GEN_LABEL[d.gen]}</span>`;
  };
  ['#y', '#m', '#d'].forEach((s) => ($(s).onchange = update));
  app.querySelectorAll<HTMLButtonElement>('#blood button').forEach((b) =>
    (b.onclick = () => {
      blood = b.dataset.v as Blood;
      app.querySelectorAll('#blood button').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  update();
  $('#next').onclick = () => {
    const base = { blood, birthYear: +$<HTMLSelectElement>('#y').value, birthMonth: +$<HTMLSelectElement>('#m').value, birthDay: +$<HTMLSelectElement>('#d').value };
    screenQuiz(0, [], base);
  };
}

function screenQuiz(i: number, answers: ('a' | 'b')[], base: Omit<Profile, 'mbti'>) {
  if (i >= QUIZ.length) {
    save.realProfile = { ...base, mbti: scoreQuiz(answers) };
    save.personaId = 'REAL';
    persist();
    screenMyCard();
    return;
  }
  const q = QUIZ[i];
  render(`
    <div class="screen quiz">
      <div class="progress"><div style="width:${(i / QUIZ.length) * 100}%"></div></div>
      <div class="quiz-tag">${i + 1} / ${QUIZ.length} · ${esc(q.title)}</div>
      <h2 class="quiz-q">${esc(q.q)}</h2>
      <button class="btn choice" id="a">${esc(q.a.text)}</button>
      <button class="btn choice" id="b">${esc(q.b.text)}</button>
    </div>`);
  $('#a').onclick = () => screenQuiz(i + 1, [...answers, 'a'], base);
  $('#b').onclick = () => screenQuiz(i + 1, [...answers, 'b'], base);
}

function profileCard(p: Profile, title: string, sub = '') {
  const d = derive(p);
  return `<div class="pcard">
    <div class="pcard-title">${esc(title)}</div>
    ${sub ? `<div class="pcard-sub">${esc(sub)}</div>` : ''}
    <div class="pcard-mbti">${p.mbti}</div>
    <div class="pcard-tags"><span>${p.blood}형</span><span>${String(p.birthYear).slice(2)}년생 ${GEN_LABEL[d.gen]}</span><span>${ZODIAC_KR[d.zodiacKr]}띠</span><span>${SIGNS[d.sign]} · ${ELEMENT_LABEL[d.element]}</span></div>
  </div>`;
}

function screenMyCard() {
  const p = save.realProfile!;
  render(`
    <div class="screen">
      <h2>당신의 사회생활 캐릭터 카드</h2>
      ${profileCard(p, '진짜 나')}
      <p class="sub">이 성향으로 플레이할 수도 있고, 상대와 궁합이 불리하다면 다른 페르소나를 골라 쓸 수도 있어요. 언제든 바꿀 수 있어요.</p>
      <button class="btn primary" id="go">이 성향으로 시작</button>
      <button class="btn" id="persona">페르소나 고르기</button>
    </div>`);
  $('#go').onclick = () => {
    save.personaId = 'REAL';
    persist();
    screenMap();
  };
  $('#persona').onclick = () => screenPersona();
}

function screenPersona() {
  const options = [
    { id: 'REAL', name: '진짜 나', tagline: '온보딩에서 진단한 내 성향', profile: save.realProfile! },
    ...PERSONAS,
  ];
  render(`
    <div class="screen">
      <h2>페르소나 고르기</h2>
      <p class="sub">사회생활은 가면도 실력! 오늘 쓸 캐릭터를 골라요.</p>
      <div class="persona-list">${options
        .map((o) => `<button class="persona ${save.personaId === o.id ? 'on' : ''}" data-id="${o.id}">${profileCard(o.profile, o.name, o.tagline)}</button>`)
        .join('')}</div>
      <button class="btn" id="back">돌아가기</button>
    </div>`);
  app.querySelectorAll<HTMLButtonElement>('.persona').forEach((b) =>
    (b.onclick = () => {
      save.personaId = b.dataset.id;
      persist();
      toast(`${options.find((o) => o.id === b.dataset.id)!.name} 장착!`, 'good');
      screenMap();
    }),
  );
  $('#back').onclick = () => screenMap();
}

// ---------- 스테이지 지도 ----------
function isUnlocked(i: number) {
  if (i === 0) return true;
  const prev = save.best[STAGES[i - 1].id];
  return !!prev && prev !== 'F';
}

function screenMap() {
  const p = activeProfile();
  if (!p) return screenBirth();
  render(`
    <div class="screen map">
      <div class="map-head">
        <div><div class="muted">플레이 캐릭터</div><b>${esc(activeName())}</b> <span class="muted">${esc(describe(p))}</span></div>
        <button class="btn small" id="persona">변경</button>
      </div>
      <div class="battery-line">🔋 사회적 배터리 <b>${save.battery}</b> / 100
        <button class="btn small" id="rest">하루 새로 시작</button></div>
      <div class="stage-list">${MISSIONS.map((m, i) => {
        const best = save.best[m.id];
        const layers = ['MBTI', '+혈액형', '+세대'].slice(0, m.level).join(' ');
        return `<button class="mission-card" data-m="${i}">
          <div class="mission-row"><div class="stage-icon">${m.npcIcon}</div>
          <div class="stage-info"><div class="muted">${esc(m.chapter)}</div><b>${esc(m.title)}</b>
          <div class="mission-text">🎯 ${esc(m.mission)}</div>
          <div class="muted">${esc(m.npcRole)} · 추리: ${layers}</div></div>
          <div class="stage-grade g-${best ?? 'none'}">${best ?? ''}</div></div></button>`;
      }).join('')}</div>
      <details class="legacy"><summary>이전 버전 (호감 올리기) 보기</summary>
      <div class="stage-list">${STAGES.map((s, i) => {
        const best = save.best[s.id];
        const open = isUnlocked(i);
        const layers = ['MBTI', '+혈액형', '+세대'].slice(0, s.level).join(' ');
        return `<button class="stage-card ${open ? '' : 'locked'}" data-i="${i}" ${open ? '' : 'disabled'}>
          <div class="stage-icon">${open ? s.npcIcon : '🔒'}</div>
          <div class="stage-info"><div class="muted">${esc(s.chapter)}</div><b>${esc(s.title)}</b>
          <div class="muted">${esc(s.npcRole)} · 추리: ${layers}</div></div>
          <div class="stage-grade g-${best ?? 'none'}">${best ?? ''}</div></button>`;
      }).join('')}</div></details>
      <p class="fine">프로토타입: 미션 3개. 배터리는 스테이지 사이에 이어지고, 끝날 때마다 ${BATTERY_REST_BETWEEN_STAGES}씩 회복돼요.</p>
    </div>`);
  $('#persona').onclick = () => screenPersona();
  $('#rest').onclick = () => {
    save.battery = BATTERY_START;
    persist();
    toast('푹 자고 일어났다! 배터리 100', 'good');
    screenMap();
  };
  app.querySelectorAll<HTMLButtonElement>('.stage-card').forEach((b) => (b.onclick = () => startStage(STAGES[+b.dataset.i!])));
  app.querySelectorAll<HTMLButtonElement>('.mission-card').forEach((b) => (b.onclick = () => startMission(MISSIONS[+b.dataset.m!])));
}

// ---------- 스테이지 진행 ----------
interface Run {
  stage: Stage;
  player: Profile;
  compat: CompatResult;
  favor: number;
  battery: number;
  guesses: Guesses;
  hinted: DimKey[];
  observations: string[];
  matchCount: number;
  mgResults: MgResult[];
  objectionOk?: boolean;
}

let run: Run;

const LAYER_NAME: Record<string, string> = { MBTI: '성격유형', BLOOD: '혈액형', GEN: '세대', ZODIAC_KR: '띠', WEST: '별자리' };

function startStage(stage: Stage) {
  ms = null;
  const player = activeProfile()!;
  const compat = computeCompat(player, stage.npc, stage.level);
  if (save.battery <= 15) {
    const m = modal(`<h3>배터리가 거의 없어요 🪫</h3><p>배터리 ${save.battery}로는 버티기 힘들어요.</p>
      <div class="stack">${ads.isAvailable() ? `<button class="btn primary" id="ad">📺 ${AD_LABEL.battery_refill}</button>` : ''}
      <button class="btn" id="rest">하루 새로 시작 (배터리 100)</button><button class="btn" id="go">그냥 도전</button></div>`);
    $('#rest', m).onclick = () => {
      save.battery = BATTERY_START;
      persist();
      m.remove();
      startStage(stage);
    };
    $('#go', m).onclick = () => {
      m.remove();
      beginRun(stage, player, compat);
    };
    const adBtn = m.querySelector('#ad') as HTMLButtonElement | null;
    if (adBtn)
      adBtn.onclick = async () => {
        m.remove();
        if (await offerAd('battery_refill')) save.battery = clamp(save.battery + AD_REWARD.battery, 0, 100);
        persist();
        startStage(stage);
      };
    return;
  }
  beginRun(stage, player, compat);
}

function beginRun(stage: Stage, player: Profile, compat: CompatResult) {
  run = {
    stage, player, compat,
    favor: compat.initFavor,
    battery: save.battery,
    guesses: {}, hinted: [], observations: [], matchCount: 0, mgResults: [],
  };
  // 첫인상 궁합: 내 성향 쪽은 공개, 상대 성향은 숨김
  const rows = compat.layers
    .map((l) => `<tr><td>${LAYER_NAME[l.layer]}</td><td>${esc(l.label)}</td><td class="${l.favor >= 0 ? 'pos' : 'neg'}">${l.favor >= 0 ? '+' : ''}${l.favor}</td></tr>`)
    .join('');
  render(`
    <div class="screen intro" style="background:${stage.bg}">
      <div class="muted">${esc(stage.chapter)}</div>
      <h2>${esc(stage.title)}</h2>
      <div class="npc-big">${stage.npcIcon}</div>
      <div class="npc-name">${esc(stage.npcName)} <span class="muted">${esc(stage.npcRole)}</span></div>
      <p class="intro-text">${esc(stage.intro)}</p>
      <div class="compat-box">
        <div class="compat-title">첫인상 궁합 (상대 성향은 비밀!)</div>
        <table>${rows}</table>
        <div class="compat-sum">시작 호감 <b>${compat.initFavor}</b> · 배터리 소모 배율 <b>×${compat.batteryMult}</b></div>
      </div>
      <p class="fine">목표: 대화가 끝날 때 호감 70 이상. 상대의 말과 행동을 보고 추리수첩🔍에 성향을 체크하세요. 정확할수록 결정적 한마디가 강해져요.</p>
      <button class="btn primary" id="start">대화 시작</button>
    </div>`);
  $('#start').onclick = () => stageShell().then(() => playTurn(0));
}

async function stageShell() {
  const s = run.stage;
  render(`
    <div class="stage" style="background:${s.bg}">
      <div class="bars">
        <div class="bar"><span>💗 호감</span><div class="track"><div class="fill favor" id="favorFill"></div><i class="goal" style="left:70%"></i></div><b id="favorNum"></b></div>
        <div class="bar"><span>🔋 배터리</span><div class="track"><div class="fill battery" id="batFill"></div></div><b id="batNum"></b></div>
        <button class="note-btn" id="note">🔍<span id="noteCount">0</span></button>
      </div>
      <div class="place muted">📍 ${esc(s.place)}</div>
      <div class="npc">
        <div class="npc-portrait">${s.npcIcon}<span class="emo" id="emo">🙂</span></div>
        <div class="npc-name">${esc(s.npcName)} <span class="muted">${esc(s.npcRole)}</span></div>
      </div>
      <div class="dialog"><div class="speaker" id="speaker"></div><div class="text" id="dtext"></div></div>
      <div class="choices" id="choices"></div>
    </div>`);
  $('#note').onclick = () => openNotebook();
  updateBars();
}

function updateBars() {
  if (ms) return updateMissionBars();
  run.favor = clamp(run.favor, 0, FAVOR_MAX);
  run.battery = clamp(run.battery, 0, 100);
  $('#favorFill').style.width = `${run.favor}%`;
  $('#favorNum').textContent = String(run.favor);
  $('#batFill').style.width = `${run.battery}%`;
  $('#batFill').classList.toggle('low', run.battery <= 25);
  $('#batNum').textContent = String(run.battery);
  $('#noteCount').textContent = String(run.observations.length);
}

async function say(speaker: 'npc' | 'me', text: string, emotion?: Emotion) {
  $('#speaker').textContent = speaker === 'npc' ? run.stage.npcName : '나';
  $('#speaker').className = `speaker sp-${speaker}`;
  if (emotion) $('#emo').textContent = EMOTION_ICON[emotion];
  await typeText($('#dtext'), text);
}

function waitTap(label = '▶ 계속'): Promise<void> {
  return new Promise((resolve) => {
    $('#choices').innerHTML = `<button class="btn next" id="cont">${label}</button>`;
    $('#cont').onclick = () => {
      $('#choices').innerHTML = '';
      resolve();
    };
  });
}

async function playTurn(t: number) {
  const s = run.stage;
  if (t >= s.turns.length) return objectionPhase();
  const turn = s.turns[t];
  await say('npc', turn.line, turn.emotion);
  turn.observations.forEach((o) => run.observations.push(o));
  updateBars();
  $('#note').classList.add('pulse');
  setTimeout(() => $('#note')?.classList.remove('pulse'), 1200);
  toast(`🔍 관찰 ${turn.observations.length}개를 추리수첩에 적었다`, 'info');

  if (turn.minigame) {
    await waitTap('🚨 위기 발생! 미니게임 시작');
    const res = await playMinigame(turn.minigame);
    run.mgResults.push(res);
    const gain = MG_FAVOR[res];
    run.favor += gain;
    if (res === 'great') run.battery += MG_GREAT_BATTERY;
    updateBars();
    toast(res === 'fail' ? `미니게임 실패… 호감 ${gain}` : `${res === 'great' ? '대성공!' : '성공!'} 호감 +${gain}`, res === 'fail' ? 'bad' : 'good');
    if (run.favor <= 0) return finishStage();
  }

  const picked = await pickChoice(turn.choices);
  if (picked.kind === 'match') run.matchCount++;
  const bd = batteryDelta(picked.kind, run.compat.batteryMult);
  run.favor += picked.favor;
  run.battery += bd;
  updateBars();
  await say('me', picked.text);
  toast(
    `${KIND_LABEL[picked.kind]} · 호감 ${picked.favor >= 0 ? '+' : ''}${picked.favor} · 배터리 ${bd >= 0 ? '+' : ''}${bd}`,
    picked.kind === 'honest' ? 'bad' : 'good',
  );
  await waitTap();
  await say('npc', picked.reaction, picked.favor >= 10 ? 'HAPPY' : picked.favor > 0 ? 'NORMAL' : 'SUSPECT');

  if (run.battery <= 0 && !(await burnout())) return finishStage();
  if (run.favor <= 0) return finishStage();
  await waitTap();
  playTurn(t + 1);
}

function pickChoice(choices: Choice[]): Promise<Choice> {
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  return new Promise((resolve) => {
    $('#choices').innerHTML = shuffled.map((c, i) => `<button class="btn choice" data-i="${i}">${esc(c.text)}</button>`).join('');
    app.querySelectorAll<HTMLButtonElement>('#choices .choice').forEach((b) =>
      (b.onclick = () => {
        $('#choices').innerHTML = '';
        resolve(shuffled[+b.dataset.i!]);
      }),
    );
  });
}

async function burnout(): Promise<boolean> {
  return new Promise((resolve) => {
    const m = modal(`<h3>🪫 번아웃!</h3><p>사회적 배터리가 바닥났어요. 이대로면 대화를 이어갈 수 없어요.</p>
      <div class="stack">${ads.isAvailable() ? `<button class="btn primary" id="ad">📺 ${AD_LABEL.battery_refill}</button>` : ''}
      <button class="btn" id="quit">포기하고 집에 가기</button></div>`);
    const adBtn = m.querySelector('#ad') as HTMLButtonElement | null;
    if (adBtn)
      adBtn.onclick = async () => {
        m.remove();
        if (await offerAd('battery_refill')) {
          run.battery += AD_REWARD.battery;
          updateBars();
          resolve(true);
        } else resolve(false);
      };
    $('#quit', m).onclick = () => {
      m.remove();
      resolve(false);
    };
  });
}

async function playMinigame(id: MinigameId): Promise<MgResult> {
  const def = MINIGAMES[id];
  const hostile = run.compat.layers.some((l) => l.favor <= -12);
  for (;;) {
    const ov = document.createElement('div');
    ov.className = 'mg-overlay';
    ov.innerHTML = `<div class="mg-ready"><div class="siren">🚨</div><h2>${esc(def.title)}</h2><p>${esc(def.howTo)}</p>
      ${hostile ? '<p class="warn">⚠️ 상극 관계! 방해물이 늘어나요</p>' : ''}<button class="btn primary" id="go">시작!</button></div>`;
    document.body.appendChild(ov);
    await new Promise<void>((r) => ((ov.querySelector('#go') as HTMLButtonElement).onclick = () => r()));
    const stageEl = document.createElement('div');
    stageEl.className = 'mg-root';
    ov.innerHTML = '';
    ov.appendChild(stageEl);
    const res = await def.run({ root: stageEl, npc: run.stage.npc, hostile });
    const label = res === 'great' ? '대성공!' : res === 'normal' ? '성공!' : '실패…';
    stageEl.insertAdjacentHTML('beforeend', `<div class="mg-result ${res}">${label}</div>`);
    await sleep(900);
    if (res !== 'fail' || !ads.isAvailable()) {
      ov.remove();
      return res;
    }
    // 실패 시 보상형 광고로 재도전 (선택)
    const retry = await new Promise<boolean>((r) => {
      ov.innerHTML = `<div class="mg-ready"><h2>실패…</h2><p>이대로 넘어가면 호감 ${MG_FAVOR.fail}</p>
        <button class="btn primary" id="ad">📺 ${AD_LABEL.retry_minigame}</button><button class="btn" id="skip">그냥 넘어가기</button></div>`;
      (ov.querySelector('#ad') as HTMLButtonElement).onclick = () => r(true);
      (ov.querySelector('#skip') as HTMLButtonElement).onclick = () => r(false);
    });
    if (!retry) {
      ov.remove();
      return res;
    }
    ov.remove();
    if (!(await offerAd('retry_minigame'))) return res;
  }
}

// ---------- 추리수첩 ----------
function openNotebook(onClose?: () => void) {
  const s = run.stage;
  const dims = DIMS_BY_LEVEL[s.level - 1];
  const m = modal(`
    <h3>🔍 추리수첩: ${esc(s.npcName)}</h3>
    <div class="obs">${run.observations.length ? run.observations.map((o) => `<div>• ${esc(o)}</div>`).join('') : '<div class="muted">아직 관찰한 게 없어요.</div>'}</div>
    <div class="dims">${dims
      .map((k) => {
        const def = DIM_DEFS[k];
        return `<div class="dim"><span>${def.label}${run.hinted.includes(k) ? ' 💡' : ''}</span><div class="seg">${def.options
          .map((o) => `<button data-k="${k}" data-v="${o.value}" class="${run.guesses[k] === o.value ? 'on' : ''}">${o.label}</button>`)
          .join('')}</div></div>`;
      })
      .join('')}</div>
    <div class="stack">
      ${ads.isAvailable() ? `<button class="btn small" id="hint">📺 ${AD_LABEL.notebook_hint}</button>` : ''}
      <button class="btn primary" id="close">닫기</button>
    </div>`);
  m.querySelectorAll<HTMLButtonElement>('.dims button').forEach((b) =>
    (b.onclick = () => {
      const k = b.dataset.k as DimKey;
      run.guesses[k] = b.dataset.v;
      m.querySelectorAll(`.dims button[data-k="${k}"]`).forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
  const hint = m.querySelector('#hint') as HTMLButtonElement | null;
  if (hint)
    hint.onclick = async () => {
      const target = dims.find((k) => run.guesses[k] !== answerOf(s.npc, k) && !run.hinted.includes(k));
      if (!target) return toast('이미 다 맞혔어요! 추리 천재', 'good');
      m.remove();
      if (await offerAd('notebook_hint')) {
        run.guesses[target] = answerOf(s.npc, target);
        run.hinted.push(target);
        toast(`💡 ${DIM_DEFS[target].label} 정답을 알아냈다!`, 'good');
      }
      openNotebook(onClose);
    };
  $('#close', m).onclick = () => {
    m.remove();
    onClose?.();
  };
}

// ---------- 결정적 한마디 ----------
async function objectionPhase() {
  const o = run.stage.objection;
  await say('npc', o.claim, 'SUSPECT');
  await new Promise<void>((resolve) => {
    $('#choices').innerHTML = `<button class="btn" id="nb">🔍 추리수첩 다시 보기</button><button class="btn primary objection-btn" id="obj">${esc(o.shout)} 결정적 한마디</button>`;
    $('#nb').onclick = () => openNotebook();
    $('#obj').onclick = () => resolve();
  });
  const chosen = await new Promise<string>((resolve) => {
    const m = modal(`<h3>무엇을 제시할까?</h3><div class="evidence">${o.evidence
      .map((e) => `<button class="ev" data-id="${e.id}"><span class="ev-icon">${e.icon}</span><b>${esc(e.name)}</b><span class="muted">${esc(e.desc)}</span></button>`)
      .join('')}</div>`);
    m.querySelectorAll<HTMLButtonElement>('.ev').forEach((b) =>
      (b.onclick = () => {
        m.remove();
        resolve(b.dataset.id!);
      }),
    );
  });
  $('#choices').innerHTML = '';
  await cutIn(o.shout);
  const acc = accuracy(run.stage.npc, DIMS_BY_LEVEL[run.stage.level - 1], run.guesses);
  if (chosen === o.correctId) {
    const gain = Math.round(OBJECTION.baseGain + OBJECTION.accuracyGain * acc);
    run.favor += gain;
    run.objectionOk = true;
    updateBars();
    await say('me', o.playerLine);
    await waitTap();
    await say('npc', o.successLine, 'HAPPY');
    toast(`결정적 한마디 성공! 호감 +${gain} (추리 정확도 ${Math.round(acc * 100)}%)`, 'good');
  } else {
    run.favor += OBJECTION.failFavor;
    run.battery += OBJECTION.failBattery;
    run.objectionOk = false;
    updateBars();
    await say('npc', o.failLine, 'ANGRY');
    toast(`역공당했다! 호감 ${OBJECTION.failFavor}, 배터리 ${OBJECTION.failBattery}`, 'bad');
  }
  await waitTap('결과 보기');
  finishStage();
}

async function cutIn(shout: string) {
  const c = document.createElement('div');
  c.className = 'cutin';
  c.innerHTML = `<div class="cutin-lines"></div><div class="cutin-text">${esc(shout)}</div>`;
  document.body.appendChild(c);
  try {
    navigator.vibrate?.(250);
  } catch {
    /* noop */
  }
  await sleep(1100);
  c.remove();
}

// ---------- 결과 ----------
function finishStage() {
  const s = run.stage;
  run.favor = clamp(run.favor, 0, FAVOR_MAX);
  run.battery = clamp(run.battery, 0, 100);
  const grade: Grade = run.battery <= 0 ? 'F' : gradeOf(run.favor, run.battery);
  const prev = save.best[s.id];
  const rank = { S: 4, A: 3, B: 2, F: 1 } as const;
  if (!prev || rank[grade] > rank[prev]) save.best[s.id] = grade;
  save.battery = clamp(run.battery + BATTERY_REST_BETWEEN_STAGES, 0, 100);
  persist();

  const dims = DIMS_BY_LEVEL[s.level - 1];
  const acc = accuracy(s.npc, dims, run.guesses);
  const reveal = dims
    .map((k) => {
      const ans = answerOf(s.npc, k);
      const label = DIM_DEFS[k].options.find((o) => o.value === ans)!.label;
      const ok = run.guesses[k] === ans;
      return `<span class="${ok ? 'ok' : 'ng'}">${ok ? '✔' : '✘'} ${label}</span>`;
    })
    .join('');
  const clear = grade !== 'F';
  const npcDesc = describe(s.npc);
  const comment = clear
    ? `${npcDesc.split(' · ').slice(0, s.level + 1).join(' ')} ${s.npcRole}을(를) ${grade}등급으로 공략했다! 남은 기력 ${run.battery}%`
    : `${s.npcRole} 공략 실패… 다음엔 꼭!`;
  const next = STAGES.indexOf(s) + 1;

  render(`
    <div class="screen result" style="background:${s.bg}">
      <div class="stamp g-${grade}">${grade}</div>
      <h2>${clear ? '공략 성공!' : '공략 실패'}</h2>
      <p class="intro-text">${esc(clear ? s.endings.clear : s.endings.fail)}</p>
      <div class="result-grid">
        <div><span>💗 최종 호감</span><b>${run.favor}</b></div>
        <div><span>🔋 남은 배터리</span><b>${run.battery}</b></div>
        <div><span>🎯 공략 선택</span><b>${run.matchCount} / ${s.turns.length}</b></div>
        <div><span>🔍 추리 정확도</span><b>${Math.round(acc * 100)}%</b></div>
      </div>
      <div class="reveal"><div class="muted">${esc(s.npcName)}의 정체</div><div class="reveal-tags">${reveal}</div>
        <div class="muted small">${esc(npcDesc)}</div></div>
      <div class="stack">
        <button class="btn" id="share">📸 결과 카드 공유</button>
        ${clear && next < STAGES.length ? `<button class="btn primary" id="next">다음 스테이지</button>` : ''}
        <button class="btn ${clear ? '' : 'primary'}" id="retry">다시 도전</button>
        <button class="btn" id="map">스테이지 목록</button>
      </div>
      <p class="fine">배터리는 다음 스테이지로 이어져요 (+${BATTERY_REST_BETWEEN_STAGES} 회복 → ${save.battery}).</p>
    </div>`);
  $('#share').onclick = () =>
    shareCard({
      title: s.title,
      grade,
      myLine: `${activeName()} (${activeProfile()!.mbti})`,
      npcLine: `${s.npcName} (${s.npc.mbti})`,
      comment,
      batteryLeft: run.battery,
      accuracy: acc,
    });
  const nb = app.querySelector('#next') as HTMLButtonElement | null;
  if (nb) nb.onclick = () => startStage(STAGES[next]);
  $('#retry').onclick = () => startStage(s);
  $('#map').onclick = () => screenMap();
}

// ---------- 미션 모드 ----------
interface MissionState {
  m: MissionStage;
  progress: number;
  patience: number;
  clock: number;
  pushHits: number;
  pushTotal: number;
}
let ms: MissionState | null = null;

const TACTIC_TAG: Record<string, string> = { yield: '🙇 맞춰주기', push: '⚡ 밀어붙이기' };

function startMission(m: MissionStage) {
  const player = activeProfile()!;
  const compat = computeCompat(player, m.npc, m.level);
  run = {
    stage: m as unknown as Stage,
    player, compat,
    favor: 0,
    battery: save.battery,
    guesses: {}, hinted: [], observations: [], matchCount: 0, mgResults: [],
  };
  ms = { m, progress: 0, patience: startPatience(compat.initFavor), clock: m.startClock, pushHits: 0, pushTotal: 0 };
  const rows = compat.layers
    .map((l) => `<tr><td>${LAYER_NAME[l.layer]}</td><td>${esc(l.label)}</td><td class="${l.favor >= 0 ? 'pos' : 'neg'}">${l.favor >= 0 ? '+' : ''}${l.favor}</td></tr>`)
    .join('');
  render(`
    <div class="screen intro" style="background:${m.bg}">
      <div class="muted">${esc(m.chapter)}</div>
      <h2>${esc(m.title)}</h2>
      <div class="npc-big">${m.npcIcon}</div>
      <div class="npc-name">${esc(m.npcName)} <span class="muted">${esc(m.npcRole)}</span></div>
      <p class="intro-text">${esc(m.intro)}</p>
      <div class="compat-box mission-goal">
        <div class="compat-title">🎯 미션: ${esc(m.mission)}</div>
        <ul>${m.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
      <div class="compat-box">
        <div class="compat-title">첫인상 궁합 (상대 성향은 비밀!)</div>
        <table>${rows}</table>
        <div class="compat-sum">시작 ${esc(m.patienceLabel)} <b>${ms.patience}</b> · 감소 배율 <b>×${compat.batteryMult}</b></div>
      </div>
      <p class="fine">🙇 맞춰주기는 안전하지만 시간이 들고 미션이 안 나아가요. ⚡ 밀어붙이기는 빠르지만, 상대 성향에 안 맞는 방식이면 ${esc(m.patienceLabel)}이(가) 크게 깎여요. 추리수첩🔍으로 상대를 읽고 어떤 방식으로 밀지 고르세요.</p>
      <button class="btn primary" id="start">작전 시작</button>
    </div>`);
  $('#start').onclick = () => {
    missionShell();
    playBeat(0);
  };
}

function missionShell() {
  const m = ms!.m;
  render(`
    <div class="stage" style="background:${m.bg}">
      <div class="mbars">
        <div class="clock"><span class="muted">퇴근까지</span><b id="clock"></b></div>
        <div class="bar"><span>🎯 미션</span><div class="track"><div class="fill progress" id="progFill"></div></div><b id="progNum"></b></div>
        <div class="bar"><span>😤 ${esc(m.patienceLabel.split(' ').pop()!)}</span><div class="track"><div class="fill patience" id="patFill"></div></div><b id="patNum"></b></div>
        <div class="bar"><span>🔋 배터리</span><div class="track"><div class="fill battery" id="batFill"></div></div><b id="batNum"></b></div>
        <button class="note-btn" id="note">🔍<span id="noteCount">0</span></button>
      </div>
      <div class="place muted">🎯 ${esc(m.mission)}</div>
      <div class="npc">
        <div class="npc-portrait">${m.npcIcon}<span class="emo" id="emo">🙂</span></div>
        <div class="npc-name">${esc(m.npcName)} <span class="muted">${esc(m.npcRole)}</span></div>
      </div>
      <div class="dialog"><div class="speaker" id="speaker"></div><div class="text" id="dtext"></div></div>
      <div class="choices" id="choices"></div>
    </div>`);
  $('#note').onclick = () => openNotebook();
  updateMissionBars();
}

function updateMissionBars() {
  const s = ms!;
  s.progress = clamp(s.progress, 0, 100);
  s.patience = clamp(s.patience, 0, 100);
  run.battery = clamp(run.battery, 0, 100);
  const left = s.m.deadline - s.clock;
  $('#clock').textContent = `${clockText(s.clock)} (${left >= 0 ? `${left}분 남음` : '초과!'})`;
  $('#clock').classList.toggle('danger', left <= 15);
  $('#progFill').style.width = `${s.progress}%`;
  $('#progNum').textContent = String(s.progress);
  $('#patFill').style.width = `${s.patience}%`;
  $('#patFill').classList.toggle('low', s.patience <= 30);
  $('#patNum').textContent = String(s.patience);
  $('#batFill').style.width = `${run.battery}%`;
  $('#batFill').classList.toggle('low', run.battery <= 25);
  $('#batNum').textContent = String(run.battery);
  $('#noteCount').textContent = String(run.observations.length);
}

function missionOver(): boolean {
  const s = ms!;
  return s.patience <= 0 || s.clock > s.m.deadline;
}

async function playBeat(i: number) {
  const s = ms!;
  const beat = s.m.beats[i];
  if (!beat || missionOver()) return finishMission();
  await say('npc', beat.line, beat.emotion);
  beat.observations.forEach((o) => run.observations.push(o));
  updateMissionBars();
  $('#note').classList.add('pulse');
  setTimeout(() => $('#note')?.classList.remove('pulse'), 1200);
  toast(`🔍 관찰 ${beat.observations.length}개를 추리수첩에 적었다`, 'info');

  if (beat.minigame) {
    await waitTap('🚨 위기 발생! 미니게임 시작');
    const res = await playMinigame(beat.minigame.id);
    s.clock += beat.minigame.minutes;
    const gain = beat.minigame.progress[res];
    s.progress += gain;
    if (res === 'fail') s.patience += patienceDelta(beat.minigame.failPatience, run.compat.batteryMult);
    updateMissionBars();
    toast(res === 'fail' ? `실패… ${s.m.patienceLabel}이(가) 깎였다` : `${res === 'great' ? '대성공!' : '성공!'} 미션 +${gain}`, res === 'fail' ? 'bad' : 'good');
  } else if (beat.objection) {
    await missionObjection(beat.objection);
  } else if (beat.options) {
    const opt = await pickTactic(beat.options);
    const pd = patienceDelta(opt.patience, run.compat.batteryMult);
    const bd = batteryDelta(opt.tactic === 'yield' ? 'mask' : 'match', run.compat.batteryMult);
    s.progress += opt.progress;
    s.patience += pd;
    s.clock += opt.minutes;
    run.battery += bd;
    if (opt.tactic === 'push') {
      s.pushTotal++;
      if (opt.patience >= 0) s.pushHits++;
    }
    updateMissionBars();
    await say('me', opt.text);
    toast(
      `${opt.approach} · 미션 ${opt.progress >= 0 ? '+' : ''}${opt.progress} · ${s.m.patienceLabel.split(' ').pop()} ${pd >= 0 ? '+' : ''}${pd} · ${opt.minutes}분`,
      pd < 0 || opt.progress < 0 ? 'bad' : 'good',
    );
    await waitTap();
    await say('npc', opt.reaction, opt.emotion);
  }
  if (run.battery <= 0 && !(await burnout())) return finishMission();
  await waitTap(missionOver() ? '결과 보기' : '▶ 계속');
  playBeat(i + 1);
}

function pickTactic(options: MissionOption[]): Promise<MissionOption> {
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return new Promise((resolve) => {
    $('#choices').innerHTML = shuffled
      .map((o, i) => `<button class="btn choice tactic ${o.tactic}" data-i="${i}"><span class="tactic-tag">${TACTIC_TAG[o.tactic]} · ${esc(o.approach)} · ⏱${o.minutes}분</span>${esc(o.text)}</button>`)
      .join('');
    app.querySelectorAll<HTMLButtonElement>('#choices .choice').forEach((b) =>
      (b.onclick = () => {
        $('#choices').innerHTML = '';
        resolve(shuffled[+b.dataset.i!]);
      }),
    );
  });
}

async function missionObjection(o: NonNullable<MissionStage['beats'][number]['objection']>) {
  const s = ms!;
  await new Promise<void>((resolve) => {
    $('#choices').innerHTML = `<button class="btn" id="nb">🔍 추리수첩 다시 보기</button><button class="btn primary objection-btn" id="obj">${esc(o.shout)} 결정적 한마디</button>`;
    $('#nb').onclick = () => openNotebook();
    $('#obj').onclick = () => resolve();
  });
  const chosen = await new Promise<string>((resolve) => {
    const m = modal(`<h3>무엇을 제시할까?</h3><div class="evidence">${o.evidence
      .map((e) => `<button class="ev" data-id="${e.id}"><span class="ev-icon">${e.icon}</span><b>${esc(e.name)}</b><span class="muted">${esc(e.desc)}</span></button>`)
      .join('')}</div>`);
    m.querySelectorAll<HTMLButtonElement>('.ev').forEach((b) =>
      (b.onclick = () => {
        m.remove();
        resolve(b.dataset.id!);
      }),
    );
  });
  $('#choices').innerHTML = '';
  await cutIn(o.shout);
  s.clock += o.minutes;
  const acc = accuracy(s.m.npc, DIMS_BY_LEVEL[s.m.level - 1], run.guesses);
  if (chosen === o.correctId) {
    const gain = Math.round(o.progressBase + o.progressAccuracy * acc);
    s.progress += gain;
    updateMissionBars();
    await say('me', o.playerLine);
    await waitTap();
    await say('npc', o.successLine, 'HAPPY');
    toast(`결정적 한마디 성공! 미션 +${gain} (추리 정확도 ${Math.round(acc * 100)}%)`, 'good');
  } else {
    const pd = patienceDelta(o.failPatience, run.compat.batteryMult);
    s.patience += pd;
    updateMissionBars();
    await say('npc', o.failLine, 'ANGRY');
    toast(`역공당했다! ${s.m.patienceLabel} ${pd}`, 'bad');
  }
}

function finishMission() {
  const s = ms!;
  const m = s.m;
  s.progress = clamp(s.progress, 0, 100);
  s.patience = clamp(s.patience, 0, 100);
  const { grade, fail } = run.battery <= 0 ? { grade: 'F' as const, fail: 'progress' as const } : missionResult(s.progress, s.patience, s.clock, m.deadline);
  const prev = save.best[m.id];
  const rank = { S: 4, A: 3, B: 2, F: 1 } as const;
  if (!prev || rank[grade] > rank[prev]) save.best[m.id] = grade;
  save.battery = clamp(run.battery + BATTERY_REST_BETWEEN_STAGES, 0, 100);
  persist();
  const ending = fail === 'patience' ? m.endings.F_patience : fail === 'time' ? m.endings.F_time : fail === 'progress' ? m.endings.F_progress : m.endings[grade as 'S' | 'A' | 'B'];
  const dims = DIMS_BY_LEVEL[m.level - 1];
  const acc = accuracy(m.npc, dims, run.guesses);
  const reveal = dims
    .map((k) => {
      const ans = answerOf(m.npc, k);
      const label = DIM_DEFS[k].options.find((o) => o.value === ans)!.label;
      const ok = run.guesses[k] === ans;
      return `<span class="${ok ? 'ok' : 'ng'}">${ok ? '✔' : '✘'} ${label}</span>`;
    })
    .join('');
  const clear = grade !== 'F';
  render(`
    <div class="screen result" style="background:${m.bg}">
      <div class="stamp g-${grade}">${grade}</div>
      <h2>${clear ? esc(m.clearTitle) : '미션 실패'}</h2>
      <p class="intro-text">${esc(ending)}</p>
      <div class="result-grid">
        <div><span>🎯 미션 진행도</span><b>${s.progress}</b></div>
        <div><span>😤 남은 ${esc(m.patienceLabel)}</span><b>${s.patience}</b></div>
        <div><span>⏰ 끝난 시각</span><b>${clockText(s.clock)}</b></div>
        <div><span>⚡ 통한 밀어붙이기</span><b>${s.pushHits} / ${s.pushTotal}</b></div>
      </div>
      <div class="reveal"><div class="muted">${esc(m.npcName)}의 정체 · 추리 정확도 ${Math.round(acc * 100)}%</div><div class="reveal-tags">${reveal}</div>
        <div class="muted small">${esc(describe(m.npc))}</div></div>
      <div class="stack">
        <button class="btn" id="share">📸 결과 카드 공유</button>
        <button class="btn ${clear ? '' : 'primary'}" id="retry">다시 도전</button>
        <button class="btn ${clear ? 'primary' : ''}" id="map">스테이지 목록</button>
      </div>
    </div>`);
  $('#share').onclick = () =>
    shareCard({
      title: m.title,
      grade,
      myLine: `${activeName()} (${activeProfile()!.mbti})`,
      npcLine: `${m.npcName} (${m.npc.mbti})`,
      comment: clear ? m.shareClear : `${m.title}... 실패. 다음엔 꼭!`,
      batteryLeft: run.battery,
      accuracy: acc,
    });
  $('#retry').onclick = () => startMission(m);
  $('#map').onclick = () => {
    ms = null;
    screenMap();
  };
}

screenTitle();
