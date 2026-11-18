## MG_402 집에 가고 싶은 본능 억제: 연타로 '이불 속 상상'을 밀어내고, 빨개지면 손을 뗀다.
extends "res://scripts/minigames/mg_base.gd"

var pos := 0.3
var warn_until := 0.0
var next_warn := 0.0
var caught_warn := 0
var t0 := 0.0
var canvas: Control
var btn: Button

func _init() -> void:
	title = "집에 가고 싶은 본능 억제"
	how_to = "연타해서 '이불 속 상상' 말풍선을 밀어내세요. 화면이 빨개지면(상대가 눈치채는 중!) 손을 떼고 미소 유지!"
	time_sec = 8

func start() -> void:
	canvas = UI.full(Control.new())
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	btn = big_button("꾹 참기! (연타)")
	btn.pressed.connect(_tap)
	control.add_child(btn)
	t0 = now()
	next_warn = 2 + randf()
	_loop()

func _tap() -> void:
	if finished:
		return
	if now() < warn_until:
		pos += 0.1
		caught_warn += 1
		Sfx.play("bad")
	else:
		pos -= 0.07
		Sfx.play("blip", 1.3)
	pos = maxf(0, pos)

func _loop() -> void:
	var last := now()
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(canvas):
			return
		var n := now()
		var dt := minf(0.05, n - last)
		last = n
		var el := n - t0
		var left := time_sec - el
		var warning := n < warn_until
		if not warning and el >= next_warn:
			warn_until = n + 1.5
			next_warn = el + 2.7 + randf() * 1.2
			Sfx.play("stamp")
		pos += ((0.22 if hostile else 0.18) * (0.25 if warning else 1.0)) * dt
		btn.text = "✋ 손 떼고 미소 유지!" if warning else "꾹 참기! (연타)"
		set_timer(left)
		goal_label.text = "버티기!"
		canvas.queue_redraw()
		if pos >= 1:
			finish("fail")
		elif left <= 0:
			finish("great" if caught_warn == 0 and pos < 0.5 else "normal")

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	var warning := now() < warn_until
	canvas.draw_rect(Rect2(Vector2.ZERO, canvas.size), Color("#5a1a2a") if warning else Color("#2d3047"))
	var line_y := H * 0.16
	for x in range(0, int(W), 12):
		canvas.draw_rect(Rect2(x, line_y, 6, 2), UI.PINK)
	canvas.draw_string(UI.font, Vector2(8, line_y - 6), "본심 폭발선", HORIZONTAL_ALIGNMENT_LEFT, -1, 11, UI.PINK)
	var face := Vector2(W / 2, H - 20)
	var e := "PANIC" if warning else ("CRY" if pos > 0.7 else "HAPPY")
	Pix.draw_portrait(canvas, Game.w().look, e, false, false, 2, face.x - 64, face.y - 128)
	var by := lerpf(face.y - 150, line_y + 10, pos)
	var s := 0.7 + pos * 0.4
	var bw := 190 * s
	var bh := 44 * s
	var r := Rect2(W / 2 - bw / 2, by - bh, bw, bh)
	canvas.draw_rect(r.grow(2), UI.INK)
	canvas.draw_rect(r, Color(1, 1, 1, 0.5 + pos * 0.5))
	canvas.draw_string(UI.font, r.position + Vector2(8, bh / 2 + 5), "이불... 넷플릭스... 집...", HORIZONTAL_ALIGNMENT_LEFT, bw - 12, int(12 * s) + 1, UI.INK)
	if warning:
		canvas.draw_string(UI.font, Vector2(W / 2 - 70, H * 0.45), "상대가 눈치채는 중!", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, UI.YELLOW)
