## MG_801 정면 승부: 말이 안 통할 때 상사와 한판. 옆에서 본 도트 격투.
## 상사 기술: 잔소리(말풍선 연타), 버럭(큰 충격파), 서류 던지기. 기술 이름이 먼저 뜨니 읽고 대응한다.
## 내 기술: 🛡️ 방어(맞기 직전에 누르면 '완벽 방어'로 되받아침), 🗯️ 대들기, 💥 사이다 한마디(게이지가 차면).
extends "res://scripts/minigames/mg_base.gd"

const SKILLS := {
	"nag": {"name": "잔소리", "wind": 0.7, "color": Color("#ffd166")},
	"burst": {"name": "버럭!", "wind": 1.0, "color": Color("#ff4f6d")},
	"paper": {"name": "서류 던지기", "wind": 0.8, "color": Color("#bfcaff")},
}
const NAG_WORDS := ["라떼는", "그게 아니고", "다시 해 와", "내 말 들어", "기본이 안 돼"]
const PX := 0.27
const BX := 0.73

var canvas: Control
var hp := 100.0
var boss_hp := 100.0
var meter := 0.0
var t0 := 0.0
var last := 0.0
var speed := 1.0
# 상사 상태: idle → wind(기술 예고) → act → recover(빈틈) → idle
var bstate := "idle"
var bskill := ""
var bstate_until := 0.0
var last_skill := ""
var shots: Array = []
var waves: Array = []
var pops: Array = []
# 나
var guard_from := -10.0
var guard_until := 0.0
var lunge_until := 0.0
var atk_ready := 0.0
var hurt_until := 0.0
var boss_hurt_until := 0.0
var shake := 0.0
var btn_guard: Button
var btn_atk: Button
var btn_sp: Button

func _init() -> void:
	title = "정면 승부!"
	how_to = "말이 안 통해요. 이제는 기세 싸움!\n상사가 [잔소리]·[버럭!]·[서류 던지기]를 쓰기 전에 기술 이름이 먼저 떠요.\n🛡️ 방어: 맞기 직전에 누르면 '완벽 방어'로 되받아쳐요.\n🗯️ 대들기: 잔소리 예고 중이면 말을 끊어요. 버럭 예고 중엔 역효과!\n💥 게이지가 차면 사이다 한마디."
	time_sec = 35

func start() -> void:
	speed = speed_factor(npc) * (1.15 if hostile else 1.0)
	canvas = UI.full(Control.new())
	play.add_child(canvas)
	canvas.draw.connect(_draw)
	var row := UI.hbox(6)
	btn_guard = big_button("🛡️ 방어", 60)
	btn_guard.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn_guard.add_theme_stylebox_override("normal", UI.box(UI.MINT, UI.INK, 2, 7, 3))
	btn_guard.pressed.connect(_guard)
	row.add_child(btn_guard)
	btn_atk = big_button("🗯️ 대들기", 60)
	btn_atk.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn_atk.pressed.connect(_attack)
	row.add_child(btn_atk)
	control.add_child(row)
	btn_sp = big_button("💥 사이다 한마디", 44)
	btn_sp.add_theme_stylebox_override("normal", UI.box(Color("#ffb3c1"), UI.INK, 2, 7, 3))
	btn_sp.disabled = true
	btn_sp.pressed.connect(_special)
	control.add_child(btn_sp)
	t0 = now()
	last = t0
	bstate_until = t0 + 1.2
	_loop()

# ---------- 내 기술 ----------
func _guard() -> void:
	if finished or now() < lunge_until:
		return
	guard_from = now()
	guard_until = now() + 0.55
	Sfx.play("blip_low")

func _attack() -> void:
	var n := now()
	if finished or n < atk_ready:
		return
	atk_ready = n + 0.7
	lunge_until = n + 0.25
	guard_until = 0
	var dmg := 3.0
	var word := "대들기!"
	if bstate == "wind" and bskill == "nag":
		dmg = 12
		word = "말 끊기!"
		_set_boss("recover", 0.9)
		Sfx.play("good")
	elif bstate == "wind" and bskill == "burst":
		# 화난 사람한테 대들면 더 크게 터진다
		word = "역효과!"
		dmg = 2
		_set_boss("act", 0)
		_spawn("burst", 1.35)
		Sfx.play("bad")
	elif bstate == "recover":
		dmg = 12
		word = "빈틈!"
		Sfx.play("stamp")
	else:
		# 아무 때나 대들면 잘 안 먹힌다. 빈틈·말 끊기·완벽 방어를 노릴 것
		dmg = 3
		word = "흥!"
		Sfx.play("blip", 1.3)
	_hit_boss(dmg, word)
	meter = minf(100, meter + (10.0 if dmg >= 12 else 3.0))

func _special() -> void:
	if finished or meter < 100:
		return
	meter = 0
	lunge_until = now() + 0.45
	_hit_boss(30, "사이다!")
	_set_boss("recover", 1.2)
	shots.clear()
	shake = 10
	Sfx.play("levelup")
	flash(true)

func _hit_boss(dmg: float, word: String) -> void:
	boss_hp = maxf(0, boss_hp - dmg)
	boss_hurt_until = now() + 0.2
	pops.append({"text": "%s -%d" % [word, dmg], "x": BX, "y": 0.42, "t": now(), "c": UI.YELLOW})

func _hurt(dmg: float, word := "") -> void:
	hp = maxf(0, hp - dmg)
	hurt_until = now() + 0.3
	shake = 6 if dmg < 15 else 12
	Sfx.play("hurt")
	pops.append({"text": (word + " " if word != "" else "") + "-%d" % dmg, "x": PX, "y": 0.42, "t": now(), "c": UI.PINK})
	flash(false)

# ---------- 상사 ----------
func _set_boss(s: String, dur: float) -> void:
	bstate = s
	bstate_until = now() + dur

func _pick_skill() -> String:
	var opts := ["nag", "nag", "paper", "paper", "burst"]
	if boss_hp < 50:
		opts.append("burst")
	opts.erase(last_skill)
	var k: String = opts[randi() % opts.size()]
	last_skill = k
	return k

func _spawn(kind: String, power := 1.0) -> void:
	match kind:
		"nag":
			for i in 3:
				shots.append({"kind": "nag", "x": BX - 0.08, "delay": i * 0.28, "v": 0.42 * speed, "dmg": 6.0, "word": NAG_WORDS[randi() % NAG_WORDS.size()], "y": 0.30 + i * 0.07})
		"paper":
			for i in 2:
				shots.append({"kind": "paper", "x": BX - 0.08, "delay": i * 0.35, "v": 0.62 * speed, "dmg": 10.0, "y": 0.44 + (i % 2) * 0.1, "word": ""})
		"burst":
			shots.append({"kind": "burst", "x": BX - 0.1, "delay": 0.0, "v": 0.85 * speed, "dmg": 20.0 * power, "y": 0.45, "word": ""})
			shake = 8
			Sfx.play("bark")

func _boss_tick(n: float) -> void:
	if n < bstate_until:
		return
	match bstate:
		"idle":
			bskill = _pick_skill()
			_set_boss("wind", SKILLS[bskill].wind / speed)
			Sfx.play("bell", 0.8 if bskill == "burst" else 1.2)
		"wind":
			_spawn(bskill)
			_set_boss("act", 0.9)
		"act":
			_set_boss("recover", 0.6)
		"recover":
			_set_boss("idle", (0.5 + randf() * 0.6) / speed)

func _shots_tick(dt: float, n: float) -> void:
	var keep := []
	for s in shots:
		if s.delay > 0:
			s.delay -= dt
			keep.append(s)
			continue
		s.x -= s.v * dt
		if s.x <= PX + 0.07:
			var guarding := n < guard_until
			var perfect := guarding and n - guard_from <= 0.22
			if perfect:
				meter = minf(100, meter + 34)
				_hit_boss(5, "완벽 방어")
				Sfx.play("coin")
				flash(true)
			elif guarding:
				var through := 8.0 if s.kind == "burst" else 0.0
				if through > 0:
					_hurt(through, "막았지만")
				else:
					Sfx.play("blip_low", 0.8)
					pops.append({"text": "막음", "x": PX, "y": 0.4, "t": n, "c": UI.MINT})
				meter = minf(100, meter + 6)
			else:
				_hurt(s.dmg, {"nag": "잔소리", "paper": "서류", "burst": "버럭"}[s.kind])
			continue
		keep.append(s)
	shots = keep

func _loop() -> void:
	while not finished:
		await root.get_tree().process_frame
		if not is_instance_valid(canvas):
			return
		var n := now()
		var dt := minf(0.05, n - last)
		last = n
		var left := time_sec - (n - t0)
		_boss_tick(n)
		_shots_tick(dt, n)
		shake = maxf(0, shake - dt * 30)
		set_timer(left, 5)
		goal_label.text = "상사 %d" % ceili(boss_hp)
		btn_sp.disabled = meter < 100
		btn_sp.text = "💥 사이다 한마디!" if meter >= 100 else "💥 게이지 %d%%" % int(meter)
		btn_atk.disabled = n < atk_ready
		canvas.queue_redraw()
		if boss_hp <= 0:
			finish("great" if hp >= 50 else "normal")
		elif hp <= 0:
			finish("fail")
		elif left <= 0:
			finish("normal" if boss_hp < hp else "fail")

# ---------- 그리기 ----------
func _bar(x: float, y: float, w: float, v: float, c: Color, label: String, right := false) -> void:
	canvas.draw_rect(Rect2(x - 2, y - 2, w + 4, 14), UI.INK)
	canvas.draw_rect(Rect2(x, y, w, 10), Color("#2a2140"))
	var fw := w * v / 100.0
	canvas.draw_rect(Rect2(x + (w - fw if right else 0.0), y, fw, 10), c)
	canvas.draw_string(UI.font, Vector2(x if not right else x + w - 80, y + 26), label, HORIZONTAL_ALIGNMENT_RIGHT if right else HORIZONTAL_ALIGNMENT_LEFT, 80, 11, Color.WHITE)

func _draw() -> void:
	var W := canvas.size.x
	var H := canvas.size.y
	var n := now()
	var off := Vector2(randf_range(-shake, shake), randf_range(-shake, shake)) if shake > 0 else Vector2.ZERO
	canvas.draw_set_transform(off)
	# 사무실 배경: 벽, 창문, 바닥
	canvas.draw_rect(Rect2(-20, -20, W + 40, H + 40), Color("#3b3360"))
	for i in 3:
		var wx := 20 + i * (W - 40) / 3.0
		canvas.draw_rect(Rect2(wx, H * 0.12, (W - 40) / 3.0 - 16, H * 0.2), UI.INK)
		canvas.draw_rect(Rect2(wx + 3, H * 0.12 + 3, (W - 40) / 3.0 - 22, H * 0.2 - 6), Color("#7fa8d9"))
		canvas.draw_rect(Rect2(wx + 3, H * 0.12 + H * 0.1, (W - 40) / 3.0 - 22, 2), UI.INK)
	var floor_y := H * 0.66
	canvas.draw_rect(Rect2(-20, floor_y, W + 40, H), Color("#8a6a4a"))
	for x in range(-20, int(W) + 20, 24):
		canvas.draw_rect(Rect2(x, floor_y, 2, H), Color("#6e5238"))
	canvas.draw_rect(Rect2(-20, floor_y, W + 40, 3), UI.INK)
	# 게이지
	_bar(10, 10, W * 0.4, hp, Color("#43d39e"), "나 · 멘탈")
	_bar(W * 0.6 - 10, 10, W * 0.4, boss_hp, Color("#ff6b81"), "상사 · 멘탈", true)
	canvas.draw_rect(Rect2(10, 44, W - 20, 6), Color("#2a2140"))
	canvas.draw_rect(Rect2(10, 44, (W - 20) * meter / 100.0, 6), UI.PINK if meter >= 100 else Color("#ffb3c1"))
	# 상사
	var s := 6.0
	var bx := W * BX
	var lean := 0.0
	if bstate == "wind":
		lean = -sin(n * 30) * 2
	elif bstate == "act":
		lean = -8
	if n < boss_hurt_until:
		lean += 10
	var boss_look: Dictionary = Main.inst.npc_look("boss")
	Pix.draw_character(canvas, boss_look, (bx + lean) / s, floor_y / s, 2, int(n * 4) % 2, bstate == "wind", s)
	if n < boss_hurt_until:
		canvas.draw_rect(Rect2(bx + lean - 40, floor_y - 110, 80, 110), Color(1, 1, 1, 0.35))
	# 기술 예고
	if bstate == "wind":
		var sk: Dictionary = SKILLS[bskill]
		var txt: String = "❗ " + sk.name
		var tw := 120.0
		var r := Rect2(bx - tw / 2, floor_y - 160, tw, 28)
		canvas.draw_rect(r.grow(2), UI.INK)
		canvas.draw_rect(r, sk.color)
		canvas.draw_string(UI.font, r.position + Vector2(0, 19), txt, HORIZONTAL_ALIGNMENT_CENTER, tw, 14, UI.INK)
		if bskill == "burst":
			canvas.draw_arc(Vector2(bx, floor_y - 60), 50 + sin(n * 25) * 6, 0, TAU, 24, Color(1, 0.3, 0.4, 0.6), 3)
	elif bstate == "recover":
		canvas.draw_string(UI.font, Vector2(bx - 40, floor_y - 130), "헉헉 (빈틈)", HORIZONTAL_ALIGNMENT_CENTER, 80, 11, UI.MINT)
	# 나
	var px := W * PX
	var plunge := 0.0
	if n < lunge_until:
		plunge = 16
	if n < hurt_until:
		plunge = -10
	Pix.draw_character(canvas, Game.w().look if Game.w() else Pix.DEFAULT_LOOK, (px + plunge) / s, floor_y / s, 3, int(n * 4) % 2, false, s)
	if n < lunge_until:
		var r2 := Rect2(px + 30, floor_y - 120, 92, 26)
		canvas.draw_rect(r2.grow(2), UI.INK)
		canvas.draw_rect(r2, Color.WHITE)
		canvas.draw_string(UI.font, r2.position + Vector2(0, 18), "그건 아니죠!", HORIZONTAL_ALIGNMENT_CENTER, 92, 12, UI.INK)
	if n < guard_until:
		var perfect_now := n - guard_from <= 0.22
		var gx := px + 30
		canvas.draw_rect(Rect2(gx - 2, floor_y - 104, 14, 96), UI.INK)
		canvas.draw_rect(Rect2(gx, floor_y - 102, 10, 92), UI.YELLOW if perfect_now else UI.MINT)
	if n < hurt_until:
		canvas.draw_rect(Rect2(px + plunge - 40, floor_y - 110, 80, 110), Color(1, 0.2, 0.3, 0.35))
	# 날아오는 것
	for sh in shots:
		if sh.delay > 0:
			continue
		var x: float = sh.x * W
		var y: float = sh.y * H
		match sh.kind:
			"nag":
				var bw := 76.0
				var rr := Rect2(x - bw / 2, y - 12, bw, 24)
				canvas.draw_rect(rr.grow(2), UI.INK)
				canvas.draw_rect(rr, UI.YELLOW)
				canvas.draw_rect(Rect2(x + bw / 2 - 10, y + 12, 6, 6), UI.YELLOW)
				canvas.draw_string(UI.font, rr.position + Vector2(0, 17), sh.word, HORIZONTAL_ALIGNMENT_CENTER, bw, 11, UI.INK)
			"paper":
				var a := n * 14
				canvas.draw_set_transform(off + Vector2(x, y), a)
				canvas.draw_rect(Rect2(-12, -15, 24, 30), UI.INK)
				canvas.draw_rect(Rect2(-10, -13, 20, 26), Color.WHITE)
				for k in 4:
					canvas.draw_rect(Rect2(-7, -9 + k * 5, 14, 2), Color("#9aa3c7"))
				canvas.draw_set_transform(off)
			"burst":
				for k in 3:
					var rad := 40.0 + k * 14
					canvas.draw_arc(Vector2(x + 40, y), rad, PI * 0.65, PI * 1.35, 12, Color(1, 0.3, 0.4, 0.9 - k * 0.25), 6)
				canvas.draw_string(UI.font, Vector2(x - 20, y - 50), "버럭!!", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, UI.PINK)
	# 뜨는 글자
	var keep := []
	for p in pops:
		var age: float = n - p.t
		if age > 0.9:
			continue
		keep.append(p)
		var c: Color = p.c
		c.a = 1.0 - age / 0.9
		var pos := Vector2(p.x * W - 60, p.y * H - age * 40)
		canvas.draw_string_outline(UI.font, pos, p.text, HORIZONTAL_ALIGNMENT_CENTER, 120, 14, 4, Color(UI.INK, c.a))
		canvas.draw_string(UI.font, pos, p.text, HORIZONTAL_ALIGNMENT_CENTER, 120, 14, c)
	pops = keep
	canvas.draw_set_transform(Vector2.ZERO)
