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
  title: string;
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
  title: '6시 칼퇴 작전',
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
