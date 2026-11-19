## 뛰어넘기 엔진: 오른쪽에서 다가오는 것(돌·물웅덩이·줄·고무줄)을 [점프!]로 넘는다.
## cfg: title, how_to, thing, count(넘어야 할 개수), speed
extends "res://scripts/minigames/mg_base.gd"

var thing := "stone"
var need := 5
var speed := 1.0
var canvas: Control
var obs: Array = []  # {x(0~1), passed}
var spawned := 0
var passed := 0
var hits := 0
var jump_t := -10.0
var next_spawn := 0.0
var hurt_until := 0.0
var t0 := 0.0
const PX := 0.24
const JUMP := 0.62

func configure(cfg: Dictionary) -> void:
	title = cfg.title
	how_to = cfg.how_to
	thing = cfg.get("thing", "stone")
	need = int(cfg.get("count", 5))
	speed = float(cfg.get("speed", 1.0))
	time_sec = 6.0 + need * 1.9 / speed

func start() -> void:
	speed *= 1.15 if hostile else 1.0
	canvas = UI.full(Control.new())
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	var b := big_button("⬆️ 점프!", 72)
	b.pressed.connect(_jump)
	control.add_child(b)
	t0 = now()
	next_spawn = t0 + 0.8
	_loop()

func _jump() -> void:
	if finished or now() - jump_t < JUMP:
		return
	jump_t = now()
	Sfx.play("blip", 1.4)

func _air() -> float:
	var k := (now() - jump_t) / JUMP
	return 0.0 if k < 0 or k > 1 else sin(k * PI)

func _loop() -> void:
	var last := now()
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(canvas):
			return
		var n := now()
		var dt := minf(0.05, n - last)
		last = n
		var left := time_sec - (n - t0)
		if spawned < need and n >= next_spawn:
			obs.append({"x": 1.08, "passed": false})
			spawned += 1
			# 갈수록 간격이 좁아진다
			next_spawn = n + randf_range(0.95, 1.55) / speed * (1.0 - 0.04 * passed)
		var v := 0.42 * speed * (1.0 + 0.05 * passed)
		for o in obs:
			o.x -= v * dt
			if not o.passed and o.x < PX + 0.035 and o.x > PX - 0.05:
				if _air() < 0.35:
					o.passed = true
					hits += 1
					hurt_until = n + 0.35
					Sfx.play("hurt")
					flash(false)
			elif not o.passed and o.x <= PX - 0.05:
				o.passed = true
				passed += 1
				Sfx.play("coin", 1.2)
		obs = obs.filter(func(o): return o.x > -0.2)
		goal_label.text = "%d / %d" % [mini(passed, need), need]
		set_timer(left)
		canvas.queue_redraw()
		if hits >= 2:
			finish("fail")
		elif passed + hits >= need and obs.is_empty():
			finish("great" if hits == 0 else ("normal" if passed >= need - 1 else "fail"))
		elif left <= 0:
			finish("normal" if hits <= 1 and passed >= need - 1 else "fail")

func _draw_thing(x: float, gy: float) -> void:
	match thing:
		"stone":
			canvas.draw_rect(Rect2(x - 15, gy - 14, 30, 14), UI.INK)
			canvas.draw_rect(Rect2(x - 13, gy - 12, 26, 12), Color("#8a8f99"))
			canvas.draw_rect(Rect2(x - 9, gy - 18, 18, 6), UI.INK)
			canvas.draw_rect(Rect2(x - 7, gy - 16, 14, 6), Color("#a8adb8"))
			canvas.draw_rect(Rect2(x - 4, gy - 14, 4, 2), Color("#d0d4dc"))
		"puddle":
			canvas.draw_rect(Rect2(x - 26, gy - 4, 52, 6), UI.INK)
			canvas.draw_rect(Rect2(x - 24, gy - 3, 48, 4), Color("#5aa0e6"))
			canvas.draw_rect(Rect2(x - 12, gy - 2, 10, 1), Color("#cfe8ff"))
		"rope":
			canvas.draw_rect(Rect2(x - 2, gy - 40, 4, 40), Color("#ff4f6d"))
			canvas.draw_rect(Rect2(x - 3, gy - 6, 6, 6), UI.INK)
		"rubber":
			canvas.draw_rect(Rect2(x - 22, gy - 18, 44, 3), Color("#ffd166"))
			canvas.draw_rect(Rect2(x - 24, gy - 36, 3, 36), UI.INK)
			canvas.draw_rect(Rect2(x + 21, gy - 36, 3, 36), UI.INK)

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	var gy := H * 0.72
	var sky := Color("#8fd3ff") if thing != "rope" and thing != "rubber" else Color("#ffe9b0")
	canvas.draw_rect(Rect2(Vector2.ZERO, canvas.size), sky)
	# 멀리 있는 집들이 천천히 흐른다
	var scroll := fmod(now() * 30 * speed, 80.0)
	for i in 7:
		var bx := i * 80 - scroll
		canvas.draw_rect(Rect2(bx, gy - 90, 56, 90), Color("#c9d6ea") if thing != "rope" else Color("#ffd6e0"))
		canvas.draw_rect(Rect2(bx + 10, gy - 76, 12, 12), Color("#7fa8d9"))
		canvas.draw_rect(Rect2(bx + 32, gy - 76, 12, 12), Color("#7fa8d9"))
	canvas.draw_rect(Rect2(0, gy, W, H - gy), Color("#b8b2a6") if thing != "rope" and thing != "rubber" else Color("#f0c27a"))
	canvas.draw_rect(Rect2(0, gy, W, 3), UI.INK)
	for x in range(0, int(W) + 40, 40):
		canvas.draw_rect(Rect2(x - fmod(now() * 120 * speed, 40.0), gy + 14, 20, 3), Color(1, 1, 1, 0.5))
	for o in obs:
		_draw_thing(o.x * W, gy)
	var s := 5.0
	var px := W * PX
	var py := gy - _air() * 90
	var look: Dictionary = Game.w().look if Game.w() else Pix.DEFAULT_LOOK
	Pix.draw_character(canvas, look, px / s, py / s, 3, int(now() * 8) % 2, _air() == 0.0, s)
	if now() < hurt_until:
		canvas.draw_rect(Rect2(px - 36, py - 96, 72, 96), Color(1, 0.2, 0.3, 0.35))
	for i in 2:
		var hc := UI.PINK if i >= hits else Color("#555")
		canvas.draw_string(UI.font, Vector2(10 + i * 22, 24), "♥", HORIZONTAL_ALIGNMENT_LEFT, -1, 20, hc)
