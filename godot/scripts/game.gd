## 전역 상태: 데이터, 저장, 성향 궁합, 오늘의 운세.
extends Node

signal changed  # 돈·시간·HP 등 HUD에 보일 값이 바뀜
signal toast(text: String, tone: String)

const SAVE_PATH := "user://save.json"
const U := 16.0

var data: Dictionary
var world: Dictionary
var grid: PackedByteArray
var save: Dictionary = {}

func _ready() -> void:
	data = _json("res://assets/data/game.json")
	world = _json("res://assets/data/world.json")
	grid = PackedByteArray(world.grid)
	load_save()

func _json(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	return JSON.parse_string(f.get_as_text())

# ---------- 저장 ----------
func empty_save() -> Dictionary:
	return {"v": 2, "realProfile": null, "personaId": null, "battery": 100, "best": {}, "world": null, "muted": false}

func new_world() -> Dictionary:
	return {"day": 1, "clock": 7 * 60 + 30, "level": 1, "xp": 0, "money": 5000, "look": Pix.DEFAULT_LOOK.duplicate(),
		"owned": [], "dayFlags": [], "flags": [], "pos": null, "hp": 100, "status": "", "statusUntil": 0, "bandages": 0, "fortuneSeen": 0}

func load_save() -> void:
	save = empty_save()
	if FileAccess.file_exists(SAVE_PATH):
		var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
		var d = JSON.parse_string(f.get_as_text())
		if d is Dictionary:
			for k in d:
				save[k] = d[k]

func persist() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	f.store_string(JSON.stringify(save))
	changed.emit()

func clear_save() -> void:
	save = empty_save()
	persist()

func w() -> Dictionary:
	if save.world == null:
		save.world = new_world()
	return save.world

func has_flag(f: String) -> bool:
	return w().flags.has(f)

func day_flag(f: String) -> bool:
	return w().dayFlags.has(f)

func add_day_flag(f: String) -> void:
	if not w().dayFlags.has(f):
		w().dayFlags.append(f)

# ---------- 프로필 ----------
func active_profile():
	if save.personaId == null or save.personaId == "REAL":
		return save.realProfile
	for p in data.personas:
		if p.id == save.personaId:
			return p.profile
	return save.realProfile

func active_name() -> String:
	if save.personaId == null or save.personaId == "REAL":
		return "나"
	for p in data.personas:
		if p.id == save.personaId:
			return p.name
	return "나"

const SIGN_START := [[3, 21], [4, 20], [5, 21], [6, 22], [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22], [1, 20], [2, 19]]
const ELEMENTS4 := ["FIRE", "EARTH", "AIR", "WATER"]
const GEN_ORDER := ["BOOM", "X", "M", "Z", "ALPHA"]

static func zodiac_kr(year: int) -> int:
	return posmod(year - 1900, 12)

static func sign_index(m: int, d: int) -> int:
	var best := 9
	var best_key := -1
	var key := m * 100 + d
	for i in SIGN_START.size():
		var k: int = SIGN_START[i][0] * 100 + SIGN_START[i][1]
		if k <= key and k > best_key:
			best_key = k
			best = i
	return best

static func gen_of(y: int) -> String:
	if y <= 1964: return "BOOM"
	if y <= 1979: return "X"
	if y <= 1994: return "M"
	if y <= 2009: return "Z"
	return "ALPHA"

static func derive(p: Dictionary) -> Dictionary:
	var s := sign_index(int(p.birthMonth), int(p.birthDay))
	return {"zodiacKr": zodiac_kr(int(p.birthYear)), "sign": s, "element": ELEMENTS4[s % 4], "gen": gen_of(int(p.birthYear))}

func describe(p: Dictionary) -> String:
	var d := derive(p)
	return "%s · %s형 · %s년생 %s띠 · %s" % [p.mbti, p.blood, str(int(p.birthYear)).substr(2), data.zodiacKr[d.zodiacKr], data.signs[d.sign]]

# ---------- 궁합 ----------
const MBTI_SHEET := {
	"INFP>ESTJ": [-15, 1.5, "대환장 상극"], "INFP>ENFJ": [15, 0.8, "천생연분"], "ENFP>INTJ": [15, 0.9, "환상 보완"],
	"ENFP>ISTJ": [-12, 1.4, "현실 충돌"], "INTP>ENTJ": [12, 0.9, "전략 파트너"], "INTP>ESFJ": [-10, 1.4, "기빨림 주의"],
	"INFJ>ENTP": [15, 0.9, "지적 인력"], "INFJ>ESTP": [-12, 1.4, "극과 극 긴장"], "ISFP>ENTJ": [-15, 1.5, "멘탈 위기"],
	"ISFP>ESFJ": [12, 0.9, "평화로운 합"], "ISTP>ESTJ": [10, 1.0, "일처리 최강"], "ISTP>ENFJ": [-10, 1.3, "온도차 주의"],
	"ISFJ>ESTP": [12, 0.9, "상호 보완"], "ISTJ>ESFP": [-12, 1.4, "극한의 인내"], "ESTP>INFP": [-14, 1.4, "화성 금성"],
}
const MBTI_COMPLEMENT := ["ENFP-INTJ", "ENTP-INFJ", "ESFP-ISTJ", "ESTP-ISFJ", "INFP-ENFJ", "INTP-ENTJ"]
const BLOOD_TABLE := {
	"A>A": [6, 1.05, "예의바른 눈치전"], "A>B": [-8, 1.2, "직설 충돌"], "A>O": [8, 0.9, "안정 조화"], "A>AB": [4, 1.05, "차분한 문서형"],
	"B>A": [-8, 1.3, "직구 화법 주의보"], "B>B": [6, 0.95, "스파크 튀는 텐션"], "B>O": [6, 1.0, "텐션 폭발"], "B>AB": [10, 0.9, "호기심 공명"],
	"O>A": [8, 0.9, "리더 케어"], "O>B": [8, 0.9, "유쾌한 행동파"], "O>O": [4, 1.15, "자존심과 의리 사이"], "O>AB": [-6, 1.25, "친근감 vs 사생활"],
	"AB>A": [6, 0.95, "합리적 평화"], "AB>B": [8, 0.9, "마이웨이 존중"], "AB>O": [-6, 1.1, "온도차 조율"], "AB>AB": [10, 0.8, "스마트 무간섭"],
}
const GEN_SHEET := {"Z>X": [-12, 1.3, "세대 장벽"], "M>X": [-5, 1.1, "중간관리 조율"], "M>Z": [-8, 1.2, "후배 코칭"], "M>ALPHA": [-10, 1.3, "눈높이 육아"], "Z>BOOM": [-15, 1.4, "격세대 소통"]}
const WONJIN := [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]]
const LAYERS := ["MBTI", "BLOOD", "GEN", "ZODIAC_KR", "WEST"]
const LAYER_NAME := {"MBTI": "성격유형", "BLOOD": "혈액형", "GEN": "세대", "ZODIAC_KR": "띠", "WEST": "별자리"}

static func _dir(table: Dictionary, a: String, b: String):
	if table.has(a + ">" + b): return table[a + ">" + b]
	if table.has(b + ">" + a): return table[b + ">" + a]
	return null

static func mbti_compat(a: String, b: String) -> Array:
	var s = _dir(MBTI_SHEET, a, b)
	if s != null: return s
	if MBTI_COMPLEMENT.has(a + "-" + b) or MBTI_COMPLEMENT.has(b + "-" + a): return [15, 0.85, "환상 보완"]
	if a == b: return [5, 1.0, "거울 같은 사이"]
	var diff := 0
	for i in [1, 2, 3]:
		if a[i] != b[i]: diff += 1
	if diff == 3: return [-12, 1.4, "대화 핀트 어긋남"]
	if a[2] == b[2] and a[3] == b[3]: return [8, 0.9, "비즈니스 시너지"]
	return [0, 1.0, "무난"]

static func gen_compat(a: String, b: String) -> Array:
	var s = _dir(GEN_SHEET, a, b)
	if s != null: return s
	var dist := absi(GEN_ORDER.find(a) - GEN_ORDER.find(b))
	if dist == 0: return [5, 0.95, "같은 세대 공감"]
	if dist == 1: return [-5, 1.1, "한 세대 차이"]
	if dist == 2: return [-10, 1.25, "두 세대 차이"]
	return [-15, 1.4, "격세대 소통"]

static func zodiac_compat(a: int, b: int) -> Array:
	var diff := absi(a - b)
	var d := mini(diff, 12 - diff)
	if a == b: return [3, 1.0, "같은 띠"]
	if d == 4: return [15, 0.85, "삼합"]
	if d == 6: return [-15, 1.4, "상충살"]
	if (a + b) % 12 == 1: return [10, 0.9, "육합"]
	for p in WONJIN:
		if (p[0] == a and p[1] == b) or (p[0] == b and p[1] == a): return [-12, 1.3, "원진살"]
	return [0, 1.0, "무난"]

static func element_compat(a: String, b: String) -> Array:
	if a == b: return [5, 0.95, "같은 원소"]
	var pair := [a, b]
	pair.sort()
	match "-".join(pair):
		"AIR-FIRE": return [10, 0.9, "불과 공기 상생"]
		"EARTH-WATER": return [10, 0.9, "흙과 물 상생"]
		"FIRE-WATER": return [-10, 1.3, "불과 물 상극"]
		"AIR-EARTH": return [-8, 1.2, "흙과 공기 충돌"]
	return [0, 1.0, "무난"]

static func compute_compat(player: Dictionary, npc: Dictionary, level: int) -> Dictionary:
	var pd := derive(player)
	var nd := derive(npc)
	var all := {
		"MBTI": mbti_compat(player.mbti, npc.mbti),
		"BLOOD": BLOOD_TABLE[player.blood + ">" + npc.blood],
		"GEN": gen_compat(pd.gen, nd.gen),
		"ZODIAC_KR": zodiac_compat(pd.zodiacKr, nd.zodiacKr),
		"WEST": element_compat(pd.element, nd.element),
	}
	var layers := []
	var fsum := 0.0
	var msum := 0.0
	for i in clampi(level, 1, 5):
		var L: String = LAYERS[i]
		var e: Array = all[L]
		layers.append({"layer": L, "favor": e[0], "mult": e[1], "label": e[2]})
		fsum += e[0]
		msum += e[1] - 1.0
	return {"layers": layers, "initFavor": int(clampf(50 + fsum, 20, 80)), "batteryMult": snappedf(clampf(1 + msum, 0.6, 2.0), 0.01)}

# ---------- 오늘의 운세 (태어난 해 천간 오행 vs 오늘 일진 오행) ----------
const STEMS := ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const STEMS_HANJA := ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
const BRANCHES := ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const BRANCHES_HANJA := ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
const ELEMENTS5 := ["목", "화", "토", "금", "수"]
const ELEMENT5_HANJA := ["木", "火", "土", "金", "水"]
const ELEMENT5_COLOR := ["#43a047", "#e53935", "#c08a3e", "#9e9e9e", "#1e88e5"]
const HAZARD := {
	"stone": {"name": "돌", "title": "오늘은 돌을 조심하세요", "text": "길 위의 돌에 발이 걸리면 하루가 꼬입니다. 돌 근처로 가지 마세요. 걸리면 HP가 깎이고 한동안 절뚝거려요."},
	"puddle": {"name": "물웅덩이", "title": "오늘은 물을 조심하세요", "text": "젖은 발은 기운을 빼앗습니다. 물웅덩이를 밟으면 HP와 배터리가 깎이고 발이 무거워져요."},
	"dog": {"name": "개", "title": "오늘은 개를 조심하세요", "text": "짖는 소리에 크게 놀랄 운입니다. 돌아다니는 개에게 가까이 가면 HP가 깎이고 한동안 정신이 없어요."},
}
const LUCKY_COLORS := ["빨강", "노랑", "초록", "파랑", "보라", "하양", "검정", "주황"]
const DIRS := ["동쪽", "서쪽", "남쪽", "북쪽"]

static func hash32(n: int) -> int:
	var x := (n * 2654435761) & 0xffffffff
	x ^= x >> 16
	x = (x * 2246822507) & 0xffffffff
	x ^= x >> 13
	return x & 0xffffffff

func fortune_for(p: Dictionary, day: int) -> Dictionary:
	var seed := int(p.birthMonth) * 31 + int(p.birthDay)
	var idx := (day - 1 + seed) % 60
	var stem := idx % 10
	var branch := idx % 12
	var me: int = posmod(int(p.birthYear) - 4, 10) / 2
	var today: int = stem / 2
	var h := hash32(day * 977 + seed * 13 + int(p.birthYear))
	var hz := ["stone", "puddle", "dog"]
	var f := {"day": day, "pillar": "%s(%s)·%s(%s) 일" % [STEMS[stem], STEMS_HANJA[stem], BRANCHES[branch], BRANCHES_HANJA[branch]], "pillarHanja": STEMS_HANJA[stem] + BRANCHES_HANJA[branch] + "日",
		"me": me, "today": today, "hazard": "", "hazardCount": 0, "buff": "",
		"luckyColor": LUCKY_COLORS[h % LUCKY_COLORS.size()], "luckyDir": DIRS[(h >> 5) % 4]}
	if (today + 1) % 5 == me:
		f.merge({"luck": "great", "relation": "오늘의 %s 기운이 나의 %s 기운을 살려 줘요" % [ELEMENTS5[today], ELEMENTS5[me]], "buff": "light",
			"title": "발걸음이 가벼운 날", "text": "귀인의 기운이 함께해요. 하루 종일 걸음이 빨라지고, 다쳐도 금방 회복돼요."}, true)
	elif (me + 2) % 5 == today:
		f.merge({"luck": "good", "relation": "나의 %s 기운이 오늘의 %s 기운을 다스려요 (재물운)" % [ELEMENTS5[me], ELEMENTS5[today]], "buff": "coins",
			"title": "재물운이 들어오는 날", "text": "출근길에 반짝이는 동전이 흩어져 있어요. 주우면 용돈이 돼요! 다만 작은 돌부리 몇 개는 조심하세요.",
			"hazard": "stone", "hazardCount": 8}, true)
	elif (today + 2) % 5 == me:
		var k: String = hz[(branch + h % 3) % 3]
		f.merge({"luck": "bad", "relation": "오늘의 %s 기운이 나의 %s 기운을 누르는 날" % [ELEMENTS5[today], ELEMENTS5[me]],
			"hazard": k, "hazardCount": 40, "title": HAZARD[k].title, "text": HAZARD[k].text}, true)
	elif (me + 1) % 5 == today:
		var k: String = hz[h % 3]
		f.merge({"luck": "soso", "relation": "나의 %s 기운이 오늘의 %s 기운으로 흘러 나가요" % [ELEMENTS5[me], ELEMENTS5[today]],
			"hazard": k, "hazardCount": 18, "buff": "calm", "title": "무난한 날, %s만 살짝 조심" % HAZARD[k].name,
			"text": "크게 좋지도 나쁘지도 않아요. 기운이 조금 빠지니 무리하지 말고, %s만 조심하면 돼요." % HAZARD[k].name}, true)
	else:
		var k: String = hz[(h >> 3) % 3]
		f.merge({"luck": "soso", "relation": "오늘은 나와 같은 %s 기운의 날" % ELEMENTS5[me],
			"hazard": k, "hazardCount": 14, "title": "평범하고 편안한 날",
			"text": "익숙한 기운이라 마음이 편해요. 늘 하던 대로 하면 돼요. %s은(는) 조금만 조심하세요." % HAZARD[k].name}, true)
	f.grade = {"great": "대길 大吉", "good": "길 吉", "soso": "평 平", "bad": "흉 凶"}[f.luck]
	return f

func today_fortune() -> Dictionary:
	var p = active_profile()
	if p == null:
		p = {"birthYear": 1995, "birthMonth": 1, "birthDay": 1}
	# 운세는 '진짜 나'의 사주로 본다 (페르소나는 가면일 뿐)
	if save.realProfile != null:
		p = save.realProfile
	return fortune_for(p, int(w().day))

## 날마다 같은 자리에 놓이도록 하는 난수
func seeded(day: int, salt: int) -> RandomNumberGenerator:
	var r := RandomNumberGenerator.new()
	r.seed = hash32(day * 7919 + salt) + 1
	return r

# ---------- 성장 ----------
static func xp_to_next(level: int) -> int:
	return 100 * level

func level_title(lv: int) -> String:
	return data.levelTitle[mini(lv, data.levelTitle.size() - 1)]

static func clock_text(m: int) -> String:
	return "%02d:%02d" % [int(m / 60) % 24, m % 60]

static func won(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if n < 0 else "") + s + out + "원"

## 레벨업이 있으면 올라간 레벨을 돌려준다 (없으면 0)
func reward(money: int, xp: int, why: String) -> int:
	var s := w()
	s.money += money
	s.xp += xp
	var up := 0
	while s.xp >= xp_to_next(s.level):
		s.xp -= xp_to_next(s.level)
		s.level += 1
		up = s.level
	var bits := []
	if money: bits.append("+" + won(money))
	if xp: bits.append("+%dXP" % xp)
	toast.emit(why + " " + " ".join(bits), "good")
	persist()
	return up

func set_battery(v: float) -> void:
	save.battery = clampi(roundi(v), 0, 100)
	persist()
