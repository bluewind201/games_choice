## 피하기 엔진: 위에서 내려오는 것(개·피구공·손전등·비둘기)을 세 줄 사이로 ◀ ▶ 움직여 피한다.
## cfg: title, how_to, thing, time, speed
extends "res://scripts/minigames/mg_base.gd"

var thing := "ball"
var speed := 1.0
var canvas: Control
var lane := 1
var lane_x := 1.0
var objs: Array = []  # {lane, y}
var hits := 0
var next_spawn := 0.0
var hurt_until := 0.0
var t0 := 0.0
const PY := 0.82

func configure(cfg: Dictionary) -> void:
	title = cfg.title
	how_to = cfg.how_to
	thing = cfg.get("thing", "ball")
	speed = float(cfg.get("speed", 1.0))
	time_sec = float(cfg.get("time", 9.0))

func start() -> void:
	speed *= 1.15 if hostile else 1.0
	canvas = UI.full(Control.new())
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	var row := UI.hbox(8)
	var l := big_button("◀ 왼쪽", 70)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	l.pressed.connect(func(): _move(-1))
	var r := big_button("오른쪽 ▶", 70)
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	r.pressed.connect(func(): _move(1))
	row.add_child(l)
	row.add_child(r)
	control.add_child(row)
	t0 = now()
	next_spawn = t0 + 0.6
	_loop()

func _move(d: int) -> void:
	if finished:
		return
	lane = clampi(lane + d, 0, 2)
	Sfx.play("blip", 1.2 + lane * 0.1)

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
		if Input.is_action_just_pressed("ui_left"): _move(-1)
		if Input.is_action_just_pressed("ui_right"): _move(1)
		lane_x = move_toward(lane_x, lane, dt * 9)
		if n >= next_spawn and left > 1.0:
			var free := [0, 1, 2]
			var a: int = free[randi() % 3]
			objs.append({"lane": a, "y": -0.08, "hit": false})
			# 가끔 두 줄을 한꺼번에 막는다 (한 줄은 늘 비워 둔다)
			if el > 3 and randf() < 0.35:
				free.erase(a)
				objs.append({"lane": free[randi() % 2], "y": -0.08, "hit": false})
			next_spawn = n + randf_range(0.55, 0.9) / speed
		var v := (0.55 + el * 0.02) * speed
		for o in objs:
			o.y += v * dt
			if not o.hit and absf(o.y - PY) < 0.05 and o.lane == lane:
				o.hit = true
				hits += 1
				hurt_until = n + 0.35
				Sfx.play("bark" if thing == "dog" else "hurt")
				flash(false)
		objs = objs.filter(func(o): return o.y < 1.15 and not o.hit)
		goal_label.text = "버티기! ♥%d" % (2 - hits)
		set_timer(left)
		canvas.queue_redraw()
		if hits >= 2:
			finish("fail")
		elif left <= 0:
			finish("great" if hits == 0 else "normal")

func _draw_obj(x: float, y: float, W: float) -> void:
	match thing:
		"dog":
			canvas.draw_set_transform(Vector2(x, y), 0, Vector2(3, 3))
			Pix.draw_dog(canvas, 0, 6, 2, int(now() * 8) % 2, true)
			canvas.draw_set_transform(Vector2.ZERO)
		"ball":
			canvas.draw_circle(Vector2(x, y), 17, UI.INK)
			canvas.draw_circle(Vector2(x, y), 15, Color("#ff4f6d"))
			canvas.draw_rect(Rect2(x - 15, y - 2, 30, 4), Color("#fff6e0"))
		"light":
			var pts := PackedVector2Array([Vector2(x - 8, y - 70), Vector2(x + 8, y - 70), Vector2(x + 34, y + 18), Vector2(x - 34, y + 18)])
			canvas.draw_colored_polygon(pts, Color(1, 0.95, 0.5, 0.55))
			canvas.draw_rect(Rect2(x - 9, y - 80, 18, 12), UI.INK)
			canvas.draw_rect(Rect2(x - 7, y - 78, 14, 8), Color("#ffd166"))
		"pigeon":
			var f := int(now() * 10) % 2
			canvas.draw_rect(Rect2(x - 12, y - 6, 24, 12), UI.INK)
			canvas.draw_rect(Rect2(x - 10, y - 4, 20, 8), Color("#9aa3b5"))
			canvas.draw_rect(Rect2(x - 22, y - 10 + f * 8, 12, 5), Color("#7a8396"))
			canvas.draw_rect(Rect2(x + 10, y - 10 + f * 8, 12, 5), Color("#7a8396"))
			canvas.draw_rect(Rect2(x - 4, y + 4, 8, 4), Color("#5b8f6a"))

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	var bg: Color = {"dog": Color("#b8b2a6"), "ball": Color("#e8d29a"), "light": Color("#2a2140"), "pigeon": Color("#7cc46a")}.get(thing, Color("#b8b2a6"))
	canvas.draw_rect(Rect2(Vector2.ZERO, canvas.size), bg)
	var lw := W / 3.0
	for i in range(1, 3):
		for y in range(0, int(H), 24):
			var yy := fmod(y + now() * 160 * speed, H)
			canvas.draw_rect(Rect2(lw * i - 2, yy, 4, 12), Color(1, 1, 1, 0.35))
	if thing == "light":
		for i in 3:
			canvas.draw_rect(Rect2(lw * i + lw / 2 - 26, H * 0.2, 52, 18), Color("#4a3d70"))
	for o in objs:
		_draw_obj(lw * o.lane + lw / 2, o.y * H, W)
	var px := lw * lane_x + lw / 2
	var py := H * PY + 40
	var s := 5.0
	var look: Dictionary = Game.w().look if Game.w() else Pix.DEFAULT_LOOK
	Pix.draw_character(canvas, look, px / s, py / s, 1, int(now() * 8) % 2, true, s)
	if now() < hurt_until:
		canvas.draw_rect(Rect2(px - 36, py - 96, 72, 96), Color(1, 0.2, 0.3, 0.35))
