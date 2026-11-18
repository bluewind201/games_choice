// 온보딩 성향 진단 (03 시트 TB_ONBOARDING_QUIZ 기반)과 페르소나 카드
import type { Profile } from '../core/profile';

export interface QuizItem {
  id: string;
  dim: 'EI' | 'SN' | 'TF' | 'JP';
  title: string;
  q: string;
  a: { text: string; letter: string; score: number };
  b: { text: string; letter: string; score: number };
}

export const QUIZ: QuizItem[] = [
  { id: 'QZ_01', dim: 'EI', title: '주말 아침', q: '금요일 밤까지 야근하고 맞이한 토요일 아침! 눈을 뜨자마자 드는 생각은?',
    a: { text: '이번 주 고생했으니 친구들 불러서 맛집 가야지!', letter: 'E', score: 2 },
    b: { text: '오늘은 휴대폰 무음. 이불 밖으로 안 나간다.', letter: 'I', score: 2 } },
  { id: 'QZ_02', dim: 'EI', title: '모임 도착', q: '처음 나간 러닝크루 모임, 다들 어색하게 서 있을 때 나는?',
    a: { text: '먼저 말 걸면서 분위기 띄우고 자기소개를 주도한다.', letter: 'E', score: 2 },
    b: { text: '누가 말 걸어줄 때까지 조용히 스트레칭하며 눈치 본다.', letter: 'I', score: 2 } },
  { id: 'QZ_03', dim: 'EI', title: '회식 자리', q: '2차 노래방 가자는 부장님의 외침에 내 속마음은?',
    a: { text: '오예! 탬버린 어디 있나요? 분위기 찢어놓자!', letter: 'E', score: 1 },
    b: { text: '(사회적 배터리 3% 남음...) 어떻게 자연스럽게 빠지지?', letter: 'I', score: 2 } },
  { id: 'QZ_04', dim: 'SN', title: '업무 지시', q: "팀장님이 '이번 기획안 좀 트렌디하게 잡아봐'라고만 하셨을 때?",
    a: { text: '작년 레퍼런스랑 경쟁사 수치부터 엑셀로 정리한다.', letter: 'S', score: 2 },
    b: { text: '완전히 새로운 컨셉 3개부터 떠올린다.', letter: 'N', score: 2 } },
  { id: 'QZ_05', dim: 'SN', title: '사과 먹기', q: '빨간 사과를 멍하니 바라볼 때 떠오르는 생각은?',
    a: { text: '아삭하고 달겠다. 깎아 먹을까 씻어 먹을까?', letter: 'S', score: 2 },
    b: { text: '백설공주 독사과... 중력이 없었다면 사과는 어디로?', letter: 'N', score: 2 } },
  { id: 'QZ_06', dim: 'SN', title: '길 찾기', q: '처음 가보는 맛집을 찾아갈 때 나의 스타일은?',
    a: { text: '지도 앱 켜고 출구 번호, 도보 몇 분인지 정확히 따라간다.', letter: 'S', score: 2 },
    b: { text: '대충 이쪽이겠지~ 걷다 보면 감으로 찾는다.', letter: 'N', score: 1 } },
  { id: 'QZ_07', dim: 'TF', title: '친구 고민', q: "친구가 '나 오늘 차 사고 났어 ㅠㅠ'라고 카톡을 보냈을 때?",
    a: { text: '어디 다친 데는 없어?! 많이 놀랐겠다 괜찮아?!', letter: 'F', score: 2 },
    b: { text: '몸은 괜찮아? 보험사 불렀어? 과실 비율은?', letter: 'T', score: 2 } },
  { id: 'QZ_08', dim: 'TF', title: '선물 받기', q: '연인이 내 취향과 전혀 다른 비싼 선물을 사 왔을 때?',
    a: { text: '나를 생각해서 골랐다는 마음에 감동, 폭풍 리액션!', letter: 'F', score: 2 },
    b: { text: '고맙지만 영수증 있으면 실용적인 걸로 바꿀지 물어본다.', letter: 'T', score: 2 } },
  { id: 'QZ_09', dim: 'TF', title: '회의 반박', q: '동료의 아이디어가 현실성이 떨어져 보일 때 나의 화법은?',
    a: { text: '좋은 방향인데 이 부분만 보완하면 완벽할 것 같아요.', letter: 'F', score: 1 },
    b: { text: '예산과 일정상 어렵습니다. 근거가 부족해요.', letter: 'T', score: 2 } },
  { id: 'QZ_10', dim: 'JP', title: '여행 계획', q: '3박 4일 해외여행 일주일 전, 내 메모장은?',
    a: { text: '시간 단위 동선, 브레이크타임, 플랜B까지 완비.', letter: 'J', score: 2 },
    b: { text: '항공권이랑 첫날 숙소만 예약! 나머지는 현지 느낌대로.', letter: 'P', score: 2 } },
  { id: 'QZ_11', dim: 'JP', title: '책상 정리', q: '업무가 몰아칠 때 내 바탕화면 상태는?',
    a: { text: '폴더별 날짜순 정리 끝! 정돈돼야 머리가 돌아간다.', letter: 'J', score: 2 },
    b: { text: '최종_진짜최종_수정2.pptx가 바탕화면을 뒤덮고 있다.', letter: 'P', score: 2 } },
  { id: 'QZ_12', dim: 'JP', title: '약속 변경', q: "외출 준비 다 했는데 친구가 '오늘 약속 내일로 미룰까?'",
    a: { text: '세팅한 하루 계획이 틀어져서 엄청 스트레스받는다.', letter: 'J', score: 2 },
    b: { text: '오히려 좋아! 바로 잠옷으로 갈아입는다.', letter: 'P', score: 2 } },
];

/** 퀴즈 응답(각 문항 'a'|'b') → MBTI */
export function scoreQuiz(answers: ('a' | 'b')[]): string {
  const score: Record<string, number> = {};
  QUIZ.forEach((item, i) => {
    const pick = answers[i] === 'a' ? item.a : item.b;
    score[pick.letter] = (score[pick.letter] ?? 0) + pick.score;
  });
  const pickLetter = (x: string, y: string) => ((score[x] ?? 0) >= (score[y] ?? 0) ? x : y);
  return pickLetter('E', 'I') + pickLetter('S', 'N') + pickLetter('T', 'F') + pickLetter('J', 'P');
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  profile: Profile;
}

/** 진짜 내 성향이 불리할 때 골라 쓰는 페르소나 카드 */
export const PERSONAS: Persona[] = [
  { id: 'P_SOCIAL', name: '눈치 백단 인싸', tagline: '어디서든 분위기를 읽는 사회생활 만렙',
    profile: { mbti: 'ENFJ', blood: 'O', birthYear: 1992, birthMonth: 10, birthDay: 3 } },
  { id: 'P_LOGIC', name: '팩트 정리왕', tagline: '감정보다 근거, 3줄 요약의 달인',
    profile: { mbti: 'ISTJ', blood: 'A', birthYear: 1988, birthMonth: 5, birthDay: 2 } },
  { id: 'P_FREE', name: '자유로운 영혼', tagline: '즉흥과 아이디어로 판을 뒤집는 타입',
    profile: { mbti: 'ENTP', blood: 'B', birthYear: 1998, birthMonth: 12, birthDay: 1 } },
];
