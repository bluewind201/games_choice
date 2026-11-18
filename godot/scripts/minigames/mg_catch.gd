## MG_101 날아오는 결재서류 받기: 좌우로 끌어 하얀 기안서를 받고, 빨간 시말서와 커피는 피한다.
extends "res://scripts/minigames/mg_base.gd"

var px := 0.5
var items: Array = []
var caught := 0
var bad_hits := 0
var stun_until := 0.0
var t0 := 0.0
var spawn := 0.0
var total := 10.0
var canvas: Control
var shake := 0.0

func _init() -> void:
	title = "날아오는 결재서류 받기"
	how_to = "좌우로 끌어서(또는 ←→ 키) 하얀 기안서를 받으세요. 빨간 시말서와 커피는 피하세요! 10장 받으면 성공."
	time_sec = 10

func start() -> void:
	total = time_sec + (1.0 if speed_factor(npc) > 1 else 0.0)
	canvas = UI.full(Control.new())
	canvas.mouse_filter = Control.MOUSE_FILTER_STOP
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	canvas.gui_input.connect(func(e):
		if (e is InputEventMouseButton and e.pressed) or e is InputEventMouseMotion or e is InputEventScreenDrag or e is InputEventScreenTouch:
			if now() >= stun_until and canvas.size.x > 0:
				px = clampf(e.position.x / canvas.size.x, 0.07, 0.93))
	control.add_child(UI.label("← 손가락으로 좌우 드래그 →", 12, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER))
	t0 = now()
	_loop()

func _loop() -> void:
	var last := now()
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(canvas):
			return
		var n := now()
		var dt := minf(0.05, n - last)
		last = n
		var left := total - (n - t0)
		var fever := 1.3 if left <= 3 else 1.0
		var H := canvas.size.y
		if n >= stun_until:
			if Input.is_key_pressed(KEY_LEFT) or Input.is_key_pressed(KEY_A): px -= dt * 1.4
			if Input.is_key_pressed(KEY_RIGHT) or Input.is_key_pressed(KEY_D): px += dt * 1.4
			px = clampf(px, 0.07, 0.93)
		spawn += dt
		if spawn >= 0.45:
			spawn = 0
			var bad := randf() < (0.4 if hostile else 0.25)
			items.append({"x": randf_range(0.06, 0.94), "y": -20.0, "v": (H * 0.45 + randf() * H * 0.3) * speed_factor(npc) * fever, "bad": bad, "kind": randi() % 2})
		var py := H * 0.82
		for it in items.duplicate():
			it.y += it.v * dt
			if absf(it.y - py) < 26 and absf(it.x - px) * canvas.size.x < 38:
				items.erase(it)
				if it.bad:
					bad_hits += 1
					stun_until = n + 0.8
					shake = 0.3
					Sfx.play("bad")
				else:
					caught += 1
					Sfx.play("coin", 1.0 + caught * 0.03)
			elif it.y > H + 30:
				items.erase(it)
		shake = maxf(0, shake - dt)
		set_timer(left)
		goal_label.text = "기안서 %d / 10" % caught
		canvas.queue_redraw()
		if caught >= 10:
			finish("great" if left >= 3 or bad_hits == 0 else "normal")
		elif left <= 0:
			finish("fail")

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	var off := Vector2(randf_range(-6, 6) if shake > 0 else 0, 0)
	canvas.draw_rect(Rect2(Vector2.ZERO, canvas.size), Color("#2d3047"))
	for i in 6:
		canvas.draw_rect(Rect2(0, i * H / 6, W, 1), Color(1, 1, 1, 0.05))
	for it in items:
		var p := Vector2(it.x * W, it.y) + off
		if not it.bad:
			canvas.draw_rect(Rect2(p - Vector2(11, 14), Vector2(22, 28)), UI.INK)
			canvas.draw_rect(Rect2(p - Vector2(9, 12), Vector2(18, 24)), Color.WHITE)
			for k in 4:
				canvas.draw_rect(Rect2(p + Vector2(-6, -7 + k * 5), Vector2(12, 2)), Color("#9fb4c7"))
		elif it.kind == 0:
			canvas.draw_rect(Rect2(p - Vector2(11, 14), Vector2(22, 28)), UI.INK)
			canvas.draw_rect(Rect2(p - Vector2(9, 12), Vector2(18, 24)), Color("#e2445c"))
			canvas.draw_rect(Rect2(p + Vector2(-6, -8), Vector2(12, 3)), Color("#ffd166"))
		else:
			canvas.draw_rect(Rect2(p - Vector2(10, 9), Vector2(20, 20)), UI.INK)
			canvas.draw_rect(Rect2(p - Vector2(8, 7), Vector2(16, 16)), Color("#f4f4f4"))
			canvas.draw_rect(Rect2(p - Vector2(8, 7), Vector2(16, 4)), Color("#6b3f1f"))
			canvas.draw_rect(Rect2(p + Vector2(8, -2), Vector2(4, 6)), Color("#f4f4f4"))
	var me := Vector2(px * W, H * 0.82) + off
	var stunned := now() < stun_until
	canvas.draw_set_transform(me + Vector2(0, 18), 0, Vector2(3, 3))
	Pix.draw_character(canvas, Game.w().look, 0, 0, 1 if not stunned else 0, int(now() * 8) % 2, not stunned)
	canvas.draw_set_transform(Vector2.ZERO)
	canvas.draw_rect(Rect2(me.x - 36, me.y + 22, 72, 5), Color(1, 1, 1, 0.6))
	if stunned:
		canvas.draw_string(UI.font, me + Vector2(-8, -50), "@@", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, UI.YELLOW)
