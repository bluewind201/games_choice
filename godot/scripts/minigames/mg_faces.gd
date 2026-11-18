## MG_703 표정 읽기: 말과 표정이 다를 때 진짜 기분을 고른다.
extends "res://scripts/minigames/mg_base.gd"

const PEOPLE := [
	{"hair": "#7a3e1d", "shirt": "#ff6b81", "hairStyle": "pony"},
	{"skin": "#e8b98c", "hair": "#555", "shirt": "#2d3047", "glasses": "round", "hairStyle": "part", "tie": true},
	{"skin": "#f6d2b0", "hair": "#c47f3d", "shirt": "#ffd166", "hairStyle": "long"},
	{"skin": "#d9a77c", "hair": "#222", "shirt": "#2e8b57", "hat": "cap", "hatColor": "#2e8b57"},
	{"hair": "#e2445c", "shirt": "#fff", "hat": "beanie", "hatColor": "#ffd166"},
]
const ROUNDS := [["괜찮아요, 진짜 괜찮아요.", "CRY"], ["아~ 그거 재밌겠네요.", "SUSPECT"], ["아니 전혀 안 바빠요!", "PANIC"], ["네, 좋은 의견이네요.", "ANGRY"],
	["별로 기대 안 했어요.", "HAPPY"], ["저 원래 이런 거 안 좋아해요.", "HAPPY"], ["하하, 농담도 잘하시네요.", "ANGRY"]]
const LABEL := {"HAPPY": "😄 사실 신남", "NORMAL": "🙂 평소대로", "PANIC": "😳 사실 당황", "ANGRY": "😠 사실 화남", "SUSPECT": "🤨 사실 의심", "CRY": "😢 사실 서운"}
const OPTIONS := ["HAPPY", "PANIC", "ANGRY", "SUSPECT", "CRY"]
var rounds: Array = []
var i := 0
var score := 0
var deadline := 0.0
var locked := false
var per := 3.0
var portrait: PortraitView
var say: Label
var grid: HBoxContainer

func _init() -> void:
	title = "표정 읽기"
	how_to = "말은 믿지 마세요! 얼굴을 보고 상대의 진짜 기분을 골라요. 5명, 한 명당 3초!"
	time_sec = 3

func start() -> void:
	per = 2.5 if hostile else 3.0
	var v := UI.vbox(10)
	UI.full(v)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	play.add_child(v)
	portrait = PortraitView.new({}, 3)
	portrait.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(portrait)
	say = UI.label("", 15, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	v.add_child(say)
	grid = UI.hbox(6)
	control.add_child(grid)
	rounds = ROUNDS.duplicate()
	rounds.shuffle()
	rounds = rounds.slice(0, 5)
	goal_label.text = "0 / 0"
	_show()
	_loop()

func _show() -> void:
	locked = false
	var r: Array = rounds[i]
	portrait.set_look(Pix.full_look(PEOPLE[i % PEOPLE.size()]))
	portrait.set_emotion(r[1])
	say.text = "\"%s\"" % r[0]
	var opts := OPTIONS.duplicate()
	opts.shuffle()
	opts = opts.slice(0, 3)
	if not opts.has(r[1]):
		opts[randi() % 3] = r[1]
	for c in grid.get_children():
		c.queue_free()
	for o in opts:
		var b := UI.button(LABEL[o], func(): _answer(o), "normal", 11)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.custom_minimum_size = Vector2(0, 54)
		grid.add_child(b)
	deadline = now() + per

func _answer(pick: String) -> void:
	if locked or finished:
		return
	locked = true
	var ok: bool = pick == rounds[i][1]
	if ok: score += 1
	flash(ok)
	Sfx.play("good" if ok else "bad")
	say.text = "정답! 눈치 만렙" if ok else "땡! 진짜 기분: " + LABEL[rounds[i][1]]
	i += 1
	goal_label.text = "%d / %d" % [score, i]
	await root.get_tree().create_timer(0.8).timeout
	if i >= rounds.size():
		finish("great" if score >= 5 else ("normal" if score >= 3 else "fail"))
	else:
		_show()

func _loop() -> void:
	while not finished:
		await root.get_tree().process_frame
		var left := deadline - now()
		if locked:
			timer_label.text = "-"
		else:
			set_timer(left, 1)
			if left <= 0:
				_answer("")
