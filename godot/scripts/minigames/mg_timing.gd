## MG_701 말 끊기 타이밍: 바늘이 초록 구간(상대가 숨 쉬는 순간)에 오면 [지금!]
extends "res://scripts/minigames/mg_base.gd"

const LINES := ["그러니까 내 말은 말이야", "라떼는 이런 거 없었고", "그리고 또 하나 더 있는데", "아 맞다 그 얘기도 해야지", "결론부터 말하자면 서론이"]
var round_i := 0
var hits := 0
var pos := 0.0
var dir := 1.0
var z0 := 0.0
var zw := 0.0
var lock := 0.0
var speed := 0.9
var line := ""
var marks: Array = []
var t0 := 0.0
var canvas: Control

func _init() -> void:
	title = "말 끊기 타이밍"
	how_to = "상대가 숨 쉬는 순간(초록 구간)에 바늘이 오면 [지금!]을 누르세요. 3번 중 2번 성공하면 내 의견을 말할 수 있어요."
	time_sec = 15

func start() -> void:
	speed = 0.9 * speed_factor(npc) * (1.15 if hostile else 1.0)
	canvas = UI.full(Control.new())
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	var b := big_button("✋ 지금!")
	b.pressed.connect(_tap)
	control.add_child(b)
	goal_label.text = "0 / 3"
	_new_round()
	t0 = now()
	_loop()

func _new_round() -> void:
	zw = maxf(0.1, 0.2 - round_i * 0.04)
	z0 = 0.15 + randf() * (0.7 - zw)
	line = LINES[(round_i + randi() % LINES.size()) % LINES.size()] + "..."

func _tap() -> void:
	if finished or lock > now():
		return
	var ok := pos >= z0 and pos <= z0 + zw
	marks.append(ok)
	if ok:
		hits += 1
		line = "(...지금이다!) 저 그 부분에 의견이 있는데요!"
		Sfx.play("good")
	else:
		line = "내 말 아직 안 끝났어!"
		Sfx.play("bad")
	flash(ok)
	round_i += 1
	goal_label.text = "%d / 3" % hits
	lock = now() + 0.7
	await root.get_tree().create_timer(0.7).timeout
	if round_i >= 3:
		finish("great" if hits == 3 else ("normal" if hits == 2 else "fail"))
	else:
		_new_round()

func _loop() -> void:
	var last := now()
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(canvas):
			return
		var n := now()
		var dt := minf(0.05, n - last)
		last = n
		if lock < n:
			pos += dir * speed * (1 + round_i * 0.25) * dt
			if pos > 1: pos = 1; dir = -1
			elif pos < 0: pos = 0; dir = 1
		var left := time_sec - (n - t0)
		set_timer(left)
		canvas.queue_redraw()
		if left <= 0:
			finish("normal" if hits >= 2 else "fail")

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	canvas.draw_rect(Rect2(Vector2.ZERO, canvas.size), Color("#2d3047"))
	Pix.draw_portrait(canvas, Main.inst.npc_look("boss"), "ANGRY", int(now() * 8) % 2 == 0 and lock < now(), false, 2, W / 2 - 64, 10)
	var br := Rect2(12, 150, W - 24, 46)
	canvas.draw_rect(br.grow(2), UI.INK)
	canvas.draw_rect(br, Color.WHITE)
	canvas.draw_string(UI.font, br.position + Vector2(8, 28), line, HORIZONTAL_ALIGNMENT_LEFT, br.size.x - 16, 13, UI.INK)
	var bar := Rect2(20, H * 0.62, W - 40, 26)
	canvas.draw_rect(bar.grow(3), UI.INK)
	canvas.draw_rect(bar, Color("#5a3a4a"))
	canvas.draw_rect(Rect2(bar.position.x + z0 * bar.size.x, bar.position.y, zw * bar.size.x, bar.size.y), Color("#43d39e"))
	var nx := bar.position.x + pos * bar.size.x
	canvas.draw_rect(Rect2(nx - 2, bar.position.y - 8, 4, bar.size.y + 16), UI.YELLOW)
	for i in 3:
		var c := Color(1, 1, 1, 0.3)
		if i < marks.size():
			c = Color("#43d39e") if marks[i] else UI.PINK
		canvas.draw_rect(Rect2(W / 2 - 40 + i * 30, bar.end.y + 20, 18, 18), c)
