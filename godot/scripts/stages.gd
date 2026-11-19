## 인생 스테이지: 유딩 → 초딩 → 중딩 → 고딩 → 대학생 → 직장인 → 노인.
## 스테이지 미션을 깨면 나이를 먹고 다음 스테이지로 간다. (직장인 미션은 game.json의 MS_301을 쓴다)
class_name Stages
extends RefCounted

const LIST := [
	{"id": "kid", "label": "유딩", "age": 6, "title": "햇님반 유치원생", "place": "아파트 단지 유치원", "door": Vector2(37, 94.6),
		"route": [Vector2(22, 95), Vector2(37, 95)], "goal": "9시 전에 유치원 가기", "missionId": "ST_KID", "missionTime": 10 * 60,
		"npc": {"id": "t_kim", "name": "김 선생님", "pos": Vector2(39, 95.6), "look": {"skin": "#f2c9a0", "hair": "#6b3f1f", "shirt": "#ff8fab", "pants": "#4f6dff", "hairStyle": "long"}},
		"outfit": {"shirt": "#ff9f1a", "pants": "#4f6dff", "hat": "cap", "hatColor": "#ffd166", "bag": true, "tie": false, "glasses": null}},
	{"id": "elem", "label": "초딩", "age": 10, "title": "3학년 2반 초등학생", "place": "학교", "door": Vector2(135, 78.6),
		"route": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 79), Vector2(135, 79)], "goal": "9시 전에 학교 가기", "missionId": "ST_ELEM", "missionTime": 13 * 60,
		"npc": {"id": "t_choi", "name": "최 선생님", "pos": Vector2(133, 79.6), "look": {"skin": "#e8b98c", "hair": "#2b2118", "shirt": "#43d39e", "pants": "#2d3047", "glasses": "round", "hairStyle": "short"}},
		"outfit": {"shirt": "#43d39e", "pants": "#2d3047", "hat": null, "bag": true, "tie": false, "glasses": null}},
	{"id": "mid", "label": "중딩", "age": 15, "title": "중2 (질풍노도)", "place": "학원 (서점 건물 2층)", "door": Vector2(121, 94.6),
		"route": [Vector2(22, 95), Vector2(121, 95)], "goal": "9시 전에 학원 가기 (방학 특강)", "missionId": "ST_MID", "missionTime": 15 * 60,
		"npc": {"id": "mom", "name": "엄마", "pos": Vector2(123, 95.4), "look": {"skin": "#f2c9a0", "hair": "#3a2a20", "shirt": "#bfcaff", "pants": "#555a66", "hairStyle": "bun"}},
		"outfit": {"shirt": "#2d4a8a", "pants": "#2d3047", "hat": null, "bag": true, "tie": false, "glasses": null}},
	{"id": "high", "label": "고딩", "age": 18, "title": "고3 수험생", "place": "학교", "door": Vector2(135, 78.6),
		"route": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 79), Vector2(135, 79)], "goal": "9시 전에 학교 가기", "missionId": "ST_HIGH", "missionTime": 16 * 60 + 30,
		"npc": {"id": "t_kang", "name": "강 부장 선생님", "pos": Vector2(137, 79.6), "look": {"skin": "#e8b98c", "hair": "#222", "shirt": "#555a66", "pants": "#2d3047", "glasses": "sun", "hairStyle": "short"}},
		"outfit": {"shirt": "#3b3360", "pants": "#2d3047", "hat": null, "bag": true, "tie": true, "glasses": null}},
	{"id": "univ", "label": "대학생", "age": 22, "title": "새내기 대학생", "place": "카페 (조별과제 모임)", "door": Vector2(97, 32.6),
		"route": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 33), Vector2(97, 33)], "goal": "9시 전에 카페에서 조모임 자리 잡기", "missionId": "ST_UNIV", "missionTime": 14 * 60,
		"npc": {"id": "minsu", "name": "민수 (조원)", "pos": Vector2(99, 33.4), "look": {"skin": "#f2c9a0", "hair": "#c66f00", "shirt": "#ffd166", "pants": "#4a5a7a", "hat": "beanie", "hatColor": "#2d3047"}},
		"outfit": {"shirt": "#e2445c", "pants": "#4a5a7a", "hat": null, "bag": true, "tie": false, "glasses": "round"}},
	{"id": "work", "label": "직장인", "age": 30, "title": "3년 차 대리", "place": "회사", "door": Vector2(118, 32.6),
		"route": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 33), Vector2(115, 33)], "goal": "9시 전에 회사 출근하기", "missionId": "MS_301", "missionTime": 16 * 60 + 50,
		"npc": {"id": "boss", "name": "박 팀장", "pos": Vector2(114, 32.8), "look": {}},
		"outfit": {"shirt": "#f4f4f4", "pants": "#2d3047", "hat": null, "bag": false, "tie": true, "glasses": null}},
	{"id": "old", "label": "노인", "age": 70, "title": "동네 멋쟁이 어르신", "place": "공원", "door": Vector2(32, 45.5),
		"route": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 55), Vector2(40, 55), Vector2(40, 47), Vector2(32, 45)], "goal": "9시 전에 공원 아침 산책", "missionId": "ST_OLD", "missionTime": 15 * 60,
		"npc": {"id": "grandkid", "name": "손녀 하린", "pos": Vector2(30, 45.6), "look": {"skin": "#f2c9a0", "hair": "#2b2118", "shirt": "#ff8fab", "pants": "#4f6dff", "hairStyle": "pony"}},
		"outfit": {"shirt": "#8a6a4a", "pants": "#5a4a3a", "hat": null, "bag": false, "tie": false, "glasses": "round", "hair": "#dddddd"}},
]

## 대화 장면 배경
const SCENE := {"ST_KID": "kinder", "ST_ELEM": "class", "ST_MID": "academy", "ST_HIGH": "class", "ST_UNIV": "cafe", "MS_301": "office", "ST_OLD": "park"}

static func get_stage(i: int) -> Dictionary:
	return LIST[clampi(i, 0, LIST.size() - 1)]

static func by_mission(id: String) -> Dictionary:
	for s in LIST:
		if s.missionId == id:
			return s
	return {}

# ---------- 미니게임 설정 (엔진 3종을 상황에 맞게 꾸며 쓴다) ----------
## jump: 다가오는 것을 타이밍 맞춰 뛰어넘기 · dodge: 세 줄에서 좌우로 피하기 · quiz: 빨리 고르기
const MG := {
	# 운세 위험물
	"HZ_stone": {"engine": "jump", "title": "⚠️ 돌부리 뛰어넘기", "how_to": "길에 돌이 굴러와요! [점프!]를 눌러 넘어가세요. 2번 걸리면 넘어져서 HP가 깎여요.", "thing": "stone", "count": 5, "speed": 1.0},
	"HZ_puddle": {"engine": "jump", "title": "⚠️ 물웅덩이 건너뛰기", "how_to": "물웅덩이가 줄줄이! 타이밍 맞춰 [점프!]. 2번 빠지면 발이 젖고 HP가 깎여요.", "thing": "puddle", "count": 5, "speed": 0.9},
	"HZ_dog": {"engine": "dodge", "title": "⚠️ 사나운 개 피하기", "how_to": "개가 달려와요! ◀ ▶로 다른 길로 피하세요. 2번 부딪히면 HP가 깎여요.", "thing": "dog", "time": 9.0, "speed": 1.0},
	# 유딩
	"KID_ball": {"engine": "dodge", "title": "피구공 피하기", "how_to": "친구들이 던지는 공을 ◀ ▶로 피하세요! 2번 맞으면 아웃.", "thing": "ball", "time": 9.0, "speed": 0.85},
	"KID_rope": {"engine": "jump", "title": "꼬마 줄넘기", "how_to": "줄이 발밑에 올 때 [점프!]. 5번 넘으면 성공!", "thing": "rope", "count": 5, "speed": 0.8},
	# 초딩
	"ELEM_spell": {"engine": "quiz", "title": "받아쓰기 시험", "how_to": "맞춤법이 맞는 쪽을 골라요. 4문제 중 3개 이상 맞히면 통과!", "bank": "spell"},
	"ELEM_rubber": {"engine": "jump", "title": "고무줄놀이", "how_to": "고무줄이 다가오면 [점프!]. 갈수록 빨라져요!", "thing": "rubber", "count": 6, "speed": 1.0},
	# 중딩
	"MID_math": {"engine": "quiz", "title": "엄마 앞 수학 쪽지시험", "how_to": "암산으로 답을 골라요. 4문제 중 3개 이상!", "bank": "math"},
	# 고딩
	"HIGH_eyes": {"engine": "dodge", "title": "선생님 눈빛 피하기", "how_to": "야자 시간, 부장 선생님 손전등을 ◀ ▶로 피해 몰래 교실 밖으로!", "thing": "light", "time": 10.0, "speed": 1.15},
	"HIGH_csat": {"engine": "quiz", "title": "모의고사 찍기 신공", "how_to": "남은 4문제! 정답을 골라요. 3개 이상이면 통과.", "bank": "csat"},
	# 대학생
	"UNIV_quiz": {"engine": "quiz", "title": "교양 수업 퀴즈", "how_to": "발표 전에 교수님 깜짝 퀴즈! 3개 이상 맞혀요.", "bank": "univ"},
	# 노인
	"OLD_phone": {"engine": "quiz", "title": "스마트폰 배우기", "how_to": "손녀가 알려 준 대로 골라요. 4개 중 3개 이상!", "bank": "phone"},
	"OLD_pigeon": {"engine": "dodge", "title": "공원 비둘기 떼 피하기", "how_to": "비둘기가 날아와요! ◀ ▶로 피해서 벤치까지.", "thing": "pigeon", "time": 8.0, "speed": 0.8},
}

const BANK := {
	"spell": [["(  ) 하지 마세요", "웬만하면", "왠만하면", 0], ["밥을 (  )", "먹었다", "먹엇다", 0], ["(  ) 좋은 날", "어떻게", "어떡게", 0], ["숙제를 (  )", "안 했다", "않 했다", 0],
		["(  ) 생각", "곰곰이", "곰곰히", 0], ["문을 (  )", "잠갔다", "잠궜다", 0], ["(  ) 맛있다", "되게", "돼게", 0], ["금세 (  )", "왔다", "왓다", 0]],
	"math": [],
	"csat": [["대한민국의 수도는?", "서울", "부산", 0], ["물의 화학식은?", "H₂O", "CO₂", 0], ["1년은 몇 달?", "12달", "10달", 0], ["태양계에서 가장 큰 행성은?", "목성", "화성", 0],
		["'사과'를 영어로?", "apple", "banana", 0], ["삼각형 내각의 합은?", "180도", "360도", 0], ["훈민정음을 만든 왕은?", "세종대왕", "태조", 0], ["빛보다 빠른 것은?", "없다", "소리", 0]],
	"univ": [["조별과제에서 가장 중요한 것은?", "역할 나누기", "잠수 타기", 0], ["레포트 마감 하루 전 할 일은?", "제출하기", "시작하기", 0], ["출석 체크는 언제?", "수업 시작", "종강 후", 0],
		["발표 자료 파일 이름으로 좋은 것은?", "조3_발표_최종", "최최최종_진짜", 0], ["팀원에게 연락이 안 될 때?", "단톡방에 기록 남기기", "혼자 다 하기", 0], ["학점 4.5 만점에서 A+는?", "4.5", "3.0", 0]],
	"phone": [["사진을 보내려면 누르는 것은?", "＋ 버튼", "전원 버튼", 0], ["손녀에게 영상 통화하려면?", "카메라 모양", "계산기", 0], ["글씨를 크게 하려면?", "설정 → 글자 크기", "폰을 흔들기", 0],
		["모르는 번호로 '택배 링크'가 왔다면?", "누르지 않기", "바로 누르기", 0], ["사진을 크게 보려면?", "두 손가락으로 벌리기", "화면을 꾹 누르기", 0], ["배터리가 빨간색이면?", "충전하기", "냉장고에 넣기", 0]],
}

## 수학 문제는 그때그때 만든다
static func quiz_items(bank: String, n := 4) -> Array:
	var out := []
	if bank == "math":
		for i in n:
			var a := randi_range(6, 19)
			var b := randi_range(3, 9)
			var op: String = ["+", "×", "-"][i % 3]
			var ans: int = a + b if op == "+" else (a * b if op == "×" else a - b)
			var wrong: int = ans + [-2, -1, 1, 2, 10][randi() % 5]
			out.append({"q": "%d %s %d = ?" % [a, op, b], "a": [str(ans), str(wrong)], "ok": 0})
	else:
		var src: Array = BANK[bank].duplicate()
		src.shuffle()
		for i in mini(n, src.size()):
			var it: Array = src[i]
			out.append({"q": it[0], "a": [it[1], it[2]], "ok": it[3]})
	for q in out:
		if randi() % 2 == 1:
			q.a = [q.a[1], q.a[0]]
			q.ok = 1 - q.ok
	return out

# ---------- 스테이지 미션 ----------
static func _opt(tactic: String, approach: String, minutes: int, text: String, patience: int, progress: int, reaction: String, emotion: String) -> Dictionary:
	return {"tactic": tactic, "approach": approach, "minutes": minutes, "text": text, "patience": patience, "progress": progress, "reaction": reaction, "emotion": emotion}

static func _mg(line: String, emotion: String, id: String, minutes := 10) -> Dictionary:
	return {"line": line, "emotion": emotion, "observations": [], "minigame": {"id": id, "progress": {"great": 25, "normal": 15, "fail": 0}, "failPatience": -12, "minutes": minutes}}

static func _talk(line: String, emotion: String, opts: Array) -> Dictionary:
	return {"line": line, "emotion": emotion, "observations": [], "options": opts}

static func _mission(id: String, d: Dictionary) -> Dictionary:
	var base := {"id": id, "level": 1, "observations": [], "conditions": ["🎯 미션 게이지 100 채우기", "😤 상대 인내심이 바닥나지 않게", "⏰ 마감 시간 전에"]}
	base.merge(d, true)
	return base

static func missions() -> Dictionary:
	return {
		"ST_KID": _mission("ST_KID", {"chapter": "1단계 · 유딩 (6살)", "title": "간식 하나 더 작전", "patienceLabel": "선생님 인내심", "clearTitle": "간식 두 개 획득!",
			"mission": "김 선생님께 오늘 간식(초코 우유)을 하나 더 받아 내기", "npcName": "김 선생님", "npcRole": "햇님반 담임", "intro": "간식 시간! 초코 우유가 딱 하나 남았다. 저걸 꼭 마시고 싶다...",
			"startClock": 10 * 60, "deadline": 11 * 60 + 10, "patienceStart": 60, "mult": 0.8,
			"beats": [
				_talk("자, 햇님반 친구들~ 간식은 *한 사람에 하나씩*이에요!", "HAPPY", [
					_opt("yield", "착한 어린이", 10, "네에~ 선생님 말씀 잘 들을게요!", 10, 5, "어머, 우리 친구 오늘 의젓하네~", "HAPPY"),
					_opt("push", "솔직하게 조르기", 5, "선생님, 저 초코 우유 진짜진짜 좋아해요! 하나 더 마시면 안 돼요?", 0, 30, "음~ 그럼 선생님 부탁 하나 들어줄래?", "SUSPECT"),
					_opt("push", "떼쓰기", 5, "싫어 싫어! 지금 하나 더 줘요! 으아앙!", -25, 10, "울면 간식 없어요! *뚝!*", "ANGRY")]),
				_mg("그럼 마당에서 피구 한 판 하고 오면 생각해 볼게요~", "HAPPY", "KID_ball"),
				_talk("어머, 땀 흘렸네. 그런데 다른 친구들도 우유 더 먹고 싶대요.", "SUSPECT", [
					_opt("yield", "양보하기", 10, "그럼... 친구랑 반씩 나눠 먹을래요.", 15, 10, "와~ 나눌 줄도 알고! 선생님 감동이야.", "HAPPY"),
					_opt("push", "공정하게 제안", 5, "그럼 줄넘기 제일 잘하는 사람이 먹는 거 어때요?", 5, 30, "오호, 좋은 생각인데? 해 볼까?", "HAPPY"),
					_opt("push", "고자질", 5, "민준이는 아까 몰래 과자 먹었어요!", -20, 5, "친구 일러바치는 건 나빠요.", "ANGRY")]),
				_mg("자, 줄넘기 시합! 제일 많이 넘는 친구가 우유 주인공~", "HAPPY", "KID_rope"),
				_talk("와~ 잘했어요! 그럼 이 우유는...", "NORMAL", [
					_opt("yield", "얌전히 기다리기", 5, "(두 손 모으고 기다린다)", 10, 15, "착하게 기다렸으니 네 거!", "HAPPY"),
					_opt("push", "고맙다고 인사", 5, "선생님 최고! 사랑해요! 내일도 말 잘 들을게요!", 5, 25, "호호, 그 말 잊지 마요~ 자, 초코 우유!", "HAPPY"),
					_opt("push", "낚아채기", 3, "(우유를 잽싸게 낚아챈다)", -30, 0, "얘야! 그러면 안 돼요!", "ANGRY")]),
			],
			"endings": {"S": "초코 우유 두 개! 선생님 칭찬 스티커까지 받았다. 인생 첫 협상 성공.", "A": "우유 하나 더 획득! 입가에 초코 수염이 생겼다.", "B": "반쪽이지만 더 마셨다. 그것도 승리다.",
				"F_patience": "생각하는 의자에 앉게 되었다... 다음엔 떼쓰지 말자.", "F_time": "간식 시간이 끝나 버렸다. 우유는 다른 친구 차지.", "F_progress": "선생님은 웃기만 하고 우유는 주지 않았다."}}),
		"ST_ELEM": _mission("ST_ELEM", {"chapter": "2단계 · 초딩 (10살)", "title": "받아쓰기 재시험 작전", "patienceLabel": "선생님 인내심", "clearTitle": "재시험 기회 획득!",
			"mission": "받아쓰기 40점... 최 선생님께 재시험 기회를 받아 내기", "npcName": "최 선생님", "npcRole": "3학년 2반 담임", "intro": "받아쓰기 시험지에 빨간 비가 내렸다. 이대로 집에 가면 엄마한테 혼난다!",
			"startClock": 13 * 60, "deadline": 14 * 60 + 10, "patienceStart": 55, "mult": 0.9,
			"beats": [
				_talk("받아쓰기 40점이네. 집에서 *연습* 안 했지?", "SUSPECT", [
					_opt("yield", "인정하기", 10, "...네. 게임하느라 못 했어요. 죄송해요.", 10, 5, "솔직해서 좋네. 그래도 점수는 점수야.", "NORMAL"),
					_opt("push", "재시험 부탁", 5, "선생님, 한 번만 다시 볼 수 있을까요? 이번엔 진짜 자신 있어요!", 0, 30, "흠... 그럼 지금 몇 개만 다시 볼래?", "SUSPECT"),
					_opt("push", "핑계 대기", 5, "연필이 이상해서 글씨가 잘못 써졌어요!", -25, 5, "연필 탓이라고? 허허.", "ANGRY")]),
				_mg("좋아, 그럼 지금 바로 몇 문제만 다시 불러 줄게.", "NORMAL", "ELEM_spell"),
				_talk("오, 아까보다 낫네. 그래도 재시험은 다른 친구들한테 공평하지 않잖니?", "SUSPECT", [
					_opt("yield", "남아서 공부", 15, "그럼 방과 후에 남아서 더 연습할게요.", 15, 10, "그 마음이면 충분해.", "HAPPY"),
					_opt("push", "모두에게 기회", 5, "그럼 반 친구들 다 재시험 기회를 주시면 어때요? 다들 좋아할 거예요!", 5, 30, "오호... 반 전체를 위한 제안이라니 대견한데?", "HAPPY"),
					_opt("push", "엄마 핑계", 5, "이 점수 보면 엄마가 저 집에서 쫓아낼 거예요!", -15, 10, "그건 엄마랑 얘기할 문제고...", "SUSPECT")]),
				_mg("그럼 쉬는 시간에 고무줄놀이 한 판 하고 와. 기분 좋아야 공부도 잘 되지!", "HAPPY", "ELEM_rubber"),
				_talk("좋아. 재시험은 금요일. 대신 조건이 있어.", "NORMAL", [
					_opt("yield", "무조건 OK", 5, "뭐든 할게요!", 10, 15, "매일 열 문장씩 연습해 오기!", "HAPPY"),
					_opt("push", "약속하기", 5, "매일 받아쓰기 연습하고 알림장에 엄마 사인 받아 올게요!", 5, 25, "좋아, 약속! 금요일에 보자.", "HAPPY"),
					_opt("push", "흥정하기", 3, "그럼 숙제도 하나 빼 주세요!", -25, 0, "어디서 그런 협상을 배웠니?!", "ANGRY")]),
			],
			"endings": {"S": "재시험에서 100점! 칭찬 도장 다섯 개를 받았다.", "A": "재시험 기회 획득! 이번 주는 맞춤법 공부다.", "B": "겨우 재시험 기회를 얻었다. 휴...",
				"F_patience": "선생님이 엄마에게 전화를 거셨다... 끝났다.", "F_time": "종이 울려 버렸다. 시험지는 그대로 가방 속으로.", "F_progress": "40점은 40점이었다."}}),
		"ST_MID": _mission("ST_MID", {"chapter": "3단계 · 중딩 (15살)", "title": "학원 땡땡이 수습 작전", "patienceLabel": "엄마 인내심", "clearTitle": "엄마와 협상 성공!",
			"mission": "PC방 가려다 학원 앞에서 엄마와 딱 마주쳤다. 혼나지 않고 넘어가기", "npcName": "엄마", "npcRole": "우리 집 최종 보스", "intro": "학원 끝나고 PC방 가려는데... 학원 앞에 엄마가 서 있다.",
			"startClock": 15 * 60, "deadline": 16 * 60 + 10, "patienceStart": 50, "mult": 1.0,
			"beats": [
				_talk("너 지금 어디 가니? *학원 가방*은 왜 들고 반대로 가?", "ANGRY", [
					_opt("yield", "사과부터", 10, "엄마 죄송해요. PC방 가려고 했어요.", 10, 5, "...솔직하긴 하네. 그래서?", "SUSPECT"),
					_opt("push", "계획 설명", 5, "숙제는 다 했고, 딱 한 시간만 친구랑 놀고 공부하려고 했어요.", 0, 30, "숙제를 다 했다고? 진짜야?", "SUSPECT"),
					_opt("push", "버럭하기", 5, "아 몰라! 나도 좀 쉬자고!", -25, 5, "너 말버릇이 그게 뭐야!", "ANGRY")]),
				_mg("그럼 숙제 다 했는지 엄마가 확인해 볼게. 여기서 바로 풀어 봐.", "SUSPECT", "MID_math"),
				_talk("수학은 좀 하네. 근데 요즘 성적 떨어진 건 어떻게 설명할래?", "SUSPECT", [
					_opt("yield", "반성하기", 15, "제가 요즘 좀 놀았어요. 이번 주말엔 집에서 공부할게요.", 15, 10, "그래, 그 말 믿어 볼게.", "NORMAL"),
					_opt("push", "계획표 보여 주기", 5, "그래서 시험 계획표 만들었어요. 이거 보세요, 매일 두 시간씩!", 5, 30, "어머, 이런 것도 만들었어? 웬일이니.", "HAPPY"),
					_opt("push", "비교 반격", 5, "엄마는 학교 다닐 때 공부 다 잘했어?", -20, 5, "그 얘기가 지금 왜 나와!", "ANGRY")]),
				_mg("(학원 자습실... 졸음이 쏟아진다. 엄마가 창밖에서 보고 있다!)", "SUSPECT", "MG_402"),
				_talk("그래, 오늘은 봐줄게. 대신...", "NORMAL", [
					_opt("yield", "다 할게요", 5, "엄마 말 다 들을게요.", 10, 15, "PC방은 주말에 한 시간만!", "HAPPY"),
					_opt("push", "협상하기", 5, "시험 끝나면 PC방 두 시간, 그 대신 지금부터 핸드폰은 엄마한테 맡길게요!", 5, 25, "...딜. 약속 지켜.", "HAPPY"),
					_opt("push", "문 쾅", 3, "(방문을 쾅 닫는 상상을 하며 노려본다)", -30, 0, "너 이번 달 용돈 없어!", "ANGRY")]),
			],
			"endings": {"S": "엄마가 치킨을 시켜 주셨다. 사춘기 외교 대성공.", "A": "혼나지 않고 넘어갔다! 주말 PC방 확정.", "B": "잔소리는 들었지만 용돈은 지켰다.",
				"F_patience": "용돈 압수... 핸드폰도 압수...", "F_time": "학원 선생님까지 나오셨다. 상황 종료.", "F_progress": "엄마는 끝까지 믿어 주지 않았다."}}),
		"ST_HIGH": _mission("ST_HIGH", {"chapter": "4단계 · 고딩 (18살)", "title": "야자 빼기 작전", "patienceLabel": "부장쌤 인내심", "clearTitle": "야자 공식 열외!",
			"mission": "오늘 저녁 동생 생일! 강 부장 선생님께 야간 자율학습을 빼 달라고 하기", "npcName": "강 부장 선생님", "npcRole": "학생부장 (별명: 손전등)", "intro": "오늘은 동생 생일. 야자를 빼야 하는데 상대는 학교에서 제일 무서운 부장 선생님이다.",
			"startClock": 16 * 60 + 30, "deadline": 17 * 60 + 40, "patienceStart": 45, "mult": 1.1,
			"beats": [
				_talk("야자를 빼 달라고? 고3이 *정신이 있나*?", "ANGRY", [
					_opt("yield", "고개 숙이기", 10, "죄송합니다... 그래도 꼭 드릴 말씀이 있어서요.", 10, 5, "...말해 봐.", "SUSPECT"),
					_opt("push", "이유 말하기", 5, "오늘 동생 생일이라 가족끼리 저녁 먹기로 했습니다. 오늘 하루만 부탁드립니다.", 0, 30, "가족 일이라... 증거 있나?", "SUSPECT"),
					_opt("push", "인권 주장", 5, "야자는 자율인데 왜 강제로 하나요?", -25, 10, "자율이라고? 그 말 다시 해 봐!", "ANGRY")]),
				_mg("일단 가서 자습실 정리하고 와. (몰래 빠져나가는 애들 단속 중이다!)", "SUSPECT", "HIGH_eyes"),
				_talk("빼 주면 다른 애들도 다 빼 달라고 할 텐데?", "SUSPECT", [
					_opt("yield", "대신 남기", 15, "그럼 내일 아침 일찍 와서 자습할게요.", 15, 10, "흠, 그 정도 각오면...", "NORMAL"),
					_opt("push", "성적 보여 주기", 5, "지난 모의고사보다 30점 올랐습니다. 내일 더 열심히 하겠습니다!", 5, 30, "오, 30점? 이건 인정해야겠는데.", "HAPPY"),
					_opt("push", "다른 반 들먹이기", 5, "3반은 담임쌤이 그냥 빼 주시던데요?", -20, 5, "남 얘기는 하지 마!", "ANGRY")]),
				_mg("좋아, 그럼 이 문제들 다 맞히면 보내 주지.", "NORMAL", "HIGH_csat"),
				_talk("...좋아. 대신 조건이 있다.", "NORMAL", [
					_opt("yield", "따르겠습니다", 5, "말씀만 하세요!", 10, 15, "내일 영단어 50개 시험!", "HAPPY"),
					_opt("push", "약속과 인사", 5, "내일 야자는 끝까지 남겠습니다. 감사합니다, 선생님!", 5, 25, "그래, 동생 생일 축하한다고 전해라.", "HAPPY"),
					_opt("push", "튀기", 3, "(대답도 없이 가방을 들고 뛴다)", -30, 0, "거기 서!!!", "ANGRY")]),
			],
			"endings": {"S": "부장쌤이 케이크값까지 보태 주셨다. 전설로 남을 날.", "A": "야자 열외! 동생 생일 파티에 늦지 않았다.", "B": "겨우 허락받았다. 내일은 영단어 지옥.",
				"F_patience": "반성문 3장... 생일 파티는 영상 통화로.", "F_time": "야자 종이 울렸다. 이미 늦었다.", "F_progress": "부장쌤 마음은 끝내 열리지 않았다."}}),
		"ST_UNIV": _mission("ST_UNIV", {"chapter": "5단계 · 대학생 (22살)", "title": "조별과제 무임승차 잡기", "patienceLabel": "민수 인내심", "clearTitle": "조원 전원 참여!",
			"mission": "연락 두절이던 조원 민수가 카페에 나타났다. 발표 자료를 나눠 맡게 하기", "npcName": "민수", "npcRole": "조원 (잠수 3주 차)", "intro": "발표까지 이틀. 3주째 연락이 없던 민수가 카페에 왔다. 오늘 꼭 역할을 나눠야 한다.",
			"startClock": 14 * 60, "deadline": 15 * 60 + 20, "patienceStart": 55, "mult": 1.1,
			"beats": [
				_talk("아 미안미안~ 요즘 *좀 바빠서*. 근데 내가 뭐 하면 돼?", "HAPPY", [
					_opt("yield", "괜찮다고 하기", 10, "괜찮아, 바쁠 수 있지. 지금부터 같이 하자.", 10, 5, "역시 착하다~ 그럼 난 뭐 하지?", "HAPPY"),
					_opt("push", "역할 정하기", 5, "자료 조사 3장이랑 발표 대본을 맡아 줘. 내일 밤 12시까지.", 0, 30, "어... 3장이나? 생각보다 많네.", "SUSPECT"),
					_opt("push", "공개 저격", 5, "너 3주 동안 뭐 했어? 이름 빼 버린다?", -25, 10, "아니 왜 이렇게 날카로워...", "ANGRY")]),
				_mg("일단 교수님 퀴즈부터 대비하자. 발표 끝나고 질문이 나온대.", "NORMAL", "UNIV_quiz"),
				{"line": "근데 나 단톡방에서 아무 말도 못 들었는데? 역할 나눈 거 *처음 듣는데*?", "emotion": "SUSPECT", "observations": [],
					"objection": {"evidence": [{"id": "EV_CHAT", "name": "단톡방 공지 캡처", "icon": "💬", "desc": "3주 전 '민수: 자료 조사 맡을게~' 메시지와 읽음 표시"},
						{"id": "EV_MENU", "name": "카페 메뉴판", "icon": "☕", "desc": "아이스 아메리카노 4,500원"},
						{"id": "EV_SYLLABUS", "name": "강의계획서", "icon": "📄", "desc": "조별 발표 비중 30%"}],
						"correctId": "EV_CHAT", "shout": "잠깐만!", "playerLine": "3주 전에 네가 직접 '자료 조사 맡을게~'라고 썼어. 읽음 표시도 있고!",
						"successLine": "...아, 그거 나였구나. 미안, 진짜 할게.", "failLine": "이게 지금 무슨 상관인데? 나 갈래.", "progressBase": 30, "progressAccuracy": 0, "failPatience": -25, "minutes": 5}},
				_mg("(카페가 붐빈다. 주문 받는 알바가 바빠 보여서 잠깐 돕기로 했다!)", "HAPPY", "MG_702"),
				_talk("알았어, 알았어. 내일까지 자료 조사랑 대본 할게.", "NORMAL", [
					_opt("yield", "믿어 주기", 5, "고마워. 믿을게!", 10, 15, "응응, 걱정 마~", "HAPPY"),
					_opt("push", "중간 점검 약속", 5, "그럼 내일 저녁 8시에 중간 점검하자. 공유 문서에 바로 써 줘!", 5, 25, "오케이, 8시! 이번엔 진짜야.", "HAPPY"),
					_opt("push", "협박하기", 3, "안 하면 교수님께 다 말한다.", -25, 0, "...그래, 마음대로 해.", "ANGRY")]),
			],
			"endings": {"S": "민수가 밤새 자료를 만들어 왔다. 조별과제 A+!", "A": "역할 분담 성공! 발표 준비가 순조롭다.", "B": "겨우 일을 나눴다. 반은 내가 하게 될 것 같지만.",
				"F_patience": "민수는 단톡방을 나갔다...", "F_time": "카페 마감 시간. 결국 내가 다 하기로...", "F_progress": "민수는 '응응'만 반복했다."}}),
		"ST_OLD": _mission("ST_OLD", {"chapter": "7단계 · 노인 (70살)", "title": "손녀와 영상 통화 배우기", "patienceLabel": "하린이 인내심", "clearTitle": "스마트 할아버지(할머니) 등극!",
			"mission": "놀러 온 손녀 하린이에게 스마트폰 영상 통화를 배워서 혼자 걸어 보기", "npcName": "하린", "npcRole": "초등학생 손녀", "intro": "공원 벤치. 손녀가 '이제 영상 통화는 혼자 하셔야 해요!' 하고 선생님이 되었다.",
			"startClock": 15 * 60, "deadline": 16 * 60 + 10, "patienceStart": 65, "mult": 0.8,
			"beats": [
				_talk("할머니(할아버지)! 이번엔 *꼭* 혼자 해 보셔야 돼요!", "HAPPY", [
					_opt("yield", "그냥 해 달라고 하기", 10, "하린이가 해 주면 안 되겠니?", 5, 0, "안 돼요~ 이번엔 혼자!", "SUSPECT"),
					_opt("push", "의욕 보이기", 5, "좋다! 이 할미(할비)가 오늘 꼭 배운다. 하나씩 알려 다오.", 5, 30, "우와 멋지다! 자, 먼저 이거 보세요.", "HAPPY"),
					_opt("push", "옛날 얘기", 5, "우리 때는 편지로도 다 됐어!", -20, 5, "할머니(할아버지)~ 그 얘기 백 번 들었어요!", "ANGRY")]),
				_mg("자, 제가 문제 낼게요. 맞혀 보세요!", "HAPPY", "OLD_phone"),
				_talk("잘하시네요! 근데 아까 누르신 거 광고였어요...", "PANIC", [
					_opt("yield", "다시 배우기", 15, "허허, 그럼 처음부터 다시 알려 다오.", 15, 10, "괜찮아요, 천천히 해요~", "HAPPY"),
					_opt("push", "메모하기", 5, "(수첩을 꺼내) 하린아, 순서를 여기 적어 다오. 그대로 따라 하마.", 5, 30, "오, 수첩! 할머니(할아버지) 진짜 학생 같아요!", "HAPPY"),
					_opt("push", "폰 탓하기", 5, "이 놈의 기계가 이상한 거야!", -20, 5, "폰은 잘못 없어요...", "SUSPECT")]),
				_mg("(비둘기 떼가 벤치 쪽으로 몰려온다! 폰을 지켜야 한다!)", "PANIC", "OLD_pigeon"),
				_talk("이제 엄마한테 영상 통화 걸어 보세요!", "NORMAL", [
					_opt("yield", "하린이 손 빌리기", 5, "같이 눌러 보자꾸나.", 10, 15, "한 번만 같이 해요!", "HAPPY"),
					_opt("push", "혼자 걸기", 5, "(카메라 버튼을 꾹) ...여보세요? 얘야, 보이니?", 5, 25, "우와! 성공이에요! 엄마 얼굴 나왔다!", "HAPPY"),
					_opt("push", "전화 대신 문자", 3, "그냥 문자로 '전화해라' 보내면 되지 않니?", -25, 0, "그건 영상 통화가 아니잖아요~", "ANGRY")]),
			],
			"endings": {"S": "가족 단톡방에 셀카까지 올렸다. 스마트 어르신 탄생!", "A": "영상 통화 성공! 손녀가 박수를 쳐 주었다.", "B": "반은 손녀가 눌렀지만, 그래도 통화는 됐다.",
				"F_patience": "하린이가 '내일 다시 해요...' 하고 한숨을 쉬었다.", "F_time": "해가 졌다. 오늘 수업은 여기까지.", "F_progress": "화면에는 계속 내 콧구멍만 나왔다."}}),
	}
