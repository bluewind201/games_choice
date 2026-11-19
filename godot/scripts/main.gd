## 화면 관리: 타이틀 → 생년월일 → 동네(오늘의 운세) ⇄ 나이 스테이지 미션·미니게임.
class_name Main
extends Node

static var inst: Node

var ui_layer: CanvasLayer
var screen: Control
var overlay: CanvasLayer
var toast_box: VBoxContainer
var world: Node2D
var _js_cb

const WorldScript := preload("res://scripts/world.gd")
const MissionScript := preload("res://scripts/mission.gd")
const MG := {
	"MG_101": preload("res://scripts/minigames/mg_catch.gd"),
	"MG_402": preload("res://scripts/minigames/mg_mash.gd"),
	"MG_602": preload("res://scripts/minigames/mg_find.gd"),
	"MG_701": preload("res://scripts/minigames/mg_timing.gd"),
	"MG_702": preload("res://scripts/minigames/mg_memory.gd"),
	"MG_703": preload("res://scripts/minigames/mg_faces.gd"),
	"MG_801": preload("res://scripts/minigames/mg_fight.gd"),
}
## Stages.MG 설정으로 꾸며 쓰는 엔진
const ENGINE := {
	"jump": preload("res://scripts/minigames/mg_jump.gd"),
	"dodge": preload("res://scripts/minigames/mg_dodge.gd"),
	"quiz": preload("res://scripts/minigames/mg_quiz.gd"),
}

static func minigame_title(id: String) -> String:
	if Stages.MG.has(id):
		return Stages.MG[id].title
	return id

func _ready() -> void:
	inst = self
	RenderingServer.set_default_clear_color(Color("#2a2140"))
	ui_layer = CanvasLayer.new()
	ui_layer.layer = 5
	add_child(ui_layer)
	overlay = CanvasLayer.new()
	overlay.layer = 20
	add_child(overlay)
	var ov_root := UI.full(Control.new())
	ov_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ov_root.theme = UI.theme()
	overlay.add_child(ov_root)
	toast_box = UI.vbox(4)
	toast_box.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	toast_box.offset_top = 92
	toast_box.offset_left = 16
	toast_box.offset_right = -16
	toast_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ov_root.add_child(toast_box)
	Game.toast.connect(toast)
	_setup_debug()
	if _fight_only():
		screen_fight_lobby()
	else:
		screen_title()
	if "--autotest" in OS.get_cmdline_user_args():
		add_child(preload("res://scripts/autotest.gd").new())

# ---------- 격투만 하는 페이지 ----------
## 웹 페이지가 window.FIGHT_ONLY = true 를 켜 두었거나 `-- --fight` 로 실행하면 격투 연습장으로 바로 간다.
func _fight_only() -> bool:
	if "--fight" in OS.get_cmdline_user_args():
		return true
	if OS.has_feature("web"):
		return str(JavaScriptBridge.eval("window.FIGHT_ONLY === true", true)).to_lower() in ["true", "1"]
	return false

var fight_record := {"play": 0, "win": 0, "last": ""}

func _boss_profile() -> Dictionary:
	for mm in Game.data.missions:
		if mm.id == "MS_301":
			return mm.npc
	return {"mbti": "ESTJ", "blood": "B"}

func screen_fight_lobby() -> void:
	var root := Control.new()
	root.add_child(UI.full(UI.color_rect(Color("#2a2140"))))
	set_screen(root)
	var v := UI.vbox(10)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 20
	v.offset_right = -20
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_child(v)
	v.add_child(UI.outlined(UI.label("정면 승부!", 38, UI.YELLOW, HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 10))
	v.add_child(UI.outlined(UI.label("상사와 한판 · 연습장", 14, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 5))
	var pv := PortraitView.new(npc_look("boss"), 2)
	pv.set_emotion("ANGRY")
	pv.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(pv)
	var info := PanelContainer.new()
	var iv := UI.vbox(4)
	info.add_child(iv)
	iv.add_child(UI.label("박 팀장의 기술: 잔소리 · 버럭! · 서류 던지기", 12, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	iv.add_child(UI.label("내 기술: 🛡️ 방어(맞기 직전이면 완벽 방어) · 🗯️ 대들기 · 💥 사이다 한마디", 11, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var rec := "아직 한 판도 안 했어요" if fight_record.play == 0 else "%d판 %d승 · 지난 판 %s" % [fight_record.play, fight_record.win, fight_record.last]
	iv.add_child(UI.label(rec, 12, UI.PINK, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(info)
	v.add_child(UI.button("👊 보통 상사와 붙기", func(): _fight_round(false), "primary", 15))
	v.add_child(UI.button("🔥 화난 상사와 붙기 (더 빠름)", func(): _fight_round(true), "pink", 14))
	var snd := UI.button("🔇 소리 켜기" if Sfx.muted() else "🔊 소리 끄기", Callable(), "normal", 12)
	snd.pressed.connect(func(): snd.text = "🔇 소리 켜기" if Sfx.toggle() else "🔊 소리 끄기")
	v.add_child(snd)

func _fight_round(hostile: bool) -> void:
	var res: String = await run_minigame("MG_801", _boss_profile(), hostile)
	fight_record.play += 1
	if res != "fail":
		fight_record.win += 1
	fight_record.last = {"great": "완승!", "normal": "승리", "fail": "패배"}[res]
	screen_fight_lobby()

# ---------- 공용 ----------
func set_screen(c: Control) -> void:
	if screen:
		screen.queue_free()
	screen = c
	c.theme = UI.theme()
	UI.full(c)
	ui_layer.add_child(c)

func overlay_root() -> Control:
	return overlay.get_child(0)

func toast(text: String, tone := "info") -> void:
	var bg: Color = {"good": Color("#d9fbe8"), "bad": Color("#ffe0e6"), "info": Color("#fff6d6")}.get(tone, Color.WHITE)
	var p := UI.tag(text, bg, UI.INK, 12)
	p.get_child(0).autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	toast_box.add_child(p)
	if toast_box.get_child_count() > 3:
		toast_box.get_child(0).queue_free()
	p.modulate.a = 0
	var tw := p.create_tween()
	tw.tween_property(p, "modulate:a", 1.0, 0.15)
	tw.tween_interval(2.4)
	tw.tween_property(p, "modulate:a", 0.0, 0.3)
	tw.tween_callback(p.queue_free)

## 가운데 창. body에 내용을 넣고, 닫을 때 root.queue_free().
func modal(title := "", width := 320) -> Dictionary:
	var root := UI.full(Control.new())
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(UI.full(UI.color_rect(Color(0.07, 0.05, 0.18, 0.6))))
	var center := UI.full(CenterContainer.new())
	root.add_child(center)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(mini(width, int(get_viewport().get_visible_rect().size.x) - 24), 0)
	center.add_child(panel)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(0, 0)
	panel.add_child(scroll)
	var body := UI.vbox(8)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)
	if title != "":
		body.add_child(UI.label(title, 15, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	overlay_root().add_child(root)
	# 화면보다 길면 스크롤
	var fit := func():
		var maxh := get_viewport().get_visible_rect().size.y - 60
		scroll.custom_minimum_size.y = minf(body.get_combined_minimum_size().y, maxh)
	body.minimum_size_changed.connect(fit)
	fit.call_deferred()
	panel.scale = Vector2(0.9, 0.9)
	panel.pivot_offset = Vector2(panel.custom_minimum_size.x / 2, 100)
	panel.create_tween().tween_property(panel, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK)
	return {"root": root, "body": body}

## 확인 버튼 하나짜리 알림창
func alert(title: String, text: String, btn := "확인") -> void:
	var m := modal(title)
	m.body.add_child(UI.label(text, 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var b := UI.button(btn, Callable(), "primary")
	m.body.add_child(b)
	await b.pressed
	Sfx.play("pick")
	m.root.queue_free()

func screen_bg(c1: Color, c2: Color) -> Control:
	var root := Control.new()
	var g := Gradient.new()
	g.set_color(0, c1)
	g.set_color(1, c2)
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(0.3, 1)
	var tr := TextureRect.new()
	tr.texture = gt
	tr.stretch_mode = TextureRect.STRETCH_SCALE
	UI.full(tr)
	root.add_child(tr)
	return root

func scroll_column(root: Control, sep := 10) -> VBoxContainer:
	var sc := UI.full(ScrollContainer.new())
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(sc)
	var margin := MarginContainer.new()
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for k in ["left", "right"]:
		margin.add_theme_constant_override("margin_" + k, 18)
	margin.add_theme_constant_override("margin_top", 26)
	margin.add_theme_constant_override("margin_bottom", 26)
	sc.add_child(margin)
	var v := UI.vbox(sep)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	margin.add_child(v)
	return v

# ---------- 타이틀 ----------
func screen_title() -> void:
	_leave_world()
	var root := Control.new()
	var bg := TextureRect.new()
	bg.texture = load("res://assets/img/map.png")
	bg.stretch_mode = TextureRect.STRETCH_KEEP
	bg.position = Vector2(-1180, -1040)
	bg.scale = Vector2(1, 1)
	root.add_child(bg)
	var tw := bg.create_tween().set_loops()
	tw.tween_property(bg, "position", Vector2(-1500, -900), 30.0)
	tw.tween_property(bg, "position", Vector2(-1180, -1040), 30.0)
	root.add_child(UI.full(UI.color_rect(Color(0.1, 0.07, 0.25, 0.45))))
	set_screen(root)
	var v := UI.vbox(10)
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 24
	v.offset_right = -24
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_child(v)
	var logo := UI.outlined(UI.label("선택의\n연속", 44, UI.YELLOW, HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 10)
	v.add_child(logo)
	v.add_child(UI.outlined(UI.label("유딩부터 노인까지, 오늘의 운세를 보고\n말 한마디로 인생을 헤쳐 나가라", 13, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 6))
	var chars := UI.hbox(4)
	chars.alignment = BoxContainer.ALIGNMENT_CENTER
	for pair in [["t_kim", "HAPPY"], ["mom", "ANGRY"], ["boss", "SUSPECT"]]:
		var p := PortraitView.new(npc_look(pair[0]), 1)
		p.custom_minimum_size = Vector2(96, 96)
		p.px = 1
		var holder := PanelContainer.new()
		holder.add_theme_stylebox_override("panel", UI.box(Color("#fff6e0"), UI.INK, 2, 2, 3))
		var pv := PortraitView.new(npc_look(pair[0]), 1)
		pv.set_emotion(pair[1])
		holder.add_child(pv)
		chars.add_child(holder)
	v.add_child(chars)
	v.add_child(UI.spacer(10))
	var has: bool = Game.save.realProfile != null
	if has:
		v.add_child(UI.button("이어하기", enter_world, "primary", 15))
	v.add_child(UI.button("처음부터 다시" if has else "시작하기", func():
		if has:
			Game.clear_save()
		screen_birth(), "normal" if has else "primary", 15))
	v.add_child(UI.spacer(6))
	v.add_child(UI.outlined(UI.label("유딩부터 노인까지, 말 한마디와 미니게임으로 인생을 살아 내요. 운세는 재미로 보는 거예요. 입력한 생년월일은 이 기기에만 저장돼요.", 10, Color("#e8e2ff"), HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 4))

func npc_look(id: String) -> Dictionary:
	for st in Stages.LIST:
		if st.npc.id == id and not st.npc.look.is_empty():
			return Pix.full_look(st.npc.look)
	for n in Game.data.npcs:
		if n.id == id:
			return Pix.full_look(n.look)
	return Pix.DEFAULT_LOOK.duplicate()

# ---------- 생년월일 ----------
func _stepper(label_text: String, value: int, lo: int, hi: int, on_change: Callable) -> HBoxContainer:
	var h := UI.hbox(6)
	var l := UI.label(label_text, 12, UI.INK, HORIZONTAL_ALIGNMENT_LEFT, false)
	l.custom_minimum_size = Vector2(70, 0)
	h.add_child(l)
	var val := UI.label(str(value), 16, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER, false)
	val.custom_minimum_size = Vector2(70, 0)
	var cur := [value]
	var set_v := func(d: int):
		cur[0] = clampi(cur[0] + d, lo, hi)
		val.text = str(cur[0])
		on_change.call(cur[0])
	for d in [-10, -1]:
		if d == -10 and hi - lo < 20: continue
		h.add_child(UI.button("◀◀" if d == -10 else "◀", func(): set_v.call(d)))
	h.add_child(val)
	for d in [1, 10]:
		if d == 10 and hi - lo < 20: continue
		h.add_child(UI.button("▶" if d == 1 else "▶▶", func(): set_v.call(d)))
	return h

func screen_birth() -> void:
	var root := screen_bg(Color("#fff3d6"), Color("#ffd6e0"))
	set_screen(root)
	var v := scroll_column(root)
	v.add_child(UI.label("나의 인생 시작하기", 18, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label("생년월일로 타고난 기운을 보고, 매일 아침 오늘의 운세를 봐요. 6살 유치원생부터 시작해요!", 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	var p := {"birthYear": 1995, "birthMonth": 1, "birthDay": 1}
	var derived := UI.label("", 13, UI.INK, HORIZONTAL_ALIGNMENT_CENTER)
	var update := func():
		var stem: int = posmod(int(p.birthYear) - 4, 10)
		derived.text = "%s띠 · 타고난 기운: %s(%s)" % [Game.data.zodiacKr[Game.zodiac_kr(int(p.birthYear))], Game.ELEMENTS5[stem / 2], Game.ELEMENT5_HANJA[stem / 2]]
	var panel := PanelContainer.new()
	var pv := UI.vbox(8)
	panel.add_child(pv)
	pv.add_child(_stepper("태어난 해", 1995, 1950, 2015, func(x): p.birthYear = x; update.call()))
	pv.add_child(_stepper("월", 1, 1, 12, func(x): p.birthMonth = x; update.call()))
	pv.add_child(_stepper("일", 1, 1, 31, func(x): p.birthDay = x; update.call()))
	v.add_child(panel)
	v.add_child(derived)
	update.call()
	var life := PanelContainer.new()
	var lv := UI.vbox(4)
	life.add_child(lv)
	lv.add_child(UI.label("인생 스테이지", 12, UI.PINK, HORIZONTAL_ALIGNMENT_CENTER))
	var names := []
	for st in Stages.LIST:
		names.append(st.label)
	lv.add_child(UI.label(" → ".join(names), 12, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	lv.add_child(UI.label("스테이지 미션을 깨면 나이를 먹어요.", 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(life)
	v.add_child(UI.button("👶 이 생년월일로 태어나기", func():
		Game.save.realProfile = p
		Game.save.personaId = "REAL"
		Game.save.world = null
		Game.apply_outfit()
		Game.persist()
		enter_world(), "primary", 15))

func enter_world() -> void:
	if Game.save.realProfile == null:
		return screen_birth()
	if screen:
		screen.queue_free()
		screen = null
	if world == null:
		world = WorldScript.new()
		add_child(world)
	world.visible = true
	world.resume()

## 나이를 먹으면 동네(스테이지 NPC·위험물 길)를 새로 꾸민다
func restart_world() -> void:
	_leave_world()
	enter_world()

## 보상형 광고 자리 (실제 앱에서는 광고 SDK)
func fake_ad() -> void:
	var md: Dictionary = modal("📺 광고 (테스트)")
	md.body.add_child(UI.label("실제 앱에서는 여기서 보상형 광고가 나와요.", 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	await get_tree().create_timer(1.2).timeout
	md.root.queue_free()

func _leave_world() -> void:
	if world:
		world.queue_free()
		world = null

func hide_world() -> void:
	if world:
		world.pause(true)
		world.visible = false
		world.hud_visible(false)

func show_world() -> void:
	if world:
		world.visible = true
		world.hud_visible(true)
		world.pause(false)

## 미션을 실행하고 등급을 돌려준다.
func run_mission(id: String) -> String:
	var m: Dictionary = Stages.missions().get(id, {})
	if m.is_empty():
		for x in Game.data.missions:
			if x.id == id:
				m = x.duplicate(true)
		if id == "MS_301":
			m.chapter = "6단계 · 직장인 (30살)"
	hide_world()
	var runner = MissionScript.new(m)
	set_screen(runner)
	var grade: String = await runner.finished
	screen.queue_free()
	screen = null
	show_world()
	return grade

## 미니게임: 준비 화면 → 게임 → 결과
func run_minigame(id: String, npc = null, hostile := false) -> String:
	var def
	if MG.has(id):
		def = MG[id].new()
	else:
		var cfg: Dictionary = Stages.MG[id]
		def = ENGINE[cfg.engine].new()
		def.configure(cfg)
	var root := UI.full(Control.new())
	root.theme = UI.theme()
	root.mouse_filter = Control.MOUSE_FILTER_STOP
	root.add_child(UI.full(UI.color_rect(Color("#1d1430"))))
	overlay_root().add_child(root)
	var center := UI.full(CenterContainer.new())
	root.add_child(center)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(300, 0)
	center.add_child(panel)
	var v := UI.vbox(10)
	panel.add_child(v)
	v.add_child(UI.label("미니게임", 12, UI.PINK, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label(def.title, 20, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label(def.how_to, 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var go := UI.button("시작!", Callable(), "primary", 16)
	v.add_child(go)
	await go.pressed
	Sfx.play("pick")
	center.queue_free()
	var stage := UI.full(Control.new())
	root.add_child(stage)
	if npc == null:
		npc = {}
	var res: String = await def.run(stage, npc, hostile)
	Sfx.play("bad" if res == "fail" else "good")
	var txt: String = {"great": "대성공!", "normal": "성공!", "fail": "실패…"}[res]
	var big := UI.outlined(UI.label(txt, 40, UI.YELLOW if res != "fail" else Color("#9fb4c7"), HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 10)
	big.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	big.grow_horizontal = Control.GROW_DIRECTION_BOTH
	big.grow_vertical = Control.GROW_DIRECTION_BOTH
	root.add_child(big)
	big.pivot_offset = big.size / 2
	big.scale = Vector2(2, 2)
	big.create_tween().tween_property(big, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK)
	await get_tree().create_timer(1.1).timeout
	root.queue_free()
	return res

# ---------- 테스트용 조종 (웹에서만) ----------
func _setup_debug() -> void:
	if not OS.has_feature("web"):
		return
	_js_cb = JavaScriptBridge.create_callback(_on_js)
	var win = JavaScriptBridge.get_interface("window")
	win.godotCmd = _js_cb
	JavaScriptBridge.eval("window.__gstate = '{}'; window.__gready = true;", true)

func _on_js(args: Array) -> void:
	var cmd = JSON.parse_string(str(args[0]))
	var out := {}
	match cmd.get("op", ""):
		"press":
			out.ok = _press(str(cmd.text), get_tree().root)
		"state":
			pass
		"set":
			for k in cmd.world:
				Game.w()[k] = cmd.world[k]
			if cmd.has("battery"):
				Game.save.battery = cmd.battery
			Game.persist()
		"tp":
			if world:
				world.teleport(Vector2(cmd.x, cmd.z))
		"mg":
			run_minigame.call_deferred(str(cmd.id))
		"buttons":
			out.buttons = _buttons(get_tree().root)
		"dbg":
			out.boxes = []
			for d in get_tree().root.find_children("*", "PanelContainer", true, false):
				if not d is DialogueBox: continue
				out.boxes.append({"text": d.text.text, "vc": d.text.visible_characters, "size": str(d.text.size), "vis": d.text.is_visible_in_tree(), "typing": d._typing, "wait": d._wait, "mod": str(d.text.modulate), "scale": str(d.text.scale), "pos": str(d.text.global_position)})
	out.world = Game.save.world
	out.screen = screen.get_class() if screen else "world"
	out.inWorld = world != null and world.visible
	if world:
		out.player = [world.player_tile().x, world.player_tile().y]
		out.paused = world.paused
		out.fortune = world.fortune
		out.hazards = world.hazards.size()
		out.ride = world.ride
	JavaScriptBridge.eval("window.__gstate = " + JSON.stringify(JSON.stringify(out)) + ";", true)

func _press(text: String, n: Node) -> bool:
	for c in n.get_children():
		if c is BaseButton and c.is_visible_in_tree() and not c.disabled and (c.text if c is Button else "").contains(text):
			c.emit_signal("pressed")
			return true
		if _press(text, c):
			return true
	return false

func _buttons(n: Node) -> Array:
	var out := []
	for c in n.get_children():
		if c is Button and c.is_visible_in_tree():
			out.append(c.text)
		out.append_array(_buttons(c))
	return out
