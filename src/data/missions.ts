// 미션 모드: 상대 기분을 맞추는 게 아니라, 상대를 읽고 "내 목표"를 이루는 스테이지.
// 게이지: 미션 진행도(100 달성 목표), 상대 인내심(0이 되면 폭발 = 실패), 퇴근 시계(마감 시각 넘기면 실패).
import type { Profile } from '../core/profile';
import type { Emotion, MinigameId, Evidence } from './stages';

export type Tactic = 'yield' | 'push';

export interface MissionOption {
  tactic: Tactic; // yield = 맞춰주기(안전하지만 느림), push = 밀어붙이기(빠르지만 잘못 읽으면 역효과)
  approach: string; // 화면에 보이는 작전 이름. 예: '결론+숫자로 밀기'
  text: string;
  progress: number;
  patience: number; // 음수는 상성 배율만큼 커진다
  minutes: number;
  reaction: string;
  emotion: Emotion;
}

export interface MissionBeat {
  time?: string; // 연출용
  emotion: Emotion;
  line: string;
  observations: string[];
  minigame?: { id: MinigameId; progress: { great: number; normal: number; fail: number }; failPatience: number; minutes: number };
  options?: MissionOption[];
  objection?: {
    evidence: Evidence[];
    correctId: string;
    shout: string;
    playerLine: string;
    successLine: string;
    failLine: string;
    progressBase: number; // + 정확도 × progressAccuracy
    progressAccuracy: number;
    failPatience: number;
    minutes: number;
  };
}

export interface MissionStage {
  id: string;
  chapter: string;
  title: string;
  patienceLabel: string; // 예: '팀장 인내심'
  clearTitle: string; // 예: '미션 성공! 칼퇴!'
  shareClear: string; // 공유 카드 문구
  mission: string;
  conditions: string[];
  level: number;
  npcName: string;
  npcRole: string;
  npcIcon: string;
  bg: string;
  place: string;
  npc: Profile;
  intro: string;
  startClock: number; // 분 단위 (16:50 = 1010)
  deadline: number; // 18:00 = 1080
  beats: MissionBeat[];
  endings: { S: string; A: string; B: string; F_patience: string; F_time: string; F_progress: string };
}

const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
export const clockText = fmt;

export const MISSION_OFFWORK: MissionStage = {
  id: 'MS_301',
  chapter: 'Ch.3 오피스 정글 생존기',
  title: '6시 칼퇴 작전',
  patienceLabel: '팀장 인내심',
  clearTitle: '미션 성공! 칼퇴!',
  shareClear: '깐깐한 팀장을 읽어내고 6시 정각 칼퇴 성공!',
  mission: '오늘 저녁 6시 정각에 퇴근하기',
  conditions: ['미션 진행도 100 채우기', '팀장 인내심이 0이 되지 않게', '18:00 전에 끝내기'],
  level: 3,
  npcName: '박 팀장',
  npcRole: '깐깐한 직장 팀장',
  npcIcon: '👔',
  bg: 'linear-gradient(160deg,#e6ecf2 0%,#d5dde8 100%)',
  place: '사무실 팀장석 앞',
  npc: { mbti: 'ESTJ', blood: 'A', birthYear: 1975, birthMonth: 9, birthDay: 10 },
  intro: '금요일 오후 4시 50분. 오늘은 7시에 절대 놓칠 수 없는 약속이 있다. 6시 정각에 나가야 한다. 그런데 팀장이 나를 부른다.',
  startClock: 16 * 60 + 50,
  deadline: 18 * 60,
  beats: [
    {
      emotion: 'ANGRY',
      line: '이 대리! 주간 보고서를 메신저로 띡 보내면 어떡하나? 보고는 얼굴 보고 하는 거야. 결론부터 말해 봐.',
      observations: ['메신저 보고를 싫어하고 얼굴 보고 하는 보고를 원한다.', "'결론부터 말해 봐'라고 재촉한다."],
      options: [
        { tactic: 'yield', approach: '사과하고 맞춰주기', text: '죄송합니다, 팀장님. 제가 생각이 짧았습니다. 다음부터는 꼭 찾아뵙고 보고드리겠습니다.',
          progress: 0, patience: 10, minutes: 15, emotion: 'NORMAL', reaction: '그래, 알면 됐네. 그래서 진행 상황은? (긴 훈화가 이어진다...)' },
        { tactic: 'push', approach: '결론과 숫자로 밀기', text: '결론부터 말씀드리면 금요일 완료입니다. 상세 자료는 출력해서 지금 바로 올리겠습니다.',
          progress: 25, patience: 5, minutes: 10, emotion: 'NORMAL', reaction: '...음. 그래, 그렇게 하면 되잖아.' },
        { tactic: 'push', approach: '사정 털어놓고 밀기', text: '메신저가 더 빠르고 기록도 남아서요. 그리고 제가 오늘 6시에 꼭 가야 할 일이 있어서...',
          progress: 10, patience: -25, minutes: 10, emotion: 'ANGRY', reaction: '허, 지금 보고 방식 얘기하는데 퇴근 얘기를 하나?' },
      ],
    },
    {
      emotion: 'ANGRY',
      line: '그건 그렇고, 어제 지시한 서류 지금 당장 다 가져와!',
      observations: ['서류 모서리까지 맞춰서 정리하라고 한다.', '책상 위 서류가 날짜순으로 반듯하게 쌓여 있다.'],
      minigame: { id: 'MG_101', progress: { great: 20, normal: 10, fail: 0 }, failPatience: -15, minutes: 10 },
    },
    {
      emotion: 'SUSPECT',
      line: '정리는 잘했군. 그런데 금요일까지 기능 3개 다 된다고? 지난번에도 그렇게 말했잖나. 수치로 말해 봐.',
      observations: ["'수치로 말해 봐'라며 감정보다 근거를 요구한다.", '지난번 작은 실수까지 기억하고 다시 꺼낸다.'],
      options: [
        { tactic: 'yield', approach: '주말 출근으로 맞춰주기', text: '불안하시면 제가 주말에 나와서라도 끝내겠습니다.',
          progress: -10, patience: 15, minutes: 15, emotion: 'HAPPY', reaction: '오, 그 정신 좋네! 그럼 주말 작업 계획도 지금 같이 짜 보지.' },
        { tactic: 'push', approach: '진행률과 시각으로 밀기', text: '현재 진행률 80%, 남은 작업 6시간입니다. 목요일 오후 4시에 중간 보고드리겠습니다.',
          progress: 25, patience: 5, minutes: 10, emotion: 'NORMAL', reaction: '좋아, 그렇게 말하면 알아듣지.' },
        { tactic: 'push', approach: '자신감으로 밀기', text: '팀장님, 저 믿어주십시오! 무조건 됩니다!',
          progress: 5, patience: -15, minutes: 10, emotion: 'SUSPECT', reaction: '믿음 말고 숫자. 숫자를 가져오라고.' },
      ],
    },
    {
      emotion: 'NORMAL',
      line: '아, 그리고 오늘 6시에 다음 주 일정 회의 하나 하자. 길게는 안 할 거야.',
      observations: ["'길게는 안 할 거야'라지만 회의 일정은 이미 캘린더에 넣어 두었다.", '회의 안건이 정리되어 있지 않으면 회의가 길어진다.'],
      options: [
        { tactic: 'yield', approach: '그냥 참석하기', text: '네, 알겠습니다. 6시에 회의실로 가겠습니다.',
          progress: -30, patience: 10, minutes: 5, emotion: 'HAPPY', reaction: '그래, 금방 끝내자고. (과연...?)' },
        { tactic: 'push', approach: '대안 일정과 안건으로 밀기', text: '회의 안건을 지금 정리해서 드리고, 내일 오전 9시에 10분 보고로 대신하면 회의 시간을 줄일 수 있습니다.',
          progress: 20, patience: 0, minutes: 10, emotion: 'SUSPECT', reaction: '흠... 안건부터 정리해 오겠다? 나쁘지 않군.' },
        { tactic: 'push', approach: '솔직하게 거절하기', text: '죄송한데 저 오늘은 6시에 꼭 나가야 해서 회의는 어렵습니다.',
          progress: 10, patience: -25, minutes: 5, emotion: 'ANGRY', reaction: '회사 일보다 중요한 게 있다는 건가?' },
      ],
    },
    {
      emotion: 'SUSPECT',
      line: '가만, 내가 언제 기능 3개를 금요일까지 하라고 했나? 난 분명 수요일이라고 했어! 수요일이었으면 오늘 퇴근은 없는 거고.',
      observations: ['자기가 한 말을 수요일이라고 확신한다.'],
      objection: {
        evidence: [
          { id: 'EV_MINUTES', name: '지난주 주간회의록', icon: '📋', desc: "팀장 서명 옆에 '핵심 3개 기능 금요일 완료'라고 적혀 있다" },
          { id: 'EV_MENU', name: '구내식당 메뉴표', icon: '🍱', desc: '수요일: 제육볶음' },
          { id: 'EV_PARTY', name: '타 부서 회식 공지', icon: '🍻', desc: '금요일 7시, 고깃집' },
        ],
        correctId: 'EV_MINUTES',
        shout: '잠깐만요!',
        playerLine: '지난주 주간회의록입니다. 팀장님 서명 옆에 금요일 완료라고 직접 적으셨습니다!',
        successLine: '...허허, 내가 그렇게 적었군. 자네 기록 하나는 철저하구먼!',
        failLine: '지금 내가 그런 사람으로 보여?! 이게 지금 무슨 상관인가!',
        progressBase: 20,
        progressAccuracy: 15,
        failPatience: -30,
        minutes: 5,
      },
    },
    {
      emotion: 'NORMAL',
      line: '그래서, 오늘 더 남은 건 없나?',
      observations: ['끝맺음이 분명한 보고를 좋아한다.'],
      options: [
        { tactic: 'yield', approach: '남아서 도울 일 묻기', text: '혹시 제가 더 도와드릴 일은 없을까요?',
          progress: -20, patience: 10, minutes: 10, emotion: 'HAPPY', reaction: '오, 그럼 이것 좀 같이 보고 가지.' },
        { tactic: 'push', approach: '마무리 보고하고 나가기', text: '내일 9시 보고 자료는 방금 메일로 드렸습니다. 그럼 먼저 들어가 보겠습니다!',
          progress: 20, patience: 5, minutes: 5, emotion: 'NORMAL', reaction: '...그래, 수고했네.' },
        { tactic: 'push', approach: '가볍게 인사하고 나가기', text: '넵! 그럼 저 먼저 갑니다~ 좋은 주말 보내세요!',
          progress: 10, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '...벌써 가나? 허허.' },
      ],
    },
  ],
  endings: {
    S: '"수고했네, 들어가 봐. 다음 주 보고도 이렇게만 하게." 6시 정각, 박수 받으며 칼퇴!',
    A: '"...그래, 들어가 보게." 6시 정각 칼퇴 성공. 팀장 표정은 아직 조금 굳어 있다.',
    B: '6시에 나오긴 했다. 하지만 등 뒤로 느껴지는 팀장의 시선이 따갑다. 월요일이 걱정된다.',
    F_patience: '"자네 오늘 남아서 나랑 면담 좀 하지." 팀장이 폭발했다. 약속은 취소다.',
    F_time: '시계를 보니 6시 10분. 팀장의 이야기는 아직 끝나지 않았다. 야근 확정.',
    F_progress: '"그럼 그 건 다 정리하고 가게." 일이 남아 버렸다. 야근 확정.',
  },
};

export type MissionGrade = 'S' | 'A' | 'B' | 'F';
export type MissionFail = 'patience' | 'time' | 'progress' | null;

/** 미션 결과 판정 */
export function missionResult(progress: number, patience: number, clock: number, deadline: number): { grade: MissionGrade; fail: MissionFail } {
  if (patience <= 0) return { grade: 'F', fail: 'patience' };
  if (clock > deadline) return { grade: 'F', fail: 'time' };
  if (progress < 100) return { grade: 'F', fail: 'progress' };
  if (patience >= 60) return { grade: 'S', fail: null };
  if (patience >= 35) return { grade: 'A', fail: null };
  return { grade: 'B', fail: null };
}

/** 시작 인내심: 첫인상 궁합으로 정해진다 (상극이면 낮게 시작) */
export function startPatience(initFavor: number): number {
  return Math.min(90, Math.max(30, initFavor + 20));
}

/** 인내심 감소량에는 상성 배율을 곱한다 (상극일수록 더 빨리 닳는다) */
export function patienceDelta(base: number, mult: number): number {
  return base < 0 ? Math.round(base * mult) : base;
}

export const MISSION_RUNNING: MissionStage = {
  id: 'MS_101',
  chapter: 'Ch.1 첫 만남과 동호회',
  title: '뒤풀이 탈출 작전',
  patienceLabel: '모임장 여유',
  clearTitle: '미션 성공! 무사 귀가!',
  shareClear: '신입 환영회 뒤풀이는 빠지고, 다음 주 총무 자리까지 따냈다!',
  mission: '뒤풀이는 빠지고 8시 40분 버스 타기 + 다음 주 총무 자리 따내기',
  conditions: ['미션 진행도 100 채우기', '모임장 여유가 0이 되지 않게', '20:40 버스 놓치지 않기'],
  level: 1,
  npcName: '하나',
  npcRole: '러닝크루 모임장',
  npcIcon: '🏃‍♀️',
  bg: 'linear-gradient(160deg,#ffe8cc 0%,#ffd1dc 100%)',
  place: '한강 공원, 러닝 직후',
  npc: { mbti: 'ESFJ', blood: 'O', birthYear: 1993, birthMonth: 10, birthDay: 5 },
  intro: '오후 8시. 첫 러닝을 무사히 마쳤다. 오늘은 8시 40분 버스를 타고 집에 가서 쉬고 싶다. 그래도 이 크루에는 오래 다니고 싶어서, 다음 주 정기런 총무 자리는 꼭 맡고 싶다. 모임장이 환하게 웃으며 다가온다.',
  startClock: 20 * 60,
  deadline: 20 * 60 + 40,
  beats: [
    {
      emotion: 'HAPPY',
      line: '반가워요! 우리 크루 처음이시죠? 오늘 뒤풀이에서 다들 소개해 드릴게요. 단톡방에 환영 공지도 벌써 올려놨어요!',
      observations: ['처음 본 사람에게 먼저 다가와 이름을 불러준다.', '뒤풀이 장소와 시간을 이미 단톡방에 공지해 두었다.'],
      options: [
        { tactic: 'yield', approach: '일단 따라가기', text: '네! 당연히 가야죠! 어디로 가면 돼요?',
          progress: 0, patience: 10, minutes: 15, emotion: 'HAPPY', reaction: '와 좋아요! 다들 저기 모여 있어요! (뒤풀이 쪽으로 끌려간다...)' },
        { tactic: 'push', approach: '고마움 먼저, 사정은 그다음', text: '공지까지 챙겨주셔서 너무 감사해요! 근데 제가 오늘 8시 40분 버스라서, 다들한테 인사는 제대로 하고 갈게요.',
          progress: 30, patience: 5, minutes: 5, emotion: 'NORMAL', reaction: '아 그래요? 아쉽다~ 그래도 인사는 꼭 해요!' },
        { tactic: 'push', approach: '딱 잘라 말하기', text: '저는 뒤풀이는 원래 안 가요. 러닝만 하려고요.',
          progress: 15, patience: -25, minutes: 5, emotion: 'PANIC', reaction: '아... 그래요? (분위기가 싸해진다)' },
      ],
    },
    {
      emotion: 'PANIC',
      line: '어라, 벌써 가방 챙기세요? 신입 환영회인데 빠지시면 다들 서운해할 텐데...',
      observations: ["'다들 서운해할 텐데'라며 모두의 기분부터 걱정한다."],
      minigame: { id: 'MG_402', progress: { great: 25, normal: 15, fail: 0 }, failPatience: -15, minutes: 10 },
    },
    {
      emotion: 'NORMAL',
      line: '그럼 음료수라도 한 잔 하고 가요! 지난주에 사 둔 이온음료 박스가 그대로 있거든요. 다음 주 정기런 코스도 벌써 짜 놨어요.',
      observations: ['지난주 사 둔 음료 박스처럼 구체적인 물건 이야기를 한다.', '다음 주 코스까지 미리 정해 두었다.'],
      options: [
        { tactic: 'yield', approach: '딱 한 잔만 하고 가기', text: '그럼... 딱 한 잔만 하고 갈게요!',
          progress: -10, patience: 10, minutes: 15, emotion: 'HAPPY', reaction: '좋아요! 아 그리고 이분은 우리 크루 원년 멤버고요... (소개가 끝나지 않는다)' },
        { tactic: 'push', approach: '다음 주 계획으로 약속 걸기', text: '다음 주 토요일 7시, 여의나루역 맞죠? 그날 뒤풀이 총무는 제가 맡을게요. 오늘은 먼저 들어가 볼게요!',
          progress: 30, patience: 5, minutes: 5, emotion: 'HAPPY', reaction: '진짜요?! 계획 챙기는 사람 너무 좋아요! 총무 자리 찜!' },
        { tactic: 'push', approach: '그때 가서 정하기', text: '다음 주는 그때 상황 봐서요~ 저 먼저 갈게요!',
          progress: 5, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '...아, 네. 시간 되시면요.' },
      ],
    },
    {
      emotion: 'SUSPECT',
      line: '근데... 오늘 뒤풀이 빠지는 신입은 보통 다음 주에 안 나오더라고요. 정말 또 올 거예요?',
      observations: ['신입이 계속 나올지를 진심으로 걱정한다.'],
      objection: {
        evidence: [
          { id: 'EV_NOTICE', name: '다음 주 번개 러닝 공지', icon: '📢', desc: '뒤풀이 총무 칸에 방금 내 이름을 적어 둔 단톡방 공지' },
          { id: 'EV_RECORD', name: '러닝 기록 캡처', icon: '⏱️', desc: '오늘 5km 기록 32분 10초' },
          { id: 'EV_RECEIPT', name: '편의점 영수증', icon: '🧾', desc: '생수 1병, 1,200원' },
        ],
        correctId: 'EV_NOTICE',
        shout: '잠깐만요!',
        playerLine: '단톡방 공지 보세요. 다음 주 뒤풀이 총무 칸에 제 이름 벌써 올려놨어요!',
        successLine: '헐, 진짜네?! 이 정도면 벌써 우리 크루 핵심 멤버죠!',
        failLine: '지금 내가 그런 사람으로 보여?! 이걸 왜 보여주는 거예요...?',
        progressBase: 25,
        progressAccuracy: 15,
        failPatience: -30,
        minutes: 5,
      },
    },
    {
      emotion: 'HAPPY',
      line: '알았어요, 오늘은 보내 줄게요! 조심히 가요~',
      observations: ['헤어질 때도 다음 만남을 챙기는 말을 좋아한다.'],
      options: [
        { tactic: 'yield', approach: '그래도 남기', text: '아니에요, 그냥 2차까지 있을게요!',
          progress: -30, patience: 10, minutes: 15, emotion: 'HAPPY', reaction: '오예! 그럼 2차는 노래방!' },
        { tactic: 'push', approach: '다음 만남 챙기며 인사', text: '오늘 사진 단톡방에 올려주세요! 다음 주 토요일에 총무로 제일 먼저 와 있을게요!',
          progress: 25, patience: 5, minutes: 5, emotion: 'HAPPY', reaction: '최고! 다음 주에 가장 반갑게 맞아드릴게요!' },
        { tactic: 'push', approach: '짧게 인사하고 가기', text: '네, 수고하세요.',
          progress: 10, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '...네, 들어가세요.' },
      ],
    },
  ],
  endings: {
    S: '8시 40분 버스 안. 단톡방에 "신입님 다음 주 총무 확정! 최고!"라는 공지가 올라왔다.',
    A: '버스는 탔다. 총무 자리도 맡았다. 모임장의 마지막 표정이 조금 아쉬워 보였다.',
    B: '버스는 탔지만, 단톡방이 조용하다. 다음 주에 나가면 조금 어색할 것 같다.',
    F_patience: '"신입님은 우리랑 안 맞나 봐요." 단톡방에서 조용히 내보내졌다.',
    F_time: '8시 40분 버스가 눈앞에서 떠났다. 결국 2차 노래방에 끌려왔다.',
    F_progress: '집에는 왔지만, 다음 주 총무는 다른 사람이 맡았다.',
  },
};

export const MISSION_BLINDDATE: MissionStage = {
  id: 'MS_201',
  chapter: 'Ch.2 연애와 우정의 온도차',
  title: '애프터 확정 작전',
  patienceLabel: '상대 흥미',
  clearTitle: '미션 성공! 애프터 확정!',
  shareClear: '즉흥파 소개팅 상대를 읽어내고, 토요일 애프터를 확정했다!',
  mission: '식사가 끝나기 전에, 내가 되는 토요일로 애프터 확정하기',
  conditions: ['미션 진행도 100 채우기', '상대 흥미가 0이 되지 않게', '19:40 식사 끝나기 전에'],
  level: 2,
  npcName: '지우',
  npcRole: '첫 소개팅 상대',
  npcIcon: '💁',
  bg: 'linear-gradient(160deg,#e0f2ff 0%,#f3e1ff 100%)',
  place: '연남동 파스타 가게',
  npc: { mbti: 'ENFP', blood: 'B', birthYear: 1996, birthMonth: 6, birthDay: 1 },
  intro: '오후 7시. 주선자가 "둘이 완전 잘 맞을 거야"라고 했던 소개팅. 마음에 든다. 하지만 이번 주에 시간이 되는 날은 토요일뿐이다. 식사가 끝나기 전에 토요일 약속을 잡아야 한다.',
  startClock: 19 * 60,
  deadline: 19 * 60 + 40,
  beats: [
    {
      emotion: 'HAPPY',
      line: '와, 여기 파스타 맛있어 보이지 않아요? 아 맞다, 오는 길에 방탈출 카페 봤는데 완전 재밌어 보이던데!',
      observations: ['파스타 얘기를 하다가 갑자기 방탈출로 화제가 튄다.', '처음 만난 자리인데 먼저 신나게 말을 건다.'],
      options: [
        { tactic: 'yield', approach: '맞장구치고 넘어가기', text: '하하, 재밌겠네요. 일단 메뉴부터 고를까요?',
          progress: 0, patience: 5, minutes: 15, emotion: 'NORMAL', reaction: '아, 네네! 그럼 저는 이거요. (화제가 메뉴로 흘러간다)' },
        { tactic: 'push', approach: '신나게 받아서 제안', text: '오, 저도 방탈출 좋아해요! 오늘은 늦었으니까 토요일에 공포 테마 같이 깨러 갈래요?',
          progress: 30, patience: 5, minutes: 5, emotion: 'HAPPY', reaction: '대박! 공포 테마 완전 좋아해요! 진짜요?!' },
        { tactic: 'push', approach: '일정부터 정확히 잡기', text: '그럼 토요일 오후 2시, 강남역 어때요? 제가 동선 정리해서 보내 드릴게요.',
          progress: 15, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '아... 벌써 동선까지요? 좀 회사 같다...' },
      ],
    },
    {
      emotion: 'SUSPECT',
      line: '...아니에요, 괜찮아요. 그냥 좀.',
      observations: ["'괜찮아요'라고 하지만 휴대폰 화면을 계속 힐끔 본다.", '기분이 얼굴에 바로 드러나고, 풀릴 때도 금방 풀린다.'],
      minigame: { id: 'MG_602', progress: { great: 25, normal: 15, fail: 0 }, failPatience: -15, minutes: 10 },
    },
    {
      emotion: 'NORMAL',
      line: '사실 저 뻔한 소개팅 코스 너무 싫거든요. 밥, 카페, 집. 저 잔소리나 정해진 규칙 같은 거 진짜 싫어해요.',
      observations: ['잔소리와 정해진 규칙을 싫어한다고 직접 말한다.', '새롭고 특이한 경험 이야기에 눈이 반짝인다.'],
      options: [
        { tactic: 'yield', approach: '오늘 바로 2차 가기', text: '그럼 오늘 밥 먹고 바로 방탈출 가요! 토요일은 나중에 생각하고요.',
          progress: -10, patience: 10, minutes: 10, emotion: 'HAPPY', reaction: '오예! (토요일 이야기는 쏙 들어갔다)' },
        { tactic: 'push', approach: '딱 하나만 정하고 나머진 즉흥', text: '그럼 토요일은 딱 하나만 정해요. 방탈출만! 나머진 그날 기분 따라 즉흥으로 가요.',
          progress: 30, patience: 5, minutes: 5, emotion: 'HAPPY', reaction: '우와, 그거 완전 제 스타일이에요!' },
        { tactic: 'push', approach: '그래도 계획은 확실히', text: '그래도 첫 약속은 시간이랑 장소는 확실히 정해 두는 게 좋지 않을까요?',
          progress: 10, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '음... 그렇긴 한데... (흥미가 식는다)' },
      ],
    },
    {
      emotion: 'SUSPECT',
      line: '근데 솔직히... 저 맞춰주느라 억지로 방탈출 좋다고 하는 거죠? 원래 이런 거 안 좋아하시잖아요.',
      observations: ['상대가 진심인지 아닌지를 신경 쓴다.'],
      objection: {
        evidence: [
          { id: 'EV_COUPON', name: '방탈출 VIP 쿠폰', icon: '🎟️', desc: '내 지갑에 원래 있던 방탈출 카페 스탬프 쿠폰 (9/10)' },
          { id: 'EV_CHAT', name: '주선자 메신저', icon: '💬', desc: '"둘이 완전 잘 맞을 거야 ㅋㅋ"' },
          { id: 'EV_BILL', name: '파스타 영수증', icon: '🧾', desc: '2인 38,000원' },
        ],
        correctId: 'EV_COUPON',
        shout: '찾았다!',
        playerLine: '제 지갑 보세요. 방탈출 쿠폰 도장 9개! 저 원래 이거 모으는 사람이에요!',
        successLine: '대박! 쿠폰 모으는 사람 처음 봐요! 우리 진짜 코드 맞는다!',
        failLine: '지금 내가 그런 사람으로 보여?! 그게 무슨 상관이에요?',
        progressBase: 25,
        progressAccuracy: 15,
        failPatience: -30,
        minutes: 5,
      },
    },
    {
      emotion: 'HAPPY',
      line: '그럼... 우리 진짜 토요일에 가는 거예요?',
      observations: ['재미있는 목표가 생기면 신이 난다.'],
      options: [
        { tactic: 'yield', approach: '상대에게 날짜 맡기기', text: '지우 씨 편한 날로 해요! 저는 언제든 맞출게요.',
          progress: -20, patience: 10, minutes: 10, emotion: 'NORMAL', reaction: '음, 그럼 다음 주쯤 연락할게요! (토요일은 날아갔다)' },
        { tactic: 'push', approach: '재미있는 목표로 확정', text: '토요일에 도장 10개 채우는 날로 해요! 공포 테마는 제가 예약할게요.',
          progress: 25, patience: 5, minutes: 5, emotion: 'HAPPY', reaction: '좋아요!! 토요일 완전 기대돼요!' },
        { tactic: 'push', approach: '캘린더에 바로 등록', text: '확정하려면 지금 캘린더에 넣을게요. 시간이랑 장소 정확히 알려주세요.',
          progress: 10, patience: -20, minutes: 5, emotion: 'SUSPECT', reaction: '아... 네... 그럼 2시쯤...?' },
      ],
    },
  ],
  endings: {
    S: '"토요일 완전 기대돼요!" 집에 가는 길에 메시지가 먼저 왔다. 애프터 확정!',
    A: '토요일 약속은 잡았다. 조금 들뜬 마음으로 집에 간다.',
    B: '토요일 약속은 잡았지만, 상대의 마지막 미소가 조금 어색했다.',
    F_patience: '"오늘 즐거웠어요~" 정중한 인사. 아마 다음은 없을 것 같다.',
    F_time: '식사가 끝나 버렸다. 토요일 이야기는 꺼내지도 못했다.',
    F_progress: '"다음에 또 봐요!" 언제인지는 정하지 못했다.',
  },
};

/** 미션 모드 스테이지 순서 */
export const MISSIONS: MissionStage[] = [MISSION_RUNNING, MISSION_BLINDDATE, MISSION_OFFWORK];
