## 동네: 넓은 도트 지도를 위에서 내려다보며 돌아다닌다.
## 나이 스테이지마다 하루 퀘스트(등교·출근·미션·동네 활동)가 중심이고, 오늘의 운세가 퀘스트 길 위에 돌·물웅덩이·개를 깔아 둔다.
extends Node2D

const U := 16.0
const MIN_PER_SEC := 4.0  # 현실 1초 = 게임 4분
const WALK_SPEED := 5.6  # 칸/초
const BIKE_SPEED := 11.5
const ACCEL := 40.0
const OFFICE_DOOR := Vector2(118, 32.6)
const HOME_START := Vector2(19, 95.2)
## 위험물 미니게임
const HAZARD_MG := {"stone": "HZ_stone", "puddle": "HZ_puddle", "dog": "HZ_dog"}
const HAZARD_DMG := {"stone": [14, "limp", "🪨 돌부리에 걸려 넘어졌다!"], "puddle": [10, "wet", "💧 물웅덩이에 빠졌다!"], "dog": [16, "scared", "🐕 멍멍! 개가 달려들어 깜짝 놀랐다!"]}
const STATUS := {
	"limp": {"name": "절뚝절뚝", "speed": 0.55, "min": 40},
	"wet": {"name": "발이 축축", "speed": 0.85, "min": 30},
	"scared": {"name": "깜짝 놀람", "speed": 0.9, "min": 30},
}
## 퀘스트 길 (칸 좌표, 인도 가운데)
const ROUTES := {
	"commute": [Vector2(22, 95), Vector2(75, 95), Vector2(75, 33), Vector2(115, 33)],
	"park": [Vector2(75, 55), Vector2(40, 55), Vector2(40, 47), Vector2(32, 45)],
	"pasta": [Vector2(78, 95), Vector2(104, 95)],
}

var map_tex: Texture2D
var colliders: Array = []  # Rect2 (칸)
var ysort: Node2D
var ground: Node2D
var player: Actor
var cam: Camera2D
var dark_mod: CanvasModulate
var glows: Array = []
var npcs: Array = []  # {def, actor, pos, fwd}
var interactables: Array = []
var hazards: Array = []  # {kind, actor, pos, ...}
var coins: Array = []
var hud
var paused := false
var ride := ""  # "", "bike"
var fortune: Dictionary
var pos := HOME_START
var vel := Vector2.ZERO
var invuln := 0.0
var clock_acc := 0.0
var t := 0.0
var current = null
var joy := Vector2.ZERO
var _started := false
var _scared_jitter := Vector2.ZERO

func _ready() -> void:
	map_tex = load("res://assets/img/map.png")
	var map := Sprite2D.new()
	map.texture = map_tex
	map.centered = false
	map.z_index = -10
	add_child(map)
	ground = Node2D.new()
	ground.z_index = -5
	add_child(ground)
	ysort = Node2D.new()
	ysort.y_sort_enabled = true
	add_child(ysort)
	for r in Game.world.colliders:
		colliders.append(Rect2(r.minX, r.minZ, r.maxX - r.minX, r.maxZ - r.minZ))
	for p in Game.world.trees:
		_prop("tree", Vector2(p[0], p[1]))
	for p in Game.world.lamps:
		_prop("lamp", Vector2(p[0], p[1]))
		var g := Sprite2D.new()
		g.texture = _glow_tex()
		g.position = Vector2(p[0], p[1] - 1.4) * U
		var mat := CanvasItemMaterial.new()
		mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		g.material = mat
		g.z_index = 5
		g.visible = false
		add_child(g)
		glows.append(g)
	dark_mod = CanvasModulate.new()
	add_child(dark_mod)
	player = Actor.new("person")
	ysort.add_child(player)
	cam = Camera2D.new()
	cam.zoom = Vector2(2, 2)
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 7.0
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(Game.world.MAP_W * U)
	cam.limit_bottom = int(Game.world.MAP_H * U)
	add_child(cam)
	_build_npcs()
	_build_interactables()
	hud = preload("res://scripts/hud.gd").new(self)
	add_child(hud)
	var s := Game.w()
	if s.pos != null:
		pos = Vector2(s.pos[0], s.pos[1])
	_start_day(false)
	_sync_player()
	cam.reset_smoothing()

func _glow_tex() -> Texture2D:
	var g := Gradient.new()
	g.set_color(0, Color(1, 0.84, 0.55, 0.85))
	g.set_color(1, Color(1, 0.84, 0.55, 0))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(1, 0.5)
	tex.width = 96
	tex.height = 96
	return tex

func _prop(kind: String, p: Vector2) -> Actor:
	var a := Actor.new(kind)
	a.position = (p * U).round()
	ysort.add_child(a)
	return a

# ---------- 하루 시작 / 운세 ----------
# ---------- 나이 스테이지 ----------
func stage() -> Dictionary:
	return Game.stage()

func stage_door() -> Vector2:
	return stage().door

func mission_time() -> int:
	return int(stage().missionTime)

func mission_name() -> String:
	var m: Dictionary = Stages.missions().get(stage().missionId, {})
	return m.get("title", "6시 칼퇴 작전")

func _start_day(new_day: bool) -> void:
	fortune = Game.today_fortune()
	_place_hazards()
	if Game.w().fortuneSeen != Game.w().day:
		_show_fortune.call_deferred(true)

func _show_fortune(first: bool) -> void:
	pause(true)
	await hud.fortune_card(fortune, first)
	Game.w().fortuneSeen = Game.w().day
	Game.persist()
	pause(false)

func _clear_hazards() -> void:
	for h in hazards:
		h.actor.queue_free()
	hazards.clear()
	for c in coins:
		c.actor.queue_free()
	coins.clear()

func _route_point(r: RandomNumberGenerator) -> Vector2:
	var pts: Array = stage().route
	var i := r.randi() % (pts.size() - 1)
	var a: Vector2 = pts[i]
	var b: Vector2 = pts[i + 1]
	var p := a.lerp(b, r.randf())
	# 인도 폭(2칸) 안에서 옆으로 흩뿌린다
	var side := r.randf_range(-0.75, 0.75)
	if absf(a.x - b.x) > absf(a.y - b.y):
		p.y += side
	else:
		p.x += side
	return p

func _place_hazards() -> void:
	_clear_hazards()
	var day: int = Game.w().day
	var r := Game.seeded(day, 101)
	var kind: String = fortune.hazard
	# 위험물 하나하나가 미니게임이라 길 위에 몇 개만 둔다 (운세가 나쁠수록 많이)
	var n: int = {"great": 0, "good": 2, "soso": 3, "bad": 5}.get(fortune.luck, 3) if kind != "" else 0
	if kind == "dog":
		n = mini(n, 3)
	var tries := 0
	while hazards.size() < n and tries < n * 20:
		tries += 1
		var p := _route_point(r)
		if p.distance_to(HOME_START) < 4 or p.distance_to(stage_door()) < 3 or _collide(p) != p:
			continue
		var ok := true
		for h in hazards:
			if h.pos.distance_to(p) < (7.0 if kind != "dog" else 12.0):
				ok = false
				break
		for st in Game.data.bus + Game.data.subway + Game.data.bikes:
			if p.distance_to(Vector2(st.x, st.z)) < 2.2:
				ok = false
		if not ok:
			continue
		var a := Actor.new(kind)
		a.position = (p * U).round()
		a.t = r.randf() * 3
		if kind == "puddle":
			ground.add_child(a)
		else:
			ysort.add_child(a)
		hazards.append({"kind": kind, "actor": a, "pos": p, "home": p, "cool": 0.0, "dir": 1.0, "done": false})
	if fortune.buff == "coins":
		var rc := Game.seeded(day, 202)
		for i in 14:
			var p := _route_point(rc)
			var a := Actor.new("coin")
			a.idx = i
			a.position = (p * U).round()
			ysort.add_child(a)
			coins.append({"actor": a, "pos": p})

# ---------- NPC · 상호작용 ----------
func _build_npcs() -> void:
	var defs := []
	for def in Game.data.npcs:
		if def.kind != "mission":
			defs.append(def)
	var sn: Dictionary = stage().npc
	defs.append({"id": sn.id, "name": sn.name, "kind": "mission", "missionId": stage().missionId, "x": sn.pos.x, "z": sn.pos.y,
		"look": sn.look if not sn.look.is_empty() else Main.inst.npc_look(sn.id)})
	for def in defs:
		var a := Actor.new("person")
		a.look = Pix.full_look(def.look)
		a.anim_speed = 6
		var p := Vector2(def.x, def.z)
		a.position = p * U
		a.dir = 0
		ysort.add_child(a)
		var n := {"def": def, "actor": a, "pos": p, "fwd": true}
		npcs.append(n)
		if def.kind != "encounter":
			interactables.append({"label": ("🛒 " if def.kind == "shop" else "💬 ") + def.name.split(" ")[0], "pos": p,
				"visible": func(): return true, "action": func(): _talk_to(def)})
	var cats: Array = Game.data.cats
	for i in cats.size():
		var c := _prop("cat", Vector2(cats[i][0], cats[i][1]))
		c.idx = i
		c.set_meta("cat", i)
	var wl := _prop("wallet", Vector2(Game.data.wallet[0], Game.data.wallet[1]))
	wl.set_meta("wallet", true)

func _build_interactables() -> void:
	var bed := Vector2(Game.data.bed[0], Game.data.bed[1])
	interactables.append({"label": "🛏️ 집에 들어가 자기", "pos": bed, "visible": func(): return true, "action": _sleep})
	var cats: Array = Game.data.cats
	for i in cats.size():
		interactables.append({"label": "🐈 쓰다듬기", "pos": Vector2(cats[i][0], cats[i][1]), "visible": func(): return not Game.has_flag("cat:%d" % i), "action": func(): _pet_cat(i)})
	interactables.append({"label": "👛 지갑 줍기", "pos": Vector2(Game.data.wallet[0], Game.data.wallet[1]), "visible": _wallet_visible, "action": func():
		Game.w().flags.append("wallet:have")
		Game.persist()
		Main.inst.toast("👛 지갑을 주웠다. 안에 할머니 사진이... 옆집 할머니 것 같다!", "info")})
	# 동네 활동 (미니게임)
	var acts := [
		{"id": "cafe", "label": "☕ 카페 알바 (주문 기억하기)", "marker": "☕", "pos": Vector2(97, 32.8), "mg": "MG_702", "from": 600, "to": 960, "minutes": 60, "battery": -10, "minStage": 4,
			"reward": {"great": [9000, 30], "normal": [6000, 20], "fail": [1000, 5]}, "title": "☕ 카페 알바"},
		{"id": "meeting", "label": "📊 오전 회의 (말 끊기 타이밍)", "marker": "📊", "pos": Vector2(122, 32.8), "mg": "MG_701", "from": 540, "to": 720, "minutes": 60, "battery": -8, "need": "commute", "onlyStage": 5,
			"reward": {"great": [5000, 35], "normal": [3000, 25], "fail": [0, 10]}, "title": "📊 오전 회의"},
		{"id": "bench", "label": "🪑 벤치에서 사람 구경 (표정 읽기)", "marker": "🪑", "pos": Vector2(18, 25), "mg": "MG_703", "from": 480, "to": 1260, "minutes": 30, "battery": 10,
			"reward": {"great": [0, 40], "normal": [0, 25], "fail": [0, 10]}, "title": "🪑 사람 구경"},
	]
	for a in acts:
		interactables.append({"label": a.label, "marker": a.marker, "pos": a.pos,
			"visible": func():
				var s := Game.w()
				var si := Game.stage_index()
				if a.has("minStage") and si < a.minStage: return false
				if a.has("onlyStage") and si != a.onlyStage: return false
				return not Game.day_flag("job:" + a.id) and s.clock >= a.from and s.clock <= a.to and (not a.has("need") or Game.day_flag(a.need)),
			"action": func(): _activity(a)})
	# 교통
	for st in Game.data.bus:
		interactables.append({"label": "🚌 버스 타기 · %s 정류장" % st.name, "marker": "🚌", "pos": Vector2(st.x, st.z), "visible": func(): return ride == "", "action": func(): _take_bus(st)})
	for st in Game.data.subway:
		interactables.append({"label": "🚇 지하철 타기 · %s" % st.name, "marker": "🚇", "pos": Vector2(st.x, st.z), "visible": func(): return ride == "", "action": func(): _take_subway(st)})
	for st in Game.data.bikes:
		interactables.append({"label": "🚲 공공자전거 빌리기 (%s)" % Game.won(Game.data.bikeFare), "marker": "🚲", "pos": Vector2(st.x, st.z), "visible": func(): return ride == "", "action": _rent_bike})
		interactables.append({"label": "🚲 자전거 반납하기", "pos": Vector2(st.x, st.z), "visible": func(): return ride == "bike", "action": _return_bike})

func _wallet_visible() -> bool:
	return not Game.has_flag("wallet:have") and not Game.has_flag("wallet:done")

# ---------- 진행 ----------
func pause(p: bool) -> void:
	paused = p
	vel = Vector2.ZERO
	joy = Vector2.ZERO
	if hud:
		hud.reset_joy()

func resume() -> void:
	hud_visible(true)
	pause(false)

func hud_visible(v: bool) -> void:
	if hud:
		hud.visible = v
		hud.set_visible_all(v)

func teleport(p: Vector2) -> void:
	pos = p
	vel = Vector2.ZERO
	_sync_player()
	cam.reset_smoothing()

func player_tile() -> Vector2:
	return pos

func _sync_player() -> void:
	player.position = (pos * U).round()
	player.look = Pix.full_look(Game.w().look)
	player.on_bike = ride == "bike"
	cam.position = pos * U + Vector2(0, -8)

func status() -> String:
	var s := Game.w()
	if s.status != "" and s.clock >= s.statusUntil:
		s.status = ""
	return s.status

func _input_vec() -> Vector2:
	var v := joy
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): v.y -= 1
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): v.y += 1
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): v.x -= 1
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): v.x += 1
	if v.length() > 1:
		v = v.normalized()
	return v

func _unhandled_key_input(e: InputEvent) -> void:
	if paused or not visible or not e.pressed or e.echo:
		return
	if (e.keycode == KEY_SPACE or e.keycode == KEY_E or e.keycode == KEY_ENTER) and current:
		current.action.call()
	elif e.keycode == KEY_M:
		hud.open_map()
	elif e.keycode == KEY_Q:
		hud.open_quests()

func _process(dt: float) -> void:
	t += dt
	_update_light()
	if paused or not visible:
		player.moving = false
		return
	dt = minf(dt, 0.05)
	var s := Game.w()
	# 이동: 가속·감속으로 미끄러지듯 자연스럽게
	var inp := _input_vec()
	var st := status()
	if st == "scared" and inp.length() > 0.1:
		if randf() < dt * 3:
			_scared_jitter = Vector2(randf_range(-0.7, 0.7), randf_range(-0.7, 0.7))
		inp = (inp + _scared_jitter).limit_length(1.0)
	var speed := BIKE_SPEED if ride == "bike" else WALK_SPEED
	if st != "":
		speed *= STATUS[st].speed if ride == "" else 0.85
	if fortune.buff == "light":
		speed *= 1.15
	var target_v := inp * speed
	var acc := ACCEL * (0.6 if ride == "bike" else 1.0)
	vel = vel.move_toward(target_v, acc * dt * (1.0 if inp.length() > 0.05 else 1.6))
	if vel.length() > 0.05:
		pos = _collide(pos + vel * dt)
		player.moving = true
		if inp.length() > 0.2:
			if absf(inp.x) > absf(inp.y) * 1.05:
				player.dir = 2 if inp.x < 0 else 3
			elif absf(inp.y) > 0.05:
				player.dir = 1 if inp.y < 0 else 0
	else:
		player.moving = false
	player.anim_speed = 9.0 if ride == "" else 4.0
	player.anim_speed *= clampf(vel.length() / WALK_SPEED, 0.5, 1.3)
	_sync_player()
	if invuln > 0:
		invuln -= dt
	_update_npcs(dt)
	if paused:
		return
	_update_hazards(dt)
	if paused:
		return
	# 가까운 상호작용 대상
	var best = null
	var best_d := 1.9
	for it in interactables:
		if not it.visible.call():
			continue
		var d: float = pos.distance_to(it.pos)
		if d < best_d:
			best_d = d
			best = it
	if best != current:
		current = best
		hud.set_action(best.label if best else "")
	# 출근 체크
	if not Game.day_flag("commute") and not Game.day_flag("late") and pos.distance_to(stage_door()) < 2.6:
		if s.clock <= 9 * 60:
			Game.add_day_flag("commute")
			Sfx.play("good")
			_reward(3000, 20, "⏰ 늦지 않게 %s 도착!" % stage().place)
		else:
			Game.add_day_flag("late")
			Sfx.play("bad")
			Main.inst.toast("😰 늦었다... 눈치가 보인다", "bad")
	# 시간
	clock_acc += dt * MIN_PER_SEC
	if clock_acc >= 1:
		var add := int(clock_acc)
		clock_acc -= add
		s.clock += add
		if fortune.buff == "light" and s.hp < 100 and int(s.clock) % 6 == 0:
			s.hp = mini(100, s.hp + 1)
		s.pos = [snappedf(pos.x, 0.1), snappedf(pos.y, 0.1)]
		if s.clock >= 24 * 60:
			Main.inst.toast("😵 너무 늦게까지 돌아다녔다... 쓰러지듯 잠들었다", "bad")
			_next_day(60)
			return
		Game.changed.emit()

func _update_light() -> void:
	var h: float = Game.w().clock / 60.0
	var dark := 0.0
	if h >= 17 and h < 19: dark = (h - 17) / 2.0 * 0.28
	elif h >= 19 and h < 21: dark = 0.28 + (h - 19) / 2.0 * 0.32
	elif h >= 21: dark = 0.6
	elif h < 7: dark = 0.5
	dark_mod.color = Color(1, 1, 1).lerp(Color(0.32, 0.3, 0.62), dark)
	var on := dark > 0.15
	for g in glows:
		g.visible = on
		g.modulate.a = dark * 0.9

func _collide(p: Vector2, r := 0.36) -> Vector2:
	for c: Rect2 in colliders:
		if p.x < c.position.x - 1 or p.x > c.end.x + 1 or p.y < c.position.y - 1 or p.y > c.end.y + 1:
			continue
		var cx := clampf(p.x, c.position.x, c.end.x)
		var cz := clampf(p.y, c.position.y, c.end.y)
		var d := Vector2(p.x - cx, p.y - cz)
		var l := d.length()
		if l < r:
			if l == 0:
				var pushes := [c.position.x - r - p.x, c.end.x + r - p.x, c.position.y - r - p.y, c.end.y + r - p.y]
				var k := 0
				for i in 4:
					if absf(pushes[i]) < absf(pushes[k]): k = i
				if k < 2: p.x += pushes[k]
				else: p.y += pushes[k]
			else:
				p = Vector2(cx, cz) + d / l * r
	return p

func _update_npcs(dt: float) -> void:
	for n in npcs:
		var def: Dictionary = n.def
		var a: Actor = n.actor
		if def.has("patrol") and def.patrol != null:
			var to := Vector2(def.patrol[1][0], def.patrol[1][1]) if n.fwd else Vector2(def.patrol[0][0], def.patrol[0][1])
			var d: Vector2 = to - n.pos
			if d.length() < 0.3:
				n.fwd = not n.fwd
			else:
				n.pos += d.normalized() * 2.2 * dt
				a.moving = true
				a.dir = (2 if d.x < 0 else 3) if absf(d.x) > absf(d.y) else (1 if d.y < 0 else 0)
			a.position = (n.pos * U).round()
			if not Game.day_flag("enc:" + def.id) and pos.distance_to(n.pos) < 1.1:
				_encounter(def)
				return
		else:
			# 서 있는 사람은 나를 바라본다
			var d: Vector2 = pos - n.pos
			if d.length() < 4:
				a.dir = (2 if d.x < 0 else 3) if absf(d.x) > absf(d.y) else (1 if d.y < 0 else 0)

func _update_hazards(dt: float) -> void:
	var s := Game.w()
	for h in hazards:
		if h.done:
			continue
		var a: Actor = h.actor
		var d: float = pos.distance_to(h.pos)
		match h.kind:
			"stone", "puddle":
				a.flash = 1.0 if d < 3.0 else 0.0
				if d < 1.5 and invuln <= 0:
					_hazard_event(h)
					return
			"dog":
				var chase: bool = d < 4.0
				var goal: Vector2 = pos if chase else h.home + Vector2(sin(t * 0.6 + h.home.x) * 2.5, 0)
				var dv: Vector2 = goal - h.pos
				var sp := 3.0 if chase else 1.2
				if dv.length() > 0.1:
					h.pos = _collide(h.pos + dv.normalized() * sp * dt, 0.3)
					a.moving = true
					a.dir = 2 if dv.x < 0 else 3
				else:
					a.moving = false
				a.angry = chase
				a.position = (h.pos * U).round()
				if chase and int(t * 2) != int((t - dt) * 2):
					Sfx.play("bark", 1.2)
				if d < 1.6 and invuln <= 0:
					_hazard_event(h)
					return
	for c in coins.duplicate():
		if pos.distance_to(c.pos) < 0.8:
			c.actor.queue_free()
			coins.erase(c)
			s.money += 500
			Sfx.play("coin")
			Main.inst.toast("🪙 동전을 주웠다! +500원 (재물운)", "good")
			Game.persist()

## 운세 속 위험물에 다가가면 "⚠️ 위험!" → 위험물 미니게임. 깨면 무사 통과, 지면 HP가 깎인다.
func _hazard_event(h: Dictionary) -> void:
	h.done = true
	pause(true)
	vel = Vector2.ZERO
	Sfx.play("bell", 0.7)
	await hud.danger_banner("⚠️ 위험! %s 조심!" % Game.HAZARD[h.kind].name)
	var res: String = await Main.inst.run_minigame(HAZARD_MG[h.kind])
	h.actor.queue_free()
	pause(false)
	invuln = 1.0
	if res == "fail":
		var dm: Array = HAZARD_DMG[h.kind]
		if ride == "bike":
			ride = ""
			Main.inst.toast("🚲 자전거는 대여소로 돌아갔다", "info")
		if h.kind == "puddle":
			Game.set_battery(Game.save.battery - 6)
		_hurt(int(dm[0]), dm[1], dm[2])
	else:
		Sfx.play("good")
		Main.inst.toast("✨ %s 무사 통과! HP를 지켰다" % Game.HAZARD[h.kind].name, "good")

func _hurt(dmg: int, st: String, why: String) -> void:
	var s := Game.w()
	if fortune.buff == "light":
		dmg = int(dmg * 0.6)
	s.hp = maxi(0, s.hp - dmg)
	s.status = st
	s.statusUntil = s.clock + STATUS[st].min
	invuln = 1.6
	player.flash = 1.0
	vel = -vel.normalized() * 6.0 if vel.length() > 0.1 else Vector2(0, 4)
	Sfx.play("hurt")
	hud.hit_flash()
	DialogueBox.shake(hud.top, 5)
	Main.inst.toast("%s HP -%d · %s" % [why, dmg, STATUS[st].name], "bad")
	Game.persist()
	if s.hp <= 0:
		_faint()

## HP를 다 쓰면: 보상형 광고를 보고 가득 채우거나, 집에서 쉬기
func _faint() -> void:
	var s := Game.w()
	pause(true)
	ride = ""
	var md: Dictionary = Main.inst.modal("😵 HP가 바닥났어요!")
	md.body.add_child(UI.label("오늘 운세를 얕봤다가 기운이 다 빠졌어요.", 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var pick := [0]
	md.body.add_child(UI.button("📺 광고 보고 HP 가득 채우기", func(): pick[0] = 1; md.root.queue_free(), "primary", 14))
	md.body.add_child(UI.button("🏠 집에서 쉬기 (시간 +90분 · HP 50)", func(): pick[0] = 2; md.root.queue_free()))
	await md.root.tree_exited
	if pick[0] == 1:
		await Main.inst.fake_ad()
		s.hp = 100
		Sfx.play("levelup")
		Main.inst.toast("❤️ HP 100으로 가득 찼다!", "good")
	else:
		s.clock += 90
		s.hp = 50
		teleport(HOME_START)
	s.status = ""
	Game.persist()
	pause(false)

func _reward(money: int, xp: int, why: String) -> void:
	var up := Game.reward(money, xp, why)
	if up > 0:
		Sfx.play("levelup")
		pause(true)
		await Main.inst.alert("레벨 업! Lv.%d" % up, "%s이(가) 되었다. 편의점에 새 아이템이 들어왔을지도?" % Game.level_title(up), "좋아!")
		pause(false)

# ---------- 대화 ----------
func _talk(title := "") -> Talk:
	var tk := Talk.new(title)
	Main.inst.overlay_root().add_child(tk)
	return tk

func dialog(name: String, line: String, look: Dictionary, emotion := "NORMAL") -> void:
	pause(true)
	var tk := _talk()
	await tk.say(name, look, emotion, line, name == "나")
	await tk.wait_tap()
	tk.close()
	pause(false)

func _npc_look(id: String) -> Dictionary:
	return Main.inst.npc_look(id)

func _talk_to(def: Dictionary) -> void:
	var s := Game.w()
	if def.kind == "shop":
		return hud.open_shop()
	if def.kind == "quest":
		if Game.has_flag("wallet:have"):
			s.flags.erase("wallet:have")
			s.flags.append("wallet:done")
			await dialog(def.name, "어머나, 내 지갑! 손주 사진이 들어 있어서 얼마나 찾았는데... *고마워요*, 이거 받아요!", _npc_look(def.id), "CRY")
			_reward(10000, 30, "👛 지갑을 찾아 드렸다!")
		elif Game.has_flag("wallet:done"):
			await dialog(def.name, "오늘도 바쁘구나? 밥 잘 챙겨 먹고 다녀요~", _npc_look(def.id), "HAPPY")
		else:
			var tip := ""
			if fortune.hazard != "":
				tip = " 그리고 오늘 운세 봤어요? %s 조심해요~" % Game.HAZARD[fortune.hazard].name
			await dialog(def.name, "아이고, 어제 공원 산책하다가 지갑을 잃어버렸지 뭐야... 혹시 보면 좀 알려줘요." + tip, _npc_look(def.id), "PANIC")
		return
	if def.has("missionId") and def.missionId != null:
		var id: String = def.missionId
		if Game.day_flag("mission:" + id):
			await dialog(def.name, "오늘은 이미 이야기 나눴잖아요. 내일 또 봐요!", _npc_look(def.id), "HAPPY")
			return
		var at: int = mission_time()
		if s.clock > at:
			await dialog(def.name, "(%s가 이미 지났다. %s은(는) 내일 다시 할 수 있다.)" % [Game.clock_text(at), mission_name()], _npc_look(def.id), "SUSPECT")
			return
		var greet: Array = {"MS_301": ["이 대리, 퇴근 전에 잠깐 나 좀 보지. 할 얘기가 *좀 많아*.", "SUSPECT"],
			"ST_KID": ["햇님반 친구들~ 간식 시간이에요!", "HAPPY"], "ST_ELEM": ["받아쓰기 시험지 받아 가렴. 음... *40점*이구나.", "SUSPECT"],
			"ST_MID": ["너 거기 서! 학원 가방 들고 어디 가니?", "ANGRY"], "ST_HIGH": ["무슨 일이냐. 야자 시간 다 됐다.", "SUSPECT"],
			"ST_UNIV": ["어 안녕~ 늦어서 미안! 나 뭐 하면 돼?", "HAPPY"], "ST_OLD": ["할머니(할아버지)! 오늘은 영상 통화 배우는 날이에요!", "HAPPY"]}.get(id, ["잠깐 얘기 좀 할까요?", "NORMAL"])
		pause(true)
		var tk := _talk("🎯 %s · %s" % [mission_name(), Game.clock_text(at)])
		await tk.say(def.name, _npc_look(def.id), greet[1], greet[0])
		var pick := await tk.choose(["🎯 미션 시작 (시간이 %s(으)로 넘어가요)" % Game.clock_text(maxi(at, s.clock)), "나중에 다시 오기"])
		tk.close()
		if pick == 1:
			return pause(false)
		s.clock = maxi(s.clock, at)
		Game.add_day_flag("mission:" + id)
		Game.persist()
		var grade: String = await Main.inst.run_mission(id)
		var r: Dictionary = Game.data.missionReward.get(grade, Game.data.missionReward.F)
		s.clock = maxi(s.clock, at + 60)
		_reward(int(r.money), int(r.xp), "🎯 %s %s등급!" % [mission_name(), grade])
		if grade != "F":
			_grow_up()

func _encounter(def: Dictionary) -> void:
	Game.add_day_flag("enc:" + def.id)
	var e = null
	for x in Game.data.encounters:
		if x.npcId == def.id:
			e = x
	if e == null:
		return
	pause(true)
	Sfx.play("stamp")
	var look := _npc_look(def.id)
	var ch: Array = e.choices.duplicate()
	ch.shuffle()
	var tk := _talk("💥 " + e.title)
	await tk.say(def.name, look, e.emotion, e.line)
	var texts := []
	for c in ch:
		texts.append(c.text)
	var c: Dictionary = ch[await tk.choose(texts)]
	await tk.say(Game.active_name(), Game.w().look, "NORMAL", c.text, true)
	await tk.wait_tap()
	await tk.say(def.name, look, c.emotion, c.reaction)
	await tk.wait_tap()
	tk.close()
	pause(false)
	Game.set_battery(Game.save.battery + int(c.battery))
	if c.xp or c.money:
		_reward(int(c.money), int(c.xp), "💥 돌발 만남 해결!")

func _pet_cat(i: int) -> void:
	var s := Game.w()
	s.flags.append("cat:%d" % i)
	for a in ysort.get_children():
		if a.has_meta("cat") and a.get_meta("cat") == i:
			a.visible = false
	var n := 0
	for f in s.flags:
		if f.begins_with("cat:"): n += 1
	var total: int = Game.data.cats.size()
	Sfx.play("good")
	if n >= total and not Game.has_flag("cats:done"):
		s.flags.append("cats:done")
		s.owned.append("catears")
		_reward(0, 40, "🐈 동네 고양이 %d마리 모두 찾았다! 고양이 귀 머리띠 획득!" % total)
	else:
		Game.persist()
		Main.inst.toast("🐈 냐옹~ (동네 고양이 %d/%d)" % [n, total], "info")

func _activity(a: Dictionary) -> void:
	var s := Game.w()
	Game.add_day_flag("job:" + a.id)
	pause(true)
	var res: String = await Main.inst.run_minigame(a.mg)
	s.clock += a.minutes
	Game.set_battery(Game.save.battery + a.battery)
	var rw: Array = a.reward[res]
	pause(false)
	_reward(rw[0], rw[1], "%s %s" % [a.title, {"great": "대성공!", "normal": "성공!", "fail": "아쉽다…"}[res]])

## 스테이지 미션을 깨면 세월이 흘러 다음 나이로
func _grow_up() -> void:
	pause(true)
	var before := stage()
	var done := Game.age_up()
	var after := stage()
	Sfx.play("levelup")
	if done:
		await Main.inst.alert("🎉 인생 완주!", "%s까지 무사히 살아 냈어요! 모은 돈과 옷은 그대로, 새 인생을 %s부터 다시 시작해요. (완주 %d회)" % [before.label, after.label, int(Game.w().lifeDone)], "다시 태어나기")
	else:
		await Main.inst.alert("🎂 세월이 흘러...", "%s %d살 → %s %d살!\n이제 %s. 새로운 하루가 시작돼요." % [before.label, before.age, after.label, after.age, after.title], "좋아!")
	var s := Game.w()
	s.day += 1
	s.clock = 7 * 60 + 30
	s.dayFlags = []
	s.hp = 100
	s.status = ""
	s.pos = [HOME_START.x, HOME_START.y]
	Game.set_battery(100)
	Game.persist()
	Main.inst.restart_world.call_deferred()

func _sleep() -> void:
	var s := Game.w()
	if s.clock < 21 * 60:
		await dialog(Game.active_name(), "아직 %s... 잠들기엔 이르다. (21시 이후에 잘 수 있어요)" % Game.clock_text(s.clock), Game.w().look)
		return
	_next_day(100)

func _next_day(battery: int) -> void:
	var s := Game.w()
	s.day += 1
	s.clock = 7 * 60 + 30
	s.dayFlags = []
	s.hp = mini(100, s.hp + 60)
	s.status = ""
	ride = ""
	Game.set_battery(battery)
	teleport(HOME_START)
	Game.persist()
	_start_day(true)

# ---------- 교통 ----------
func _pay(fare: int) -> bool:
	var s := Game.w()
	if s.money < fare:
		Sfx.play("bad")
		Main.inst.toast("돈이 모자라요 (%s 필요). 걸어가거나 미션으로 벌어 오세요!" % Game.won(fare), "bad")
		return false
	s.money -= fare
	return true

func _take_bus(from: Dictionary) -> void:
	pause(true)
	var m: Dictionary = Main.inst.modal("🚌 버스 타기 · %s" % from.name)
	var s := Game.w()
	var wait: int = 10 - int(s.clock) % 10
	m.body.add_child(UI.label("요금 %s · 다음 버스 %d분 뒤 · 순환 노선" % [Game.won(Game.data.busFare), wait], 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var res := [null]
	for st in Game.data.bus:
		if st.id == from.id:
			continue
		var dist: float = absf(st.x - from.x) + absf(st.z - from.z)
		var ride_min := int(dist / 9.0) + 3
		var arrive: int = s.clock + wait + ride_min
		var b := UI.button("%s 행 · %d분 (도착 %s)" % [st.name, wait + ride_min, Game.clock_text(arrive)], Callable(), "normal")
		b.pressed.connect(func(): res[0] = [st, wait + ride_min]; m.root.queue_free())
		m.body.add_child(b)
	var cancel := UI.button("안 탈래요", func(): m.root.queue_free())
	m.body.add_child(cancel)
	await m.root.tree_exited
	if res[0] == null:
		return pause(false)
	if not _pay(Game.data.busFare):
		return pause(false)
	var st: Dictionary = res[0][0]
	await hud.transit_cutscene("bus", from.name, st.name, res[0][1])
	s.clock += res[0][1]
	teleport(Vector2(st.x, st.z + 0.6))
	Game.persist()
	pause(false)

func _take_subway(from: Dictionary) -> void:
	var to: Dictionary
	for st in Game.data.subway:
		if st.id != from.id:
			to = st
	pause(true)
	var s := Game.w()
	var wait: int = 5 - int(s.clock) % 5
	var mins := wait + 8
	var m: Dictionary = Main.inst.modal("🚇 %s" % from.name)
	m.body.add_child(UI.label("%s → %s\n요금 %s · %d분 (도착 %s)" % [from.name, to.name, Game.won(Game.data.subwayFare), mins, Game.clock_text(s.clock + mins)], 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var go := [false]
	var b := UI.button("타기", func(): go[0] = true; m.root.queue_free(), "primary")
	m.body.add_child(b)
	m.body.add_child(UI.button("안 탈래요", func(): m.root.queue_free()))
	await m.root.tree_exited
	if not go[0] or not _pay(Game.data.subwayFare):
		return pause(false)
	await hud.transit_cutscene("subway", from.name, to.name, mins)
	s.clock += mins
	teleport(Vector2(to.x, to.z + 0.8))
	Game.persist()
	pause(false)

func _rent_bike() -> void:
	if not _pay(Game.data.bikeFare):
		return
	ride = "bike"
	Sfx.play("bell")
	Main.inst.toast("🚲 공공자전거 대여! 빠르지만 돌에 걸리면 넘어져요. 아무 대여소에서 반납", "good")
	Game.persist()

func _return_bike() -> void:
	ride = ""
	Sfx.play("bell")
	Main.inst.toast("🚲 자전거 반납 완료", "info")

func get_off_bike() -> void:
	if ride == "bike":
		ride = ""
		Sfx.play("bell")
		Main.inst.toast("🚲 자전거에서 내렸다 (자동 반납)", "info")

# ---------- 오늘 할 일 ----------
func target():
	var s := Game.w()
	if not Game.day_flag("commute") and not Game.day_flag("late") and s.clock <= 9 * 60:
		return {"pos": stage_door(), "icon": "🏫", "label": stage().goal}
	var id: String = stage().missionId
	if not Game.day_flag("mission:" + id) and s.clock <= mission_time():
		return {"pos": stage().npc.pos, "icon": "🎯", "label": "%s %s · %s %s" % [Game.clock_text(mission_time()), mission_name(), stage().place, stage().npc.name]}
	if s.clock >= 21 * 60:
		return {"pos": Vector2(Game.data.bed[0], Game.data.bed[1]), "icon": "🛏️", "label": "집에 가서 자기 → 다음 날"}
	if Game.has_flag("wallet:have"):
		for n in Game.data.npcs:
			if n.id == "grandma":
				return {"pos": Vector2(n.x, n.z), "icon": "👛", "label": "지갑을 옆집 할머니께 가져다 드리기"}
	return null

func marker_for(def: Dictionary) -> String:
	var s := Game.w()
	if def.kind == "shop":
		return "🛒"
	if def.kind == "quest":
		return "❗" if Game.has_flag("wallet:have") or not Game.has_flag("wallet:done") else ""
	if def.get("missionId") != null:
		var id: String = def.missionId
		return "🎯" if not Game.day_flag("mission:" + id) and s.clock <= mission_time() else ""
	return ""
