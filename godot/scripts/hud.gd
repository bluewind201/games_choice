## 동네 화면 위 정보: 시간·하트·돈·배터리·운세, 오늘 할 일, 미니맵, 조이스틱, 행동 버튼, 이름표·목표 화살표.
extends CanvasLayer

var world
var root: Control
var top: PanelContainer
var day_label: Label
var clock_label: Label
var hearts: Control
var money_label: Label
var bat_label: Label
var lv_label: Label
var xp_bar: ProgressBar
var fortune_chip: Button
var status_chip: PanelContainer
var next_label: Label
var mini: Control
var labels: Control
var joy_base: Control
var action_btn: Button
var bike_btn: Button
var flash: ColorRect
var _joy_id := -1
var _joy_center := Vector2.ZERO
var _joy_vec := Vector2.ZERO

func _init(w) -> void:
	world = w
	layer = 3

func _ready() -> void:
	root = UI.full(Control.new())
	root.theme = UI.theme()
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	labels = UI.full(Control.new())
	labels.mouse_filter = Control.MOUSE_FILTER_IGNORE
	labels.draw.connect(_draw_labels)
	root.add_child(labels)
	flash = UI.full(UI.color_rect(Color(1, 0.1, 0.2, 0)))
	root.add_child(flash)
	_build_top()
	_build_bottom()
	Game.changed.connect(refresh)
	refresh()

func set_visible_all(v: bool) -> void:
	root.visible = v

func _build_top() -> void:
	top = PanelContainer.new()
	top.add_theme_stylebox_override("panel", UI.box(Color(0.11, 0.08, 0.25, 0.92), UI.INK, 2, 6))
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 6
	top.offset_right = -6
	top.offset_top = 6
	root.add_child(top)
	var v := UI.vbox(4)
	top.add_child(v)
	var r1 := UI.hbox(8)
	v.add_child(r1)
	day_label = UI.label("", 12, UI.YELLOW, HORIZONTAL_ALIGNMENT_LEFT, false)
	r1.add_child(day_label)
	clock_label = UI.label("", 16, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, false)
	r1.add_child(clock_label)
	hearts = Control.new()
	hearts.custom_minimum_size = Vector2(5 * 16, 14)
	hearts.draw.connect(_draw_hearts)
	r1.add_child(hearts)
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	r1.add_child(sp)
	money_label = UI.label("", 12, UI.YELLOW, HORIZONTAL_ALIGNMENT_RIGHT, false)
	r1.add_child(money_label)
	var r2 := UI.hbox(6)
	v.add_child(r2)
	lv_label = UI.label("", 11, Color("#c9c1ff"), HORIZONTAL_ALIGNMENT_LEFT, false)
	r2.add_child(lv_label)
	xp_bar = UI.gauge(UI.MINT, 8)
	xp_bar.custom_minimum_size = Vector2(46, 8)
	xp_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	r2.add_child(xp_bar)
	bat_label = UI.label("", 11, UI.MINT, HORIZONTAL_ALIGNMENT_LEFT, false)
	r2.add_child(bat_label)
	var sp2 := Control.new()
	sp2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	r2.add_child(sp2)
	fortune_chip = UI.button("", func(): world.pause(true); await fortune_card(world.fortune, false); world.pause(false), "primary", 11)
	fortune_chip.add_theme_stylebox_override("normal", UI.box(UI.YELLOW, UI.INK, 2, 3, 2))
	fortune_chip.add_theme_stylebox_override("hover", UI.box(UI.YELLOW, UI.INK, 2, 3, 2))
	fortune_chip.add_theme_stylebox_override("pressed", UI.box(UI.YELLOW.darkened(.1), UI.INK, 2, 3, 0))
	r2.add_child(fortune_chip)
	next_label = UI.label("", 11, UI.INK)
	var np := PanelContainer.new()
	np.add_theme_stylebox_override("panel", UI.box(Color(1, 0.98, 0.92, 0.94), UI.INK, 2, 5))
	np.add_child(next_label)
	v.add_child(np)
	status_chip = UI.tag("", Color("#ffb3c1"), UI.INK, 11)
	status_chip.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	v.add_child(status_chip)
	# 미니맵
	mini = Control.new()
	mini.custom_minimum_size = Vector2(84, 84)
	mini.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	mini.offset_left = -92
	mini.offset_right = -8
	mini.offset_top = 112
	mini.offset_bottom = 196
	mini.draw.connect(_draw_mini)
	mini.gui_input.connect(func(e): if e is InputEventMouseButton and e.pressed: open_map())
	root.add_child(mini)

func _build_bottom() -> void:
	# 조이스틱
	joy_base = Control.new()
	joy_base.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	joy_base.offset_left = 14
	joy_base.offset_top = -150
	joy_base.offset_right = 124
	joy_base.offset_bottom = -40
	joy_base.draw.connect(_draw_joy)
	joy_base.gui_input.connect(_joy_input)
	root.add_child(joy_base)
	# 메뉴 버튼
	var row := UI.hbox(4)
	row.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	row.offset_left = 8
	row.offset_right = -8
	row.offset_top = -34
	row.offset_bottom = -6
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_child(row)
	for b in [["📋퀘스트", open_quests], ["🗺️지도", open_map], ["👕옷장", open_wardrobe], ["🎂인생", open_life],
			["🔊", null]]:
		var btn := UI.button(b[0], b[1] if b[1] else Callable(), "normal", 11)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.add_theme_stylebox_override("normal", UI.box(Color(1, 1, 1, 0.92), UI.INK, 2, 4, 2))
		if b[1] == null:
			btn.text = "🔇" if Sfx.muted() else "🔊"
			btn.size_flags_horizontal = Control.SIZE_FILL
			btn.pressed.connect(func(): btn.text = "🔇" if Sfx.toggle() else "🔊")
		row.add_child(btn)
	action_btn = UI.button("", func(): if world.current and not world.paused: world.current.action.call(), "primary", 13)
	action_btn.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	action_btn.offset_left = -200
	action_btn.offset_right = -10
	action_btn.offset_top = -100
	action_btn.offset_bottom = -46
	action_btn.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	action_btn.visible = false
	root.add_child(action_btn)
	bike_btn = UI.button("🚲 내리기", func(): world.get_off_bike(), "mint", 11)
	bike_btn.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	bike_btn.offset_left = -96
	bike_btn.offset_right = -10
	bike_btn.offset_top = -140
	bike_btn.offset_bottom = -108
	bike_btn.visible = false
	root.add_child(bike_btn)

func set_action(label: String) -> void:
	action_btn.visible = label != ""
	action_btn.text = label

func reset_joy() -> void:
	_joy_id = -1
	_joy_vec = Vector2.ZERO
	if joy_base:
		joy_base.queue_redraw()

func _joy_input(e: InputEvent) -> void:
	var c := joy_base.size / 2
	if e is InputEventScreenTouch or e is InputEventMouseButton:
		var pressed: bool = e.pressed
		if pressed:
			_joy_id = e.index if e is InputEventScreenTouch else 0
			_set_joy(e.position - c)
		else:
			reset_joy()
	elif e is InputEventScreenDrag or (e is InputEventMouseMotion and _joy_id >= 0):
		_set_joy(e.position - c)

func _set_joy(d: Vector2) -> void:
	var r := joy_base.size.x / 2
	_joy_vec = (d / r).limit_length(1.0)
	if _joy_vec.length() < 0.18:
		_joy_vec = Vector2.ZERO
	joy_base.queue_redraw()

func _draw_joy() -> void:
	var c := joy_base.size / 2
	var r := joy_base.size.x / 2
	joy_base.draw_circle(c, r, Color(1, 1, 1, 0.16))
	joy_base.draw_arc(c, r, 0, TAU, 32, Color(1, 1, 1, 0.5), 2)
	joy_base.draw_circle(c + _joy_vec * r * 0.6, r * 0.38, Color(1, 1, 1, 0.75))
	joy_base.draw_arc(c + _joy_vec * r * 0.6, r * 0.38, 0, TAU, 24, UI.INK, 2)

## 위험물 근처: 화면 가운데 큰 경고
func danger_banner(text: String) -> void:
	var c := UI.full(Control.new())
	c.mouse_filter = Control.MOUSE_FILTER_STOP
	Main.inst.overlay_root().add_child(c)
	var bg := UI.full(UI.color_rect(Color(0.85, 0.1, 0.2, 0.35)))
	c.add_child(bg)
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UI.box(UI.YELLOW, UI.INK, 4, 14, 4))
	p.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	p.grow_horizontal = Control.GROW_DIRECTION_BOTH
	p.grow_vertical = Control.GROW_DIRECTION_BOTH
	c.add_child(p)
	var l := UI.label(text, 22, UI.INK, HORIZONTAL_ALIGNMENT_CENTER, false)
	p.add_child(l)
	await c.get_tree().process_frame
	p.pivot_offset = p.size / 2
	p.scale = Vector2(2, 2)
	var tw := c.create_tween()
	tw.tween_property(p, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK)
	DialogueBox.shake(p, 8)
	await c.get_tree().create_timer(1.1).timeout
	c.queue_free()

## 인생 스테이지 한눈에 보기
func open_life() -> void:
	world.pause(true)
	var m: Dictionary = Main.inst.modal("🎂 나의 인생", 330)
	var b: VBoxContainer = m.body
	var cur := Game.stage_index()
	for i in Stages.LIST.size():
		var st: Dictionary = Stages.LIST[i]
		var mk := "✅" if i < cur else ("▶️" if i == cur else "⬜")
		var mm: Dictionary = Stages.missions().get(st.missionId, {})
		var mt: String = mm.get("title", "6시 칼퇴 작전")
		b.add_child(UI.label("%s %s %d살 · %s\n    미션: %s (%s)" % [mk, st.label, st.age, st.title, mt, st.place], 11, UI.NAVY if i == cur else (UI.INK if i < cur else UI.MUTED)))
	if int(Game.w().get("lifeDone", 0)) > 0:
		b.add_child(UI.label("🎉 인생 완주 %d회" % int(Game.w().lifeDone), 12, UI.PINK, HORIZONTAL_ALIGNMENT_CENTER))
	b.add_child(UI.button("닫기", func(): m.root.queue_free(), "primary"))
	await m.root.tree_exited
	world.pause(false)

func hit_flash() -> void:
	flash.color.a = 0.35
	create_tween().tween_property(flash, "color:a", 0.0, 0.35)

func _process(_dt: float) -> void:
	if not world.paused:
		world.joy = _joy_vec
	labels.queue_redraw()
	mini.queue_redraw()
	hearts.queue_redraw()
	bike_btn.visible = world.ride == "bike" and not world.paused

func refresh() -> void:
	var s := Game.w()
	day_label.text = "%d일차" % s.day
	clock_label.text = Game.clock_text(s.clock)
	clock_label.add_theme_color_override("font_color", Color("#9fb4ff") if s.clock >= 21 * 60 else Color.WHITE)
	money_label.text = "💰 " + Game.won(s.money)
	var stg := Game.stage()
	lv_label.text = "🎂 %s %d살" % [stg.label, stg.age]
	xp_bar.value = float(Game.stage_index() + 1) / Stages.LIST.size() * 100
	bat_label.text = "🔋%d" % Game.save.battery
	var f: Dictionary = world.fortune
	if f:
		var hz := ""
		if f.hazard != "":
			hz = " · " + {"stone": "🪨", "puddle": "💧", "dog": "🐕"}[f.hazard] + "주의"
		fortune_chip.text = "📜 " + f.grade.split(" ")[0] + hz
	var st: String = world.status()
	status_chip.visible = st != ""
	if st != "":
		(status_chip.get_child(0) as Label).text = "상태 이상: %s (%s까지)" % [world.STATUS[st].name, Game.clock_text(s.statusUntil)]
	var tg = world.target()
	next_label.text = ("%s %s" % [tg.icon, tg.label]) if tg else "🗺️ 자유 시간: 동네를 돌아다니며 서브 퀘스트를 찾아보세요"

# ---------- 그리기 ----------
const HEART := [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."]

func _draw_hearts() -> void:
	var hp: int = Game.w().hp
	for i in 5:
		var fill := clampf((hp - i * 20) / 20.0, 0, 1)
		var ox := i * 16
		for y in HEART.size():
			for x in 7:
				if HEART[y][x] != "X":
					continue
				var c := Color("#5a3a4a")
				if fill >= 1 or (fill > 0 and x < 4):
					c = Color("#ff4f6d") if y > 0 or x % 3 != 1 else Color("#ffb3c1")
				hearts.draw_rect(Rect2(ox + x * 2, 1 + y * 2, 2, 2), c)

func _proj(p_tile: Vector2) -> Vector2:
	return world.get_viewport().get_canvas_transform() * (p_tile * world.U)

func _tag(ci: CanvasItem, text: String, at: Vector2, bg: Color, fg: Color, size := 11, clamp_view := false) -> void:
	var f: Font = UI.font
	var ts := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size)
	var w := ts.x + 8
	var h := size + 6.0
	var x := at.x - w / 2
	if clamp_view:
		x = clampf(x, 2, ci.size.x - w - 2)
	var r := Rect2(roundf(x), roundf(at.y - h), roundf(w), h)
	ci.draw_rect(r, bg)
	ci.draw_rect(r, UI.INK, false, 1.0)
	ci.draw_string(f, Vector2(r.position.x + 4, r.position.y + size + 1), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, fg)

func _draw_labels() -> void:
	if world.paused and not world.visible:
		return
	var vs := labels.size
	for b in Game.world.buildings:
		if not b.get("label", false) and not b.has("sign"):
			continue
		var p := _proj(Vector2(b.x + b.w / 2.0, b.z + b.d - b.wall + 0.2))
		if p.x < -60 or p.x > vs.x + 60 or p.y < -20 or p.y > vs.y + 40:
			continue
		var name: String = b.sign if b.has("sign") and b.sign != null else b.name
		_tag(labels, name, p, Color(0.14, 0.1, 0.29, 0.88), Color.WHITE, 11)
	var bob := sin(world.t * 4) * 3
	for n in world.npcs:
		var p := _proj(n.pos)
		if p.x < -40 or p.x > vs.x + 40 or p.y < -40 or p.y > vs.y + 40:
			continue
		var head := p.y - 40
		var def: Dictionary = n.def
		if def.kind != "encounter" or world.pos.distance_to(n.pos) < 6:
			_tag(labels, def.name.split(" ")[0], Vector2(p.x, head), Color(0.08, 0.05, 0.18, 0.75), Color.WHITE, 10)
		var mk: String = world.marker_for(def)
		if mk != "":
			_tag(labels, mk, Vector2(p.x, head - 18 + bob), UI.YELLOW, UI.INK, 13)
	for it in world.interactables:
		if not it.has("marker") or not it.visible.call():
			continue
		var p := _proj(it.pos)
		if p.x < -30 or p.x > vs.x + 30 or p.y < -30 or p.y > vs.y + 30:
			continue
		var bg := UI.MINT if it.marker in ["☕", "📊", "🪑"] else Color("#bfe3ff")
		_tag(labels, it.marker, Vector2(p.x, p.y - 6 + sin(world.t * 4 + it.pos.x) * 2), bg, UI.INK, 12)
	if Game.w().clock >= 21 * 60:
		var hp := _proj(Vector2(Game.data.bed[0], Game.data.bed[1]))
		_tag(labels, "🛏️ 여기서 자기", Vector2(hp.x, hp.y - 30 + bob), UI.YELLOW, UI.INK, 11)
	# 위험물 경고 (가까이 있을 때 머리 위 느낌표)
	var near := false
	for h in world.hazards:
		if world.pos.distance_to(h.pos) < 2.4:
			near = true
	if near and world.invuln <= 0:
		var pp := _proj(world.pos)
		_tag(labels, "❗", Vector2(pp.x, pp.y - 42), UI.PINK, Color.WHITE, 12)
	_draw_goal_arrow()

func _draw_goal_arrow() -> void:
	var tg = world.target()
	if tg == null:
		return
	var vs := labels.size
	var sp := _proj(tg.pos)
	var top_y := 200.0
	var bottom := vs.y - 160
	var m := 26.0
	if sp.x > m and sp.x < vs.x - m and sp.y > top_y and sp.y < bottom:
		_tag(labels, "▼", Vector2(sp.x, sp.y - 46 + sin(world.t * 5) * 4), UI.PINK, Color.WHITE, 12)
		return
	var pp := _proj(world.pos)
	var ang := (sp - pp).angle()
	var dirv := Vector2.from_angle(ang)
	var tx := INF if absf(dirv.x) < 0.001 else (((vs.x - m) if dirv.x > 0 else m) - pp.x) / dirv.x
	var ty := INF if absf(dirv.y) < 0.001 else ((bottom if dirv.y > 0 else top_y) - pp.y) / dirv.y
	var tt := minf(absf(tx), absf(ty))
	var e := pp + dirv * tt
	var pts := PackedVector2Array([Vector2(16, 0), Vector2(-10, -12), Vector2(-4, 0), Vector2(-10, 12)])
	var xf := Transform2D(ang, e)
	var tp := xf * pts
	labels.draw_colored_polygon(tp, UI.PINK)
	tp.append(tp[0])
	labels.draw_polyline(tp, Color.WHITE, 2)
	var dist := roundi(world.pos.distance_to(tg.pos))
	_tag(labels, "%s %dm" % [tg.icon, dist], e - dirv * 34 + Vector2(0, 10), Color(0.08, 0.05, 0.18, 0.85), Color.WHITE, 10)

func _draw_mini() -> void:
	var W := mini.size.x
	var span: float = 44.0 * world.U
	var src := Vector2(world.pos * world.U) - Vector2(span, span) / 2
	src.x = clampf(src.x, 0, world.map_tex.get_width() - span)
	src.y = clampf(src.y, 0, world.map_tex.get_height() - span)
	mini.draw_rect(Rect2(-3, -3, W + 6, W + 6), UI.INK)
	mini.draw_texture_rect_region(world.map_tex, Rect2(0, 0, W, W), Rect2(src, Vector2(span, span)))
	var f: float = W / span
	var dot := func(p: Vector2, c: Color, r: float):
		var q: Vector2 = (p * world.U - src) * f
		if q.x >= 0 and q.y >= 0 and q.x <= W and q.y <= W:
			mini.draw_rect(Rect2(q - Vector2(r, r), Vector2(r, r) * 2), c)
	for h in world.hazards:
		dot.call(h.pos, Color("#ff4f6d"), 1.5)
	var tg = world.target()
	if tg:
		dot.call(tg.pos, Color.WHITE, 4)
		dot.call(tg.pos, UI.PINK, 3)
	dot.call(world.pos, Color.WHITE, 3.5)
	dot.call(world.pos, UI.BLUE, 2.5)
	mini.draw_string(UI.font, Vector2(2, W - 3), "M 지도", HORIZONTAL_ALIGNMENT_LEFT, -1, 10, Color.WHITE)

# ---------- 창 ----------
func _close_modal(m: Dictionary) -> void:
	m.root.queue_free()
	world.pause(false)

func fortune_card(f: Dictionary, first: bool) -> void:
	var m: Dictionary = Main.inst.modal("", 330)
	var b: VBoxContainer = m.body
	var s := Game.w()
	b.add_child(UI.label("📜 %d일차 · 오늘의 운세" % s.day, 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var pillar := UI.label(f.pillarHanja, 30, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER)
	b.add_child(pillar)
	b.add_child(UI.label(f.pillar, 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var row := UI.hbox(8)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	for pair in [["나의 기운", f.me], ["오늘의 기운", f.today]]:
		var chip := PanelContainer.new()
		chip.add_theme_stylebox_override("panel", UI.box(Color(Game.ELEMENT5_COLOR[pair[1]]).lightened(0.55), UI.INK, 2, 5))
		var cv := UI.vbox(0)
		cv.add_child(UI.label(pair[0], 10, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
		cv.add_child(UI.label("%s %s" % [Game.ELEMENT5_HANJA[pair[1]], Game.ELEMENTS5[pair[1]]], 18, Color(Game.ELEMENT5_COLOR[pair[1]]).darkened(0.3), HORIZONTAL_ALIGNMENT_CENTER))
		chip.add_child(cv)
		chip.custom_minimum_size = Vector2(96, 0)
		row.add_child(chip)
		if pair[0] == "나의 기운":
			row.add_child(UI.label("vs", 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER, false))
	b.add_child(row)
	b.add_child(UI.label(f.relation, 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var gcol: Color = {"great": Color("#e2445c"), "good": Color("#e08a00"), "soso": Color("#4f6dff"), "bad": Color("#555")}[f.luck]
	var stamp := UI.tag(f.grade, Color.WHITE, gcol, 20)
	stamp.add_theme_stylebox_override("panel", UI.box(Color.WHITE, gcol, 3, 6))
	stamp.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.add_child(stamp)
	b.add_child(UI.label(f.title, 16, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	if f.hazard != "" or f.buff == "coins":
		var pic := Control.new()
		pic.custom_minimum_size = Vector2(0, 54)
		var kind: String = f.hazard if f.hazard != "" else "coin"
		pic.draw.connect(func():
			pic.draw_set_transform(Vector2(pic.size.x / 2 - (30 if f.buff == "coins" else 0), 48), 0, Vector2(4, 4))
			match kind:
				"stone": Pix.draw_stone(pic, 0, 0, 0)
				"puddle": Pix.draw_puddle(pic, 0, -2, 0)
				"dog": Pix.draw_dog(pic, 0, 0, 3, 0, true)
			if f.buff == "coins":
				pic.draw_set_transform(Vector2(pic.size.x / 2 + 30, 48), 0, Vector2(4, 4))
				Pix.draw_coin(pic, 0, 0, 0.3))
		b.add_child(pic)
	b.add_child(UI.label(f.text, 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	b.add_child(UI.label("행운의 색 %s · 행운의 방향 %s" % [f.luckyColor, f.luckyDir], 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	if first:
		var todo := PanelContainer.new()
		todo.add_theme_stylebox_override("panel", UI.box(Color("#fff3c4"), UI.INK, 2, 6))
		var tip := "오늘의 퀘스트: %s! 멀면 🚌버스·🚇지하철·🚲자전거를 이용하세요." % Game.stage().goal
		if f.hazard != "":
			tip += "\n가는 길에 %s이(가) 있어요. 가까이 가면 ⚠️위험! 미니게임을 깨야 HP를 지켜요." % Game.HAZARD[f.hazard].name
		if f.buff == "coins":
			tip += "\n가는 길에 떨어진 동전을 주우세요!"
		todo.add_child(UI.label(tip, 11, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
		b.add_child(todo)
	var ok := UI.button("확인, 출발!" if first else "닫기", Callable(), "primary", 14)
	b.add_child(ok)
	Sfx.play("bell")
	await ok.pressed
	Sfx.play("pick")
	m.root.queue_free()

func open_quests() -> void:
	world.pause(true)
	var s := Game.w()
	var m: Dictionary = Main.inst.modal("📋 %d일차 퀘스트" % s.day, 340)
	var b: VBoxContainer = m.body
	var st := func(done: bool, missed := false) -> String:
		return "✅" if done else ("❌" if missed else "⬜")
	var line := func(text: String, size := 11, color := UI.INK):
		b.add_child(UI.label(text, size, color))
	line.call("오늘의 일정", 12, UI.PINK)
	var stg := Game.stage()
	line.call("🎂 지금 나: %s %d살 · %s" % [stg.label, stg.age, stg.title], 11, UI.NAVY)
	line.call("%s 09:00 %s" % [st.call(Game.day_flag("commute"), Game.day_flag("late")), stg.goal])
	var id: String = stg.missionId
	var done := Game.day_flag("mission:" + id)
	line.call("%s %s %s · %s %s (깨면 나이 +1)" % [st.call(done, not done and s.clock > world.mission_time()), Game.clock_text(world.mission_time()), world.mission_name(), stg.place, stg.npc.name])
	line.call("⬜ 21:00~ 집에 가서 자기 → 다음 날")
	var f: Dictionary = world.fortune
	line.call("오늘의 운세", 12, UI.PINK)
	line.call("📜 %s %s · %s" % [f.pillar, f.grade, f.title])
	if f.hazard != "":
		line.call("길 위에 %s %d개. 가까이 가면 ⚠️위험! 미니게임을 깨야 HP를 지켜요. HP가 바닥나면 📺광고로 가득 회복" % [Game.HAZARD[f.hazard].name, world.hazards.size()])
	line.call("동네 서브 퀘스트", 12, UI.PINK)
	var cats := 0
	for fl in s.flags:
		if fl.begins_with("cat:"): cats += 1
	line.call("%s 옆집 할머니의 잃어버린 지갑 %s" % [st.call(Game.has_flag("wallet:done")), "(주웠다! 할머니께)" if Game.has_flag("wallet:have") else "(공원 근처 어딘가)"])
	line.call("%s 동네 고양이 찾기 %d/%d" % [st.call(Game.has_flag("cats:done")), cats, Game.data.cats.size()])
	line.call("💥 길에서 사람과 부딪치면 돌발 만남 (하루 한 번씩)")
	line.call("동네 활동 (미니게임, 하루 한 번씩)", 12, UI.PINK)
	if Game.stage_index() == 5:
		line.call("%s 09~12시 📊 오전 회의 · 회사 앞 (출근한 날)" % st.call(Game.day_flag("job:meeting")))
	if Game.stage_index() >= 4:
		line.call("%s 10~16시 ☕ 카페 알바 · 카페 앞" % st.call(Game.day_flag("job:cafe")))
	line.call("%s 08~21시 🪑 사람 구경 · 공원 벤치" % st.call(Game.day_flag("job:bench")))
	line.call("교통", 12, UI.PINK)
	line.call("🚌 버스 %s · 🚇 지하철 %s · 🚲 자전거 %s" % [Game.won(Game.data.busFare), Game.won(Game.data.subwayFare), Game.won(Game.data.bikeFare)])
	b.add_child(UI.button("닫기", func(): _close_modal(m), "primary"))

func open_map() -> void:
	world.pause(true)
	var m: Dictionary = Main.inst.modal("🗺️ 동네 지도", 350)
	var b: VBoxContainer = m.body
	var W := 320.0
	var tex: Texture2D = world.map_tex
	var H := W * tex.get_height() / tex.get_width()
	var c := Control.new()
	c.custom_minimum_size = Vector2(W, H)
	c.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var f := W / tex.get_width()
	c.draw.connect(func():
		c.draw_texture_rect(tex, Rect2(0, 0, W, H), false)
		var P := func(p: Vector2) -> Vector2: return p * world.U * f
		for h in world.hazards:
			var q: Vector2 = P.call(h.pos)
			c.draw_rect(Rect2(q - Vector2(1.5, 1.5), Vector2(3, 3)), Color("#ff4f6d"))
		for bd in Game.world.buildings:
			if bd.get("label", false):
				_tag(c, bd.name, P.call(Vector2(bd.x + bd.w / 2.0, bd.z + bd.d / 2.0)) + Vector2(0, 6), Color(0.14, 0.1, 0.29, 0.85), Color.WHITE, 10, true)
		_tag(c, "공원", P.call(Vector2(32, 20)), Color("#2f7a3c"), Color.WHITE, 10)
		for st in Game.data.bus:
			_tag(c, "🚌", P.call(Vector2(st.x, st.z)) + Vector2(0, 8), Color("#bfe3ff"), UI.INK, 9)
		for st in Game.data.subway:
			_tag(c, "🚇", P.call(Vector2(st.x, st.z)) + Vector2(0, 8), Color("#bfe3ff"), UI.INK, 9)
		for st in Game.data.bikes:
			_tag(c, "🚲", P.call(Vector2(st.x, st.z)) + Vector2(0, 8), Color("#c8f5dc"), UI.INK, 9)
		for n in world.npcs:
			var mk: String = world.marker_for(n.def)
			if mk != "":
				_tag(c, mk, P.call(n.pos) + Vector2(0, 2), UI.YELLOW, UI.INK, 9)
		var tg = world.target()
		if tg:
			c.draw_arc(P.call(tg.pos), 8, 0, TAU, 20, UI.PINK, 2.5)
		var me: Vector2 = P.call(world.pos)
		c.draw_circle(me, 5.5, Color.WHITE)
		c.draw_circle(me, 4, UI.BLUE)
		_tag(c, "나", me - Vector2(0, 7), UI.BLUE, Color.WHITE, 10))
	b.add_child(c)
	b.add_child(UI.label("🎯 미션 · ❗ 퀘스트 · 🛒 상점 · 🚌 버스 · 🚇 지하철 · 🚲 자전거 · 빨간 점: 오늘 운세의 위험물", 10, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	b.add_child(UI.button("닫기", func(): _close_modal(m), "primary"))

func _look_preview(look: Dictionary, scale := 4.0) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(16, 24) * scale
	c.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	c.set_meta("look", look)
	c.draw.connect(func():
		c.draw_rect(Rect2(Vector2.ZERO, c.size), Color("#e9f4ff"))
		c.draw_set_transform(Vector2.ZERO, 0, Vector2(scale, scale))
		Pix.draw_character(c, Pix.full_look(c.get_meta("look")), 8, 22, 0, 0, false))
	return c

func open_shop() -> void:
	world.pause(true)
	var m: Dictionary = Main.inst.modal("🏪 편의점·옷가게", 340)
	var b: VBoxContainer = m.body
	var s := Game.w()
	var info := UI.label("", 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER)
	b.add_child(info)
	var prev := _look_preview(s.look)
	b.add_child(prev)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	b.add_child(grid)
	var render := func(): pass
	render = func():
		info.text = "가진 돈 %s · Lv.%d · HP %d" % [Game.won(s.money), s.level, s.hp]
		prev.set_meta("look", s.look)
		prev.queue_redraw()
		for ch in grid.get_children():
			ch.queue_free()
		for it in Game.data.shop:
			var consumable: bool = it.id in ["coffee", "bandage"]
			var owned: bool = s.owned.has(it.id) and not consumable
			var locked: bool = s.level < it.minLevel
			var btn := UI.button("%s %s\n%s" % [it.icon, it.name, "보유" if owned else ("Lv.%d" % it.minLevel if locked else Game.won(it.price))], Callable(), "normal", 10)
			btn.custom_minimum_size = Vector2(150, 0)
			btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			btn.disabled = owned or locked
			btn.pressed.connect(func():
				if s.money < it.price:
					Sfx.play("bad")
					Main.inst.toast("돈이 모자라요. 미션과 퀘스트로 벌어 오세요!", "bad")
					return
				s.money -= it.price
				Sfx.play("coin")
				if it.id == "coffee":
					Game.set_battery(Game.save.battery + 25)
					Main.inst.toast("🧋 시원하다! 배터리 +25", "good")
				elif it.id == "bandage":
					s.hp = mini(100, s.hp + 30)
					s.status = ""
					Main.inst.toast("🩹 반창고 붙였다! HP +30, 상태 이상 회복", "good")
				else:
					s.owned.append(it.id)
					for k in it.apply:
						s.look[k] = it.apply[k]
					Main.inst.toast("%s %s 구매! 바로 입었어요" % [it.icon, it.name], "good")
				Game.persist()
				render.call())
			grid.add_child(btn)
	render.call()
	var row := UI.hbox(6)
	var w1 := UI.button("👕 옷장", func(): m.root.queue_free(); open_wardrobe())
	w1.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var w2 := UI.button("나가기", func(): _close_modal(m), "primary")
	w2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(w1)
	row.add_child(w2)
	b.add_child(row)

func open_wardrobe() -> void:
	world.pause(true)
	var s := Game.w()
	var m: Dictionary = Main.inst.modal("👕 옷장", 330)
	var b: VBoxContainer = m.body
	var prev := _look_preview(s.look)
	b.add_child(prev)
	var upd := func():
		prev.set_meta("look", s.look)
		prev.queue_redraw()
		Game.persist()
	var all: Array = []
	for it in Game.data.shop + Game.data.rewardItems:
		if s.owned.has(it.id) and not it.id in ["coffee", "bandage"]:
			all.append(it)
	if all.is_empty():
		b.add_child(UI.label("아직 산 옷이 없어요. 편의점·옷가게에서 사 보세요.", 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var grid := GridContainer.new()
	grid.columns = 2
	b.add_child(grid)
	for it in all:
		var btn := UI.button("%s %s" % [it.icon, it.name], func():
			for k in it.apply:
				s.look[k] = it.apply[k]
			upd.call()
			Main.inst.toast("갈아입었다!", "good"), "normal", 10)
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		grid.add_child(btn)
	var row := UI.hbox(6)
	for pair in [["기본 옷으로", func(): s.look = Pix.DEFAULT_LOOK.duplicate(); upd.call()], ["모자·안경 벗기", func(): s.look.hat = null; s.look.glasses = null; upd.call()]]:
		var bt := UI.button(pair[0], pair[1], "normal", 11)
		bt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(bt)
	b.add_child(row)
	b.add_child(UI.button("닫기", func(): _close_modal(m), "primary"))

## 버스·지하철 타는 장면 (2초 남짓)
func transit_cutscene(kind: String, from: String, to: String, minutes: int) -> void:
	var c := UI.full(Control.new())
	c.mouse_filter = Control.MOUSE_FILTER_STOP
	Main.inst.overlay_root().add_child(c)
	var t0 := Time.get_ticks_msec()
	c.draw.connect(func():
		var t := (Time.get_ticks_msec() - t0) / 1000.0
		var W := c.size.x
		var H := c.size.y
		var cy := H * 0.5
		if kind == "bus":
			c.draw_rect(Rect2(0, 0, W, H), Color("#8fd0ff"))
			for i in 14:
				var bx := fposmod(i * 70 - t * 160, W + 140) - 70
				var bh := 60 + (i * 37) % 70
				c.draw_rect(Rect2(bx, cy - bh, 56, bh), Color("#b9c6d6") if i % 2 else Color("#d9d4e7"))
				for wy in range(int(cy - bh + 8), int(cy - 8), 14):
					c.draw_rect(Rect2(bx + 8, wy, 10, 8), Color("#8fd0ff"))
					c.draw_rect(Rect2(bx + 30, wy, 10, 8), Color("#8fd0ff"))
			c.draw_rect(Rect2(0, cy + 70, W, H - cy - 70), Color("#78c850"))
			for i in 16:
				c.draw_rect(Rect2(fposmod(i * 37 - t * 260, W + 40) - 20, cy + 90 + (i * 53) % 200, 3, 6), Color("#4f9a35"))
			c.draw_rect(Rect2(0, cy + 70, W, 8), Color("#d8cfc0"))
			c.draw_rect(Rect2(0, cy, W, 70), Color("#55555f"))
			for i in 10:
				c.draw_rect(Rect2(fposmod(i * 60 - t * 300, W + 60) - 30, cy + 33, 28, 4), Color("#f5e6a0"))
			var bob := roundf(sin(t * 18)) * 1.5
			var x := W * 0.5 - 90
			var y := cy + 2 + bob
			c.draw_rect(Rect2(x - 3, y - 3, 186, 62), UI.INK)
			c.draw_rect(Rect2(x, y, 180, 56), Color("#2bb39a"))
			c.draw_rect(Rect2(x, y + 40, 180, 6), Color("#1d8a76"))
			for i in 6:
				c.draw_rect(Rect2(x + 10 + i * 27, y + 8, 22, 18), Color("#cfeeff"))
			c.draw_rect(Rect2(x + 150, y + 8, 22, 34), Color("#cfeeff"))
			for wx in [x + 30, x + 140]:
				c.draw_circle(Vector2(wx, y + 58), 11, UI.INK)
				c.draw_circle(Vector2(wx, y + 58), 5, Color("#999"))
		else:
			c.draw_rect(Rect2(0, 0, W, H), Color("#1d1430"))
			for i in 12:
				var lx := fposmod(i * 50 - t * 600, W + 100) - 50
				c.draw_rect(Rect2(lx, cy - 70, 30, 4), Color(1, 0.9, 0.6, 0.8))
				c.draw_rect(Rect2(lx, cy + 80, 30, 4), Color(1, 0.9, 0.6, 0.5))
			var x := W * 0.5 - 150
			var y := cy - 40
			c.draw_rect(Rect2(x - 3, y - 3, 306, 86), UI.INK)
			c.draw_rect(Rect2(x, y, 300, 80), Color("#dfe6ee"))
			c.draw_rect(Rect2(x, y + 54, 300, 8), Color("#2e7d32"))
			for i in 8:
				c.draw_rect(Rect2(x + 10 + i * 36, y + 12, 26, 26), Color("#8fd0ff"))
		var title := "%s  %s → %s" % ["🚌" if kind == "bus" else "🚇", from, to]
		_tag(c, title, Vector2(W / 2, cy - 130), UI.YELLOW, UI.INK, 15)
		_tag(c, "%d분 이동 중..." % minutes, Vector2(W / 2, cy + 140), Color.WHITE, UI.INK, 12))
	var tw := c.create_tween()
	c.modulate.a = 0
	tw.tween_property(c, "modulate:a", 1.0, 0.2)
	Sfx.play("bell")
	for i in 22:
		await get_tree().create_timer(0.1).timeout
		c.queue_redraw()
	var tw2 := c.create_tween()
	tw2.tween_property(c, "modulate:a", 0.0, 0.25)
	await tw2.finished
	c.queue_free()
	Main.inst.toast("%s 도착! (%d분)" % [to, minutes], "info")
