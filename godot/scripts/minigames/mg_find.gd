## MG_602 갑자기 조용해진 진짜 이유 찾기: 단서를 골라 [제시!]
extends "res://scripts/minigames/mg_base.gd"

const SPOTS := [
	{"id": "phone", "icon": "📱", "label": "휴대폰 화면: \"방탈출 9시 타임 마감 임박!\"", "correct": true},
	{"id": "menu", "icon": "📖", "label": "파스타 메뉴판", "correct": false},
	{"id": "watch", "icon": "⌚", "label": "손목시계 (8시 10분)", "correct": false},
	{"id": "bubble", "icon": "💬", "label": "\"괜찮아요\"", "correct": false},
]
var selected := ""
var t0 := 0.0
var btns := {}
var present: Button

func _init() -> void:
	title = "진짜 이유 찾기"
	how_to = "상대가 \"괜찮아요\"라고 한 진짜 이유를 찾아 고른 뒤 [제시!]를 누르세요. 말풍선을 믿으면 안 돼요!"
	time_sec = 15

func start() -> void:
	goal_label.text = "단서 1개"
	var grid := GridContainer.new()
	grid.columns = 2
	UI.full(grid)
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	play.add_child(grid)
	var sh := SPOTS.duplicate()
	sh.shuffle()
	for s in sh:
		var b := UI.button("%s\n%s" % [s.icon, s.label], Callable(), "normal", 12)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.size_flags_vertical = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func():
			Sfx.play("pick")
			selected = s.id
			present.disabled = false
			for k in btns:
				btns[k].add_theme_stylebox_override("normal", UI.box(UI.YELLOW if k == s.id else Color.WHITE, UI.INK, 2, 7, 3)))
		btns[s.id] = b
		grid.add_child(b)
	present = big_button("제시!")
	present.disabled = true
	present.pressed.connect(func():
		var ok := selected == "phone"
		_end(("great" if now() - t0 <= 7 else "normal") if ok else "fail"))
	control.add_child(present)
	t0 = now()
	_loop()

func _end(r: String) -> void:
	if finished:
		return
	present.disabled = true
	btns.phone.add_theme_stylebox_override("normal", UI.box(UI.MINT, UI.INK, 3, 7, 3))
	if r == "fail":
		goal_label.text = "정답은 휴대폰 화면!"
		if selected != "" and selected != "phone":
			btns[selected].add_theme_stylebox_override("normal", UI.box(Color("#ffb3c1"), UI.INK, 2, 7, 3))
	finished = true
	await root.get_tree().create_timer(1.6 if r == "fail" else 0.5).timeout
	done.emit(r)

func _loop() -> void:
	while not finished:
		await root.get_tree().process_frame
		var left := time_sec - (now() - t0)
		set_timer(left)
		if left <= 0:
			_end("fail")
