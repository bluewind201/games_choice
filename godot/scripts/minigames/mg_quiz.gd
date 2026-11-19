## 빨리 고르기 엔진: 문제 4개, 두 개 중 맞는 쪽을 고른다. 한 문제에 6초.
## cfg: title, how_to, bank (Stages.BANK 이름 또는 "math")
extends "res://scripts/minigames/mg_base.gd"

var bank := "spell"
var items: Array = []
var i := 0
var right := 0
var q_label: Label
var btns: Array = []
var marks: Label
var q_until := 0.0
var lock := false
const PER_Q := 6.0

func configure(cfg: Dictionary) -> void:
	title = cfg.title
	how_to = cfg.how_to
	bank = cfg.get("bank", "spell")
	time_sec = PER_Q * 4

func start() -> void:
	items = Stages.quiz_items(bank, 4)
	var box := PanelContainer.new()
	box.add_theme_stylebox_override("panel", UI.box(UI.PAPER, UI.INK, 3, 14, 4))
	box.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	box.custom_minimum_size = Vector2(300, 170)
	box.offset_left = -150
	box.offset_right = 150
	box.offset_top = -100
	box.offset_bottom = 100
	play.add_child(box)
	var v := UI.vbox(12)
	box.add_child(v)
	marks = UI.label("", 16, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER, false)
	v.add_child(marks)
	q_label = UI.label("", 20, UI.INK, HORIZONTAL_ALIGNMENT_CENTER)
	q_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	q_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	v.add_child(q_label)
	for k in 2:
		var b := big_button("", 62)
		b.pressed.connect(func(): _answer(k))
		control.add_child(b)
		btns.append(b)
	_show()
	_loop()

func _show() -> void:
	var q: Dictionary = items[i]
	q_label.text = q.q
	for k in 2:
		btns[k].text = ("① " if k == 0 else "② ") + q.a[k]
		btns[k].disabled = false
	q_until = now() + PER_Q
	lock = false
	goal_label.text = "%d / %d" % [i + 1, items.size()]
	var m := ""
	for k in items.size():
		m += ("⭕" if items[k].get("res") == true else ("❌" if items[k].get("res") == false else "▫️")) + " "
	marks.text = m

func _answer(k: int) -> void:
	if finished or lock:
		return
	lock = true
	var q: Dictionary = items[i]
	var ok: bool = k == int(q.ok)
	q.res = ok
	if ok:
		right += 1
		Sfx.play("good")
		flash(true)
	else:
		Sfx.play("bad")
		flash(false)
		btns[int(q.ok)].text += "  ← 정답"
	for b in btns:
		b.disabled = true
	await root.get_tree().create_timer(0.6 if ok else 1.1).timeout
	if finished:
		return
	i += 1
	if i >= items.size():
		finish("great" if right == items.size() else ("normal" if right >= items.size() - 1 else "fail"))
	else:
		_show()

func _loop() -> void:
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(q_label):
			return
		var left := q_until - now()
		set_timer(left, 2.0)
		if left <= 0 and not lock:
			_answer(-1)
