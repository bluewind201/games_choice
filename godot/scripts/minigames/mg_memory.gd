## MG_702 주문 기억하기 (카페 알바): 주문을 잠깐 보여 준 뒤 같은 순서로 누른다.
extends "res://scripts/minigames/mg_base.gd"

const MENU := [["☕", "아메리카노"], ["🧋", "버블티"], ["🥐", "크루아상"], ["🍰", "케이크"], ["🍵", "녹차"], ["🧃", "주스"]]
var customer := 0
var perfect := 0
var seq: Array = []
var typed: Array = []
var btns: Array = []
var order_label: Label
var input_label: Label
var face: PortraitView
var t0 := 0.0
const LOOKS := [{"hair": "#7a3e1d", "shirt": "#ff6b81", "hairStyle": "pony"}, {"hair": "#222", "shirt": "#2e8b57", "glasses": "round"}, {"hair": "#c47f3d", "shirt": "#ffd166", "hairStyle": "long"}]

func _init() -> void:
	title = "주문 기억하기"
	how_to = "손님이 주문을 빠르게 말해요. 주문이 사라지면 같은 순서로 메뉴를 누르세요. 손님 3명!"
	time_sec = 30

func start() -> void:
	var v := UI.vbox(8)
	UI.full(v)
	play.add_child(v)
	face = PortraitView.new(Pix.full_look(LOOKS[0]), 2)
	face.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(face)
	order_label = UI.label("", 26, UI.YELLOW, HORIZONTAL_ALIGNMENT_CENTER)
	v.add_child(order_label)
	input_label = UI.label("", 22, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER)
	v.add_child(input_label)
	var grid := GridContainer.new()
	grid.columns = 3
	control.add_child(grid)
	for i in MENU.size():
		var b := UI.button("%s\n%s" % MENU[i], Callable(), "normal", 12)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.custom_minimum_size = Vector2(0, 54)
		b.disabled = true
		b.pressed.connect(func(): _press(i))
		btns.append(b)
		grid.add_child(b)
	t0 = now()
	_loop()
	_next()

func _set_btns(on: bool) -> void:
	for b in btns:
		b.disabled = not on

func _next() -> void:
	if customer >= 3:
		return finish("great" if perfect == 3 else ("normal" if perfect >= 2 else "fail"))
	var n := 3 + customer + (1 if hostile else 0)
	seq = []
	for i in n:
		seq.append(randi() % MENU.size())
	typed = []
	face.set_look(Pix.full_look(LOOKS[customer]))
	face.set_emotion("NORMAL")
	goal_label.text = "손님 %d/3" % (customer + 1)
	input_label.text = ""
	_set_btns(false)
	order_label.text = ""
	face.talking = true
	for i in seq.size():
		await root.get_tree().create_timer(0.42).timeout
		if finished: return
		order_label.text += MENU[seq[i]][0]
		Sfx.play("blip")
	face.talking = false
	await root.get_tree().create_timer(1.1).timeout
	if finished: return
	order_label.text = "주문을 순서대로!"
	_set_btns(true)

func _press(k: int) -> void:
	if finished: return
	var p := typed.size()
	typed.append(k)
	var ok: bool = seq[p] == k
	input_label.text += MENU[k][0]
	Sfx.play("pick" if ok else "bad")
	if not ok:
		_set_btns(false)
		face.set_emotion("ANGRY")
		var ans := ""
		for x in seq: ans += MENU[x][0]
		order_label.text = "정답 " + ans
		customer += 1
		await root.get_tree().create_timer(1.3).timeout
		_next()
	elif typed.size() == seq.size():
		_set_btns(false)
		perfect += 1
		face.set_emotion("HAPPY")
		Sfx.play("good")
		customer += 1
		await root.get_tree().create_timer(0.7).timeout
		_next()

func _loop() -> void:
	while not finished:
		await root.get_tree().process_frame
		var left := time_sec - (now() - t0)
		set_timer(left, 5)
		if left <= 0:
			finish("normal" if perfect >= 2 else "fail")
