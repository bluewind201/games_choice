## 미션 화면: 장면 배경 + 큰 초상화 + 한 글자씩 대사. 맞춰주기/밀어붙이기, 미니게임, 결정적 한마디.
extends Control

signal finished(grade: String)
signal _picked(i: int)

const TACTIC_TAG := {"yield": "🙇 맞춰주기", "push": "⚡ 밀어붙이기"}
const SCENE := {"MS_301": "office", "MS_201": "pasta", "MS_101": "park"}
const NPC_OF := {"MS_301": "boss", "MS_201": "jiwoo", "MS_101": "hana"}

var m: Dictionary
var compat: Dictionary
var progress := 0
var patience := 0
var clock := 0
var battery := 100
var push_hits := 0
var push_total := 0
var guesses := {}
var observations: Array = []
var best_grade := "F"

var clock_label: Label
var prog_bar: ProgressBar
var pat_bar: ProgressBar
var bat_bar: ProgressBar
var nums := {}
var note_btn: Button
var scene_tex: TextureRect
var portrait: PortraitView
var box: DialogueBox
var choices: VBoxContainer
var body: VBoxContainer

func _init(mission: Dictionary) -> void:
	m = mission

func _ready() -> void:
	_intro()

func _clear() -> void:
	for c in get_children():
		c.queue_free()

func _bg(color := Color("#e6ecf2")) -> void:
	add_child(UI.full(UI.color_rect(color)))

func _npc_look() -> Dictionary:
	return Main.inst.npc_look(NPC_OF.get(m.id, "boss"))

func _intro() -> void:
	_clear()
	var player = Game.active_profile()
	compat = Game.compute_compat(player, m.npc, int(m.level))
	progress = 0
	patience = clampi(compat.initFavor + 20, 30, 90)
	clock = int(m.startClock)
	battery = int(Game.save.battery)
	push_hits = 0
	push_total = 0
	guesses = {}
	observations = []
	_bg(Color("#efe9f7"))
	var v: VBoxContainer = Main.inst.scroll_column(self, 8)
	v.add_child(UI.label(m.chapter, 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label(m.title, 20, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	var pv := PortraitView.new(_npc_look(), 2)
	pv.set_emotion(m.beats[0].emotion)
	pv.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(pv)
	v.add_child(UI.label("%s · %s" % [m.npcName, m.npcRole], 13, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label(m.intro, 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var goal := PanelContainer.new()
	goal.add_theme_stylebox_override("panel", UI.box(Color("#fff3c4"), UI.INK, 2, 8))
	var gv := UI.vbox(3)
	goal.add_child(gv)
	gv.add_child(UI.label("🎯 미션: " + m.mission, 13, UI.NAVY))
	for c in m.conditions:
		gv.add_child(UI.label("· " + c, 11, UI.INK))
	v.add_child(goal)
	var cp := PanelContainer.new()
	var cv := UI.vbox(3)
	cp.add_child(cv)
	cv.add_child(UI.label("첫인상 궁합 (상대 성향은 비밀!)", 12, UI.NAVY))
	for l in compat.layers:
		var row := UI.hbox(4)
		var a := UI.label(Game.LAYER_NAME[l.layer], 11, UI.MUTED, HORIZONTAL_ALIGNMENT_LEFT, false)
		a.custom_minimum_size = Vector2(60, 0)
		row.add_child(a)
		var b := UI.label(l.label, 11, UI.INK, HORIZONTAL_ALIGNMENT_LEFT, false)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(b)
		row.add_child(UI.label(("+%d" if l.favor >= 0 else "%d") % l.favor, 11, UI.GOOD if l.favor >= 0 else UI.BAD, HORIZONTAL_ALIGNMENT_RIGHT, false))
		cv.add_child(row)
	cv.add_child(UI.label("시작 %s %d · 감소 배율 ×%s" % [m.patienceLabel, patience, str(compat.batteryMult)], 12, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(cp)
	v.add_child(UI.label("🙇 맞춰주기는 안전하지만 시간이 들고 미션이 안 나아가요. ⚡ 밀어붙이기는 빠르지만, 상대 성향에 안 맞으면 %s이(가) 크게 깎여요. 🔍추리수첩으로 상대를 읽으세요." % m.patienceLabel, 11, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.button("작전 시작", func(): _shell(); _play(0), "primary", 15))

func _shell() -> void:
	_clear()
	_bg(Color("#1d1430"))
	body = UI.vbox(6)
	UI.full(body)
	body.offset_left = 8
	body.offset_right = -8
	body.offset_top = 8
	body.offset_bottom = -8
	add_child(body)
	var bars := PanelContainer.new()
	bars.add_theme_stylebox_override("panel", UI.box(Color(0.11, 0.08, 0.25), UI.INK, 2, 6))
	body.add_child(bars)
	var bv := UI.vbox(3)
	bars.add_child(bv)
	var top := UI.hbox(6)
	bv.add_child(top)
	top.add_child(UI.label("마감까지", 10, Color("#c9c1ff"), HORIZONTAL_ALIGNMENT_LEFT, false))
	clock_label = UI.label("", 14, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, false)
	clock_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(clock_label)
	note_btn = UI.button("🔍 수첩 0", _open_notebook, "primary", 11)
	top.add_child(note_btn)
	var snd := UI.button("🔇" if Sfx.muted() else "🔊", Callable(), "normal", 11)
	snd.pressed.connect(func(): snd.text = "🔇" if Sfx.toggle() else "🔊")
	top.add_child(snd)
	var mk := func(name: String, col: Color) -> ProgressBar:
		var row := UI.hbox(4)
		var l := UI.label(name, 10, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, false)
		l.custom_minimum_size = Vector2(76, 0)
		row.add_child(l)
		var g := UI.gauge(col, 10)
		g.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		g.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		row.add_child(g)
		var n := UI.label("", 10, Color.WHITE, HORIZONTAL_ALIGNMENT_RIGHT, false)
		n.custom_minimum_size = Vector2(24, 0)
		row.add_child(n)
		nums[name] = n
		bv.add_child(row)
		return g
	prog_bar = mk.call("🎯 미션", Color("#ffd166"))
	pat_bar = mk.call("😤 " + m.patienceLabel.split(" ")[-1], Color("#ff6b81"))
	bat_bar = mk.call("🔋 배터리", Color("#43d39e"))
	# 장면
	var scene := Control.new()
	scene.custom_minimum_size = Vector2(0, 230)
	scene.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scene.clip_contents = true
	body.add_child(scene)
	scene_tex = UI.full(TextureRect.new())
	var tag := "day" if clock < 17 * 60 + 30 else ("dusk" if clock < 19 * 60 + 30 else "night")
	scene_tex.texture = load("res://assets/img/scene_%s_%s.png" % [SCENE.get(m.id, "office"), tag])
	scene_tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	scene_tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	scene.add_child(scene_tex)
	portrait = PortraitView.new(_npc_look(), 3)
	portrait.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	portrait.offset_left = -96
	portrait.offset_right = 96
	portrait.offset_top = -192
	portrait.offset_bottom = 0
	scene.add_child(portrait)
	var chip := UI.tag("🎯 " + m.mission, Color(1, 1, 1, 0.9), UI.INK, 10)
	chip.position = Vector2(6, 6)
	scene.add_child(chip)
	box = DialogueBox.new()
	box.shake_target = body
	body.add_child(box)
	choices = UI.vbox(6)
	body.add_child(choices)
	_bars()

func _bars() -> void:
	progress = clampi(progress, 0, 100)
	patience = clampi(patience, 0, 100)
	battery = clampi(battery, 0, 100)
	var left: int = int(m.deadline) - clock
	clock_label.text = "%s (%s)" % [Game.clock_text(clock), ("%d분 남음" % left) if left >= 0 else "초과!"]
	clock_label.add_theme_color_override("font_color", UI.PINK if left <= 15 else Color.WHITE)
	prog_bar.value = progress
	pat_bar.value = patience
	bat_bar.value = battery
	var keys := nums.keys()
	nums[keys[0]].text = str(progress)
	nums[keys[1]].text = str(patience)
	nums[keys[2]].text = str(battery)
	note_btn.text = "🔍 수첩 %d" % observations.size()

func _over() -> bool:
	return patience <= 0 or clock > int(m.deadline)

func _say(who: String, text: String, emotion := "", me := false) -> void:
	if emotion != "" and not me:
		portrait.set_emotion(emotion)
	await box.type_line(who if not me else Game.active_name(), text, null if me else portrait, me)

static func p_delta(base: float, mult: float) -> int:
	return roundi(base * mult) if base < 0 else roundi(base)

func _pick(opts: Array) -> int:
	for c in choices.get_children():
		c.queue_free()
	for i in opts.size():
		var b := UI.button(opts[i], func(): _picked.emit(i), "normal", 11)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		choices.add_child(b)
	var k: int = await _picked
	for c in choices.get_children():
		c.queue_free()
	return k

func _wait(label := "▶ 계속") -> void:
	await box.wait_tap()

func _play(i: int) -> void:
	while i < m.beats.size() and not _over():
		var beat: Dictionary = m.beats[i]
		await _say(m.npcName, beat.line, beat.emotion)
		for o in beat.observations:
			observations.append(o)
		_bars()
		Main.inst.toast("🔍 관찰 %d개를 추리수첩에 적었다" % beat.observations.size(), "info")
		if beat.get("minigame") != null:
			await _wait()
			var mg: Dictionary = beat.minigame
			var hostile: bool = compat.batteryMult >= 1.3
			var res: String = await Main.inst.run_minigame(mg.id, m.npc, hostile)
			clock += int(mg.minutes)
			var gain: int = int(mg.progress[res])
			progress += gain
			if res == "fail":
				patience += p_delta(mg.failPatience, compat.batteryMult)
			_bars()
			Main.inst.toast("실패… %s이(가) 깎였다" % m.patienceLabel if res == "fail" else "%s 미션 +%d" % ["대성공!" if res == "great" else "성공!", gain], "bad" if res == "fail" else "good")
		elif beat.get("objection") != null:
			await _objection(beat.objection)
		elif beat.get("options") != null:
			var opts: Array = beat.options.duplicate()
			opts.shuffle()
			var labels := []
			for o in opts:
				labels.append("%s · %s · ⏱%d분\n%s" % [TACTIC_TAG[o.tactic], o.approach, o.minutes, o.text])
			var o: Dictionary = opts[await _pick(labels)]
			var pd := p_delta(o.patience, compat.batteryMult)
			var kind := "mask" if o.tactic == "yield" else "match"
			var bd := -roundi({"mask": 12, "match": 6}[kind] * compat.batteryMult)
			progress += int(o.progress)
			patience += pd
			clock += int(o.minutes)
			battery += bd
			if o.tactic == "push":
				push_total += 1
				if o.patience >= 0:
					push_hits += 1
			_bars()
			await _say("", o.text, "", true)
			var bad: bool = pd < 0 or o.progress < 0
			Main.inst.toast("%s · 미션 %+d · %s %+d · %d분" % [o.approach, o.progress, m.patienceLabel.split(" ")[-1], pd, o.minutes], "bad" if bad else "good")
			if bad:
				Sfx.play("bad")
				DialogueBox.shake(body, 5)
			else:
				Sfx.play("good")
			await _wait()
			await _say(m.npcName, o.reaction, o.emotion)
		if battery <= 0 and not await _burnout():
			break
		await _wait()
		i += 1
	_finish()

func _burnout() -> bool:
	var md: Dictionary = Main.inst.modal("🪫 배터리 방전!")
	md.body.add_child(UI.label("사회적 에너지가 바닥났어요. 광고를 보고 배터리를 30 채울 수 있어요.", 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var res := [false]
	md.body.add_child(UI.button("📺 광고 보고 배터리 +30", func(): res[0] = true; md.root.queue_free(), "primary"))
	md.body.add_child(UI.button("포기하기", func(): md.root.queue_free()))
	await md.root.tree_exited
	if res[0]:
		await _fake_ad()
		battery += 30
		_bars()
	return res[0]

func _fake_ad() -> void:
	var md: Dictionary = Main.inst.modal("광고 (테스트)")
	md.body.add_child(UI.label("실제 앱에서는 여기서 보상형 광고가 나와요.", 12, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	await get_tree().create_timer(1.2).timeout
	md.root.queue_free()

func _objection(o: Dictionary) -> void:
	for c in choices.get_children():
		c.queue_free()
	var go := [false]
	var nb := UI.button("🔍 추리수첩 다시 보기", _open_notebook)
	var ob := UI.button("%s 결정적 한마디" % o.shout, func(): go[0] = true; _picked.emit(0), "pink", 14)
	choices.add_child(nb)
	choices.add_child(ob)
	await _picked
	for c in choices.get_children():
		c.queue_free()
	var md: Dictionary = Main.inst.modal("무엇을 제시할까?")
	var chosen := [""]
	for e in o.evidence:
		var b := UI.button("%s %s\n%s" % [e.icon, e.name, e.desc], func(): chosen[0] = e.id; md.root.queue_free(), "normal", 11)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		md.body.add_child(b)
	await md.root.tree_exited
	await _cut_in(o.shout)
	clock += int(o.minutes)
	var acc := _accuracy()
	if chosen[0] == o.correctId:
		var gain := roundi(o.progressBase + o.progressAccuracy * acc)
		progress += gain
		_bars()
		await _say("", o.playerLine, "", true)
		await _wait()
		await _say(m.npcName, o.successLine, "HAPPY")
		Main.inst.toast("결정적 한마디 성공! 미션 +%d (추리 정확도 %d%%)" % [gain, roundi(acc * 100)], "good")
		Sfx.play("good")
	else:
		var pd := p_delta(o.failPatience, compat.batteryMult)
		patience += pd
		_bars()
		await _say(m.npcName, o.failLine, "ANGRY")
		Main.inst.toast("역공당했다! %s %d" % [m.patienceLabel, pd], "bad")
		Sfx.play("bad")

func _cut_in(shout: String) -> void:
	var c := UI.full(Control.new())
	c.mouse_filter = Control.MOUSE_FILTER_STOP
	Main.inst.overlay_root().add_child(c)
	var stripes := UI.full(UI.color_rect(Color("#ff4f6d")))
	c.add_child(stripes)
	var l := UI.outlined(UI.label(shout, 44, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER), UI.INK, 12)
	l.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	l.grow_horizontal = Control.GROW_DIRECTION_BOTH
	l.grow_vertical = Control.GROW_DIRECTION_BOTH
	c.add_child(l)
	await get_tree().process_frame
	l.pivot_offset = l.size / 2
	l.scale = Vector2(3, 3)
	Sfx.play("stamp")
	var tw := c.create_tween()
	tw.tween_property(l, "scale", Vector2.ONE, 0.15).set_trans(Tween.TRANS_BACK)
	await tw.finished
	DialogueBox.shake(l, 10)
	await get_tree().create_timer(0.8).timeout
	c.queue_free()

func _dims() -> Array:
	return Game.data.dimsByLevel[int(m.level) - 1]

func _answer(key: String) -> String:
	var p: Dictionary = m.npc
	match key:
		"EI": return p.mbti[0]
		"SN": return p.mbti[1]
		"TF": return p.mbti[2]
		"JP": return p.mbti[3]
		"BLOOD": return p.blood
		"GEN": return Game.derive(p).gen
	return ""

func _accuracy() -> float:
	var dims := _dims()
	if dims.is_empty():
		return 0.0
	var ok := 0
	for d in dims:
		if guesses.get(d, "") == _answer(d):
			ok += 1
	return float(ok) / dims.size()

func _open_notebook() -> void:
	var md: Dictionary = Main.inst.modal("🔍 추리수첩 · " + m.npcName, 340)
	var b: VBoxContainer = md.body
	b.add_child(UI.label("관찰한 것", 12, UI.PINK))
	if observations.is_empty():
		b.add_child(UI.label("아직 없어요. 대화를 들으며 단서를 모아요.", 11, UI.MUTED))
	for o in observations:
		b.add_child(UI.label("· " + o, 11, UI.INK))
	b.add_child(UI.label("내 추리 (결정적 한마디의 위력이 정확도만큼 커져요)", 12, UI.PINK))
	for key in _dims():
		var def: Dictionary = Game.data.dims[key]
		b.add_child(UI.label(def.label, 11, UI.MUTED))
		var row := UI.hbox(4)
		var btns := []
		for opt in def.options:
			var bt := UI.button(opt.label, Callable(), "normal", 10)
			bt.toggle_mode = true
			bt.button_pressed = guesses.get(key, "") == opt.value
			bt.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			bt.add_theme_stylebox_override("pressed", UI.box(UI.YELLOW, UI.INK, 2, 7, 1))
			bt.add_theme_stylebox_override("hover_pressed", UI.box(UI.YELLOW, UI.INK, 2, 7, 1))
			btns.append(bt)
			bt.pressed.connect(func():
				Sfx.play("pick")
				guesses[key] = opt.value
				for x in btns: x.button_pressed = x == bt)
			row.add_child(bt)
		b.add_child(row)
	b.add_child(UI.button("닫기", func(): md.root.queue_free(), "primary"))

func _finish() -> void:
	progress = clampi(progress, 0, 100)
	patience = clampi(patience, 0, 100)
	var grade := "F"
	var fail := ""
	if battery <= 0:
		fail = "progress"
	elif patience <= 0:
		fail = "patience"
	elif clock > int(m.deadline):
		fail = "time"
	elif progress < 100:
		fail = "progress"
	else:
		grade = "S" if patience >= 60 else ("A" if patience >= 35 else "B")
	var rank := {"S": 4, "A": 3, "B": 2, "F": 1}
	if rank[grade] > rank[best_grade]:
		best_grade = grade
	var prev = Game.save.best.get(m.id)
	if prev == null or rank[grade] > rank[prev]:
		Game.save.best[m.id] = grade
	Game.save.battery = clampi(battery + 25, 0, 100)
	Game.persist()
	var ending: String = m.endings[{"patience": "F_patience", "time": "F_time", "progress": "F_progress"}.get(fail, grade)]
	_clear()
	_bg(Color("#efe9f7"))
	var v: VBoxContainer = Main.inst.scroll_column(self, 8)
	var gcol: Color = {"S": Color("#e2445c"), "A": Color("#e08a00"), "B": Color("#4f6dff"), "F": Color("#555")}[grade]
	var stamp := UI.tag(grade, Color.WHITE, gcol, 48)
	stamp.add_theme_stylebox_override("panel", UI.box(Color.WHITE, gcol, 4, 8))
	stamp.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(stamp)
	stamp.pivot_offset = Vector2(40, 40)
	stamp.scale = Vector2(2.5, 2.5)
	stamp.create_tween().tween_property(stamp, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK)
	Sfx.play("stamp")
	v.add_child(UI.label(m.clearTitle if grade != "F" else "미션 실패", 18, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(UI.label(ending, 12, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	for pair in [["🎯 미션 진행도", str(progress)], ["😤 남은 " + m.patienceLabel, str(patience)], ["⏰ 끝난 시각", Game.clock_text(clock)], ["⚡ 통한 밀어붙이기", "%d / %d" % [push_hits, push_total]]]:
		grid.add_child(UI.label(pair[0], 11, UI.MUTED, HORIZONTAL_ALIGNMENT_LEFT, false))
		grid.add_child(UI.label(pair[1], 13, UI.NAVY, HORIZONTAL_ALIGNMENT_RIGHT, false))
	var gp := PanelContainer.new()
	gp.add_child(grid)
	v.add_child(gp)
	var rv := PanelContainer.new()
	var rvv := UI.vbox(3)
	rv.add_child(rvv)
	rvv.add_child(UI.label("%s의 정체 · 추리 정확도 %d%%" % [m.npcName, roundi(_accuracy() * 100)], 12, UI.NAVY, HORIZONTAL_ALIGNMENT_CENTER))
	var tags := []
	for k in _dims():
		var ans := _answer(k)
		var lab := ans
		for o in Game.data.dims[k].options:
			if o.value == ans:
				lab = o.label
		tags.append(("✔ " if guesses.get(k, "") == ans else "✘ ") + lab)
	rvv.add_child(UI.label("  ".join(tags), 11, UI.INK, HORIZONTAL_ALIGNMENT_CENTER))
	rvv.add_child(UI.label(Game.describe(m.npc), 10, UI.MUTED, HORIZONTAL_ALIGNMENT_CENTER))
	v.add_child(rv)
	v.add_child(UI.button("다시 도전", _intro, "normal" if grade != "F" else "primary"))
	v.add_child(UI.button("🏘️ 동네로 돌아가기", func(): finished.emit(best_grade), "primary" if grade != "F" else "normal"))
