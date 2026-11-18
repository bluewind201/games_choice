// 프로토타입 스테이지 3개 (03 시트 STG_101 / STG_201 / STG_301을 3선택지 구조로 재작성)
import type { Profile } from '../core/profile';
import type { ChoiceKind } from '../core/rules';

export type Emotion = 'HAPPY' | 'NORMAL' | 'PANIC' | 'ANGRY' | 'SUSPECT' | 'CRY';
export type MinigameId = 'MG_101' | 'MG_402' | 'MG_602';

export interface Choice {
  kind: ChoiceKind;
  text: string;
  favor: number;
  reaction: string;
}

export interface Turn {
  emotion: Emotion;
  line: string;
  /** 추리수첩에 기록되는 관찰. 정답을 직접 말하지 않고 행동으로 보여준다. */
  observations: string[];
  minigame?: MinigameId;
  choices: Choice[];
}

export interface Evidence {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export interface Objection {
  claim: string;
  evidence: Evidence[];
  correctId: string;
  shout: string; // '잠깐만요!' 등
  playerLine: string;
  successLine: string;
  failLine: string;
}

/** 추리수첩 항목. level에 따라 해금된다. */
export type DimKey = 'EI' | 'SN' | 'TF' | 'JP' | 'BLOOD' | 'GEN';

export interface Stage {
  id: string;
  chapter: string;
  title: string;
  level: number; // 1=MBTI, 2=+혈액형, 3=+세대
  npcName: string;
  npcRole: string;
  npcIcon: string;
  bg: string; // CSS 배경 그라데이션
  place: string;
  npc: Profile;
  intro: string;
  turns: Turn[];
  objection: Objection;
  endings: { clear: string; fail: string };
}

export const DIMS_BY_LEVEL: DimKey[][] = [
  ['EI', 'SN', 'TF', 'JP'],
  ['EI', 'SN', 'TF', 'JP', 'BLOOD'],
  ['EI', 'SN', 'TF', 'JP', 'BLOOD', 'GEN'],
];

export const STAGES: Stage[] = [
  {
    id: 'STG_101',
    chapter: 'Ch.1 첫 만남과 동호회',
    title: '신입 환영회에서 살아남기',
    level: 1,
    npcName: '하나',
    npcRole: '러닝크루 모임장',
    npcIcon: '🏃‍♀️',
    bg: 'linear-gradient(160deg,#ffe8cc 0%,#ffd1dc 100%)',
    place: '한강 공원, 러닝 직후',
    npc: { mbti: 'ESFJ', blood: 'O', birthYear: 1993, birthMonth: 10, birthDay: 5 },
    intro: '첫 러닝을 무사히 마쳤다. 이제 집에 가서 눕기만 하면 되는데... 모임장이 환하게 웃으며 다가온다.',
    turns: [
      {
        emotion: 'HAPPY',
        line: '반가워요! 우리 크루 처음이시죠? 오늘 뒤풀이에서 다들 소개해 드릴게요. 단톡방에 환영 공지도 벌써 올려놨어요!',
        observations: ['처음 본 사람에게 먼저 다가와 이름을 불러준다.', '뒤풀이 장소와 시간을 이미 단톡방에 공지해 두었다.'],
        choices: [
          { kind: 'match', text: '벌써 공지까지 챙겨주셨네요! 덕분에 하나도 안 어색해요. 감사합니다.', favor: 14, reaction: '에이 뭘요~ 그렇게 말해주니까 저도 기분 좋네요!' },
          { kind: 'mask', text: '네! 당연히 가야죠! 건배사도 준비하겠습니다!', favor: 8, reaction: '오, 텐션 좋다! 기대할게요!' },
          { kind: 'honest', text: '아... 저는 러닝만 하고 가려고 했는데요.', favor: -10, reaction: '아... 그래요? (분위기가 살짝 식는다)' },
        ],
      },
      {
        emotion: 'PANIC',
        line: '어라, 벌써 가방 챙기세요? 신입 환영회인데 빠지시면 다들 서운해할 텐데...',
        observations: ["'다들 서운해할 텐데'라며 모두의 기분부터 걱정한다."],
        minigame: 'MG_402',
        choices: [
          { kind: 'match', text: '제가 빠지면 분위기 흐려질까 봐 걱정되셨구나. 10분만이라도 인사하고 갈게요.', favor: 14, reaction: '역시! 마음 써줘서 고마워요. 다들 엄청 반가워할 거예요!' },
          { kind: 'mask', text: '아 아니에요! 가방은 그냥 정리만 한 거예요, 하하.', favor: 7, reaction: '그쵸? 깜짝 놀랐잖아요~' },
          { kind: 'honest', text: '솔직히 오늘은 좀 피곤해서요. 다음에 갈게요.', favor: -12, reaction: '...아, 네. 그럼 어쩔 수 없죠.' },
        ],
      },
      {
        emotion: 'NORMAL',
        line: '그럼 치맥 대신 음료수라도 한 잔 해요! 지난주에 사 둔 이온음료 박스가 그대로 있거든요. 다음 주 정기런 코스도 벌써 짜 놨어요.',
        observations: ['지난주 사 둔 음료 박스처럼 구체적인 물건 이야기를 한다.', '다음 주 코스까지 미리 정해 두었다.'],
        choices: [
          { kind: 'match', text: '다음 주 코스 벌써 나왔어요? 몇 시에 어디서 모이는지 알려주시면 일정 맞춰둘게요.', favor: 15, reaction: '오! 계획 챙기는 사람 너무 좋아요. 토요일 7시, 여의나루역 2번 출구예요!' },
          { kind: 'mask', text: '와, 모임장님 최고! 무조건 따라갈게요!', favor: 7, reaction: '하하, 말이라도 고마워요!' },
          { kind: 'honest', text: '그냥 그때 가서 상황 보고 정할게요.', favor: -10, reaction: '아... 네, 시간 되시면요.' },
        ],
      },
    ],
    objection: {
      claim: '근데... 오늘 뒤풀이 빠지는 신입은 보통 다음 주에 안 나오더라고요. 정말 또 올 거예요?',
      evidence: [
        { id: 'EV_NOTICE', name: '다음 주 번개 러닝 공지', icon: '📢', desc: '뒤풀이 총무 칸에 내 이름을 적어 둔 단톡방 공지' },
        { id: 'EV_RECORD', name: '러닝 기록 캡처', icon: '⏱️', desc: '오늘 5km 기록 32분 10초' },
        { id: 'EV_RECEIPT', name: '편의점 영수증', icon: '🧾', desc: '생수 1병, 1,200원' },
      ],
      correctId: 'EV_NOTICE',
      shout: '잠깐만요!',
      playerLine: '다음 주 번개 공지 보세요. 뒤풀이 총무 칸에 제 이름 벌써 올려놨어요!',
      successLine: '헐, 진짜네?! 이 정도면 벌써 우리 크루 핵심 멤버죠! 오늘은 푹 쉬어요!',
      failLine: '지금 내가 그런 사람으로 보여?! 이걸 왜 보여주는 거예요...?',
    },
    endings: {
      clear: '모임장이 단톡방에 "오늘 신입님 최고!"라고 올렸다. 집에 가는 발걸음이 가볍다.',
      fail: '단톡방이 조용하다. 다음 주에 나가기가 조금 망설여진다.',
    },
  },
  {
    id: 'STG_201',
    chapter: 'Ch.2 연애와 우정의 온도차',
    title: '소개팅 정적 깨기',
    level: 2,
    npcName: '지우',
    npcRole: '첫 소개팅 상대',
    npcIcon: '💁',
    bg: 'linear-gradient(160deg,#e0f2ff 0%,#f3e1ff 100%)',
    place: '연남동 파스타 가게',
    npc: { mbti: 'ENFP', blood: 'B', birthYear: 1996, birthMonth: 6, birthDay: 1 },
    intro: '주선자가 "둘이 완전 잘 맞을 거야"라고 했던 소개팅. 상대가 메뉴판을 들고 반짝이는 눈으로 말을 건다.',
    turns: [
      {
        emotion: 'HAPPY',
        line: '와, 여기 파스타 맛있어 보이지 않아요? 아 맞다, 오는 길에 방탈출 카페 봤는데 완전 재밌어 보이던데!',
        observations: ['파스타 얘기를 하다가 갑자기 방탈출로 화제가 튄다.', '처음 만난 자리인데 먼저 신나게 말을 건다.'],
        choices: [
          { kind: 'match', text: '방탈출이요? 좋은데요! 공포 테마 있으면 밥 먹고 바로 가볼래요?', favor: 15, reaction: '대박! 공포 테마 완전 좋아해요! 벌써 신나는데요?' },
          { kind: 'mask', text: '하하, 재밌겠네요. 일단 메뉴부터 고를까요?', favor: 6, reaction: '아, 네네! 그럼 저는 이거요.' },
          { kind: 'honest', text: '저는 계획 없이 움직이는 건 좀 불편해서요.', favor: -12, reaction: '아... 좀 진지하신 편이구나.' },
        ],
      },
      {
        emotion: 'SUSPECT',
        line: '...아니에요, 괜찮아요. 그냥 좀.',
        observations: ["'괜찮아요'라고 하지만 휴대폰 화면을 계속 힐끔 본다.", '기분이 얼굴에 바로 드러나고, 풀릴 때도 금방 풀린다.'],
        minigame: 'MG_602',
        choices: [
          { kind: 'match', text: '혹시 방탈출 마지막 타임 마감될까 봐 그래요? 지금 바로 예약해요!', favor: 15, reaction: '헉, 어떻게 알았어요?! 맞아요, 9시 타임 두 자리 남았대요!' },
          { kind: 'mask', text: '제가 뭐 실수했나요? 기분 상하셨으면 죄송해요.', favor: 5, reaction: '아뇨아뇨, 그런 거 아니에요...' },
          { kind: 'honest', text: '말 안 해주시면 저도 모르죠.', favor: -12, reaction: '...네, 그렇죠.' },
        ],
      },
      {
        emotion: 'NORMAL',
        line: '사실 저 뻔한 소개팅 코스 너무 싫거든요. 밥, 카페, 집. 저 잔소리나 정해진 규칙 같은 거 진짜 싫어해요. 우리 좀 특이하게 놀면 안 돼요?',
        observations: ['잔소리와 정해진 규칙을 싫어한다고 직접 말한다.', '새롭고 특이한 경험 이야기에 눈이 반짝인다.'],
        choices: [
          { kind: 'match', text: '좋아요, 오늘은 규칙 없이 가요. 방탈출 끝나고 갈 곳도 그때 즉흥으로 정해요!', favor: 15, reaction: '우와, 저랑 통하는 사람 찾기 힘든데!' },
          { kind: 'mask', text: '맞아요, 저도 뻔한 거 싫어해요!', favor: 7, reaction: '그쵸그쵸! (근데 진짜일까?)' },
          { kind: 'honest', text: '그래도 첫 만남엔 어느 정도 격식이 필요하다고 봐요.', favor: -12, reaction: '아... 제가 실수했나 보네요.' },
        ],
      },
    ],
    objection: {
      claim: '근데 솔직히... 오늘 저 맞춰주느라 억지로 하는 거죠? 원래 이런 거 안 좋아하시잖아요.',
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
    },
    endings: {
      clear: '"다음엔 제가 방탈출 예약할게요!" 애프터 확정이다.',
      fail: '"오늘 즐거웠어요~" 정중한 인사. 아마 다음은 없을 것 같다.',
    },
  },
  {
    id: 'STG_301',
    chapter: 'Ch.3 오피스 정글 생존기',
    title: '금요일 5시, 결재서류 폭격',
    level: 3,
    npcName: '박 팀장',
    npcRole: '깐깐한 직장 팀장',
    npcIcon: '👔',
    bg: 'linear-gradient(160deg,#e6ecf2 0%,#d5dde8 100%)',
    place: '사무실 팀장석 앞',
    npc: { mbti: 'ESTJ', blood: 'A', birthYear: 1975, birthMonth: 9, birthDay: 10 },
    intro: '금요일 오후 4시 50분. 메신저로 주간 보고를 보내고 퇴근 준비를 하는데, 팀장이 나를 부른다.',
    turns: [
      {
        emotion: 'ANGRY',
        line: '이 대리! 주간 보고서를 메신저로 띡 보내면 어떡하나? 보고는 얼굴 보고 하는 거야. 결론부터 말해 봐.',
        observations: ['메신저 보고를 싫어하고 얼굴 보고 하는 보고를 원한다.', "'결론부터 말해 봐'라고 재촉한다."],
        choices: [
          { kind: 'match', text: '결론부터 말씀드리면 금요일 완료입니다. 상세 자료는 출력해서 바로 올리겠습니다.', favor: 15, reaction: '음, 그래. 그렇게 하면 되잖아.' },
          { kind: 'mask', text: '죄송합니다 팀장님! 앞으로 더 열심히 하겠습니다!', favor: 6, reaction: '열심히 말고 제대로 하게.' },
          { kind: 'honest', text: '메신저가 더 빠르고 기록도 남아서 그렇게 했는데요.', favor: -12, reaction: '허, 지금 말대꾸하는 건가?' },
        ],
      },
      {
        emotion: 'ANGRY',
        line: '그건 그렇고, 어제 지시한 서류 지금 당장 다 가져와!',
        observations: ['서류 모서리까지 맞춰서 정리하라고 한다.', '책상 위 서류가 날짜순으로 반듯하게 쌓여 있다.'],
        minigame: 'MG_101',
        choices: [
          { kind: 'match', text: '서류는 날짜순으로 정리했고, 수정한 부분은 빨간 펜으로 표시해 두었습니다.', favor: 14, reaction: '...흠, 꼼꼼하군.' },
          { kind: 'mask', text: '팀장님 오늘 넥타이 멋지십니다!', favor: 5, reaction: '쓸데없는 소리 말고.' },
          { kind: 'honest', text: '이렇게 급하게 하실 거면 미리 말씀해 주시지...', favor: -12, reaction: '뭐라고?' },
        ],
      },
      {
        emotion: 'SUSPECT',
        line: '정리는 잘했군. 그런데 금요일까지 기능 3개 다 된다고? 지난번에도 그렇게 말했잖나. 수치로 말해 봐.',
        observations: ["'수치로 말해 봐'라며 감정보다 근거를 요구한다.", '지난번 작은 실수까지 기억하고 다시 꺼낸다.'],
        choices: [
          { kind: 'match', text: '현재 진행률 80%, 남은 작업 6시간입니다. 목요일 오후 4시에 중간 보고드리겠습니다.', favor: 15, reaction: '좋아, 그렇게 말하면 알아듣지.' },
          { kind: 'mask', text: '네! 무조건 됩니다! 믿어주십시오!', favor: 6, reaction: '믿음 말고 숫자.' },
          { kind: 'honest', text: '솔직히 빠듯합니다. 일정을 좀 늦추면 안 될까요?', favor: -10, reaction: '이제 와서?' },
        ],
      },
    ],
    objection: {
      claim: '가만, 내가 언제 기능 3개를 금요일까지 하라고 했나? 난 분명 수요일이라고 했어!',
      evidence: [
        { id: 'EV_MINUTES', name: '지난주 주간회의록', icon: '📋', desc: "팀장 서명 옆에 '핵심 3개 기능 금요일 완료'라고 적혀 있다" },
        { id: 'EV_MENU', name: '구내식당 메뉴표', icon: '🍱', desc: '수요일: 제육볶음' },
        { id: 'EV_PARTY', name: '타 부서 회식 공지', icon: '🍻', desc: '금요일 7시, 고깃집' },
      ],
      correctId: 'EV_MINUTES',
      shout: '잠깐만요!',
      playerLine: '지난주 주간회의록입니다. 팀장님 서명 옆에 금요일 완료라고 직접 적으셨습니다!',
      successLine: '...허허, 내가 그렇게 적었군. 자네 기록 하나는 철저하구먼! 좋아, 금요일로 가지.',
      failLine: '지금 내가 그런 사람으로 보여?! 이게 지금 무슨 상관인가!',
    },
    endings: {
      clear: '"수고했네, 들어가 봐." 6시 정각, 칼퇴에 성공했다.',
      fail: '"오늘 다 끝내고 가게." 사무실 불이 하나둘 꺼진다.',
    },
  },
];
