## 전역 상태: 데이터, 저장, 나이 스테이지, 오늘의 운세.
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
		"owned": [], "dayFlags": [], "flags": [], "pos": null, "hp": 100, "status": "", "statusUntil": 0, "bandages": 0, "fortuneSeen": 0, "stage": 0, "lifeDone": 0}

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

# ---------- 나이 스테이지 ----------
func stage_index() -> int:
	return clampi(int(w().get("stage", 0)), 0, Stages.LIST.size() - 1)

func stage() -> Dictionary:
	return Stages.get_stage(stage_index())

## 스테이지 옷차림을 입힌다 (옷장에서 산 것은 그 뒤에 다시 갈아입을 수 있다)
func apply_outfit() -> void:
	var look: Dictionary = w().look
	var o: Dictionary = stage().outfit
	for k in o:
		look[k] = o[k]
	if not o.has("hair") and look.get("hair") == "#dddddd":
		look.hair = Pix.DEFAULT_LOOK.hair
	w().level = stage_index() + 1

## 스테이지를 깨면 한 단계 나이를 먹는다. 마지막(노인)까지 깨면 true.
func age_up() -> bool:
	var s := w()
	if stage_index() >= Stages.LIST.size() - 1:
		s.lifeDone = int(s.get("lifeDone", 0)) + 1
		s.stage = 0
		apply_outfit()
		persist()
		return true
	s.stage = stage_index() + 1
	apply_outfit()
	persist()
	return false

func active_name() -> String:
	if save.personaId == null or save.personaId == "REAL":
		return "나"
	for p in data.personas:
		if p.id == save.personaId:
			return p.name
	return "나"

static func zodiac_kr(year: int) -> int:
	return posmod(year - 1900, 12)

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
	return Stages.get_stage(lv - 1).title

static func clock_text(m: int) -> String:
	return "%02d:%02d" % [int(m / 60) % 24, m % 60]

static func won(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if n < 0 else "") + s + out + "원"

## 돈을 받는다 (레벨은 나이 스테이지로만 오른다. 돌려주는 값은 늘 0)
func reward(money: int, _xp: int, why: String) -> int:
	var s := w()
	s.money += money
	toast.emit(why + (" +" + won(money) if money else ""), "good")
	persist()
	return 0

func set_battery(v: float) -> void:
	save.battery = clampi(roundi(v), 0, 100)
	persist()
