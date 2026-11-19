## 대사 상자: 이름표 + 한 글자씩 찍히는 글자. '!'로 끝나는 문장과 *강조*는 쾅 찍히며 화면이 흔들린다.
class_name DialogueBox
extends PanelContainer

signal tapped

var nameplate: PanelContainer
var name_label: Label
var text: Label
var next_ind: Label
var shake_target: Control
var _typing := false
var _skip := false
var _wait := false

func _init() -> void:
	add_theme_stylebox_override("panel", UI.box(UI.PAPER, UI.INK, 3, 10, 4))
	custom_minimum_size = Vector2(0, 104)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var v := UI.vbox(4)
	add_child(v)
	nameplate = PanelContainer.new()
	nameplate.add_theme_stylebox_override("panel", UI.box(UI.NAVY, UI.INK, 2, 4))
	nameplate.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	name_label = UI.label("", 12, Color.WHITE, HORIZONTAL_ALIGNMENT_LEFT, false)
	nameplate.add_child(name_label)
	v.add_child(nameplate)
	text = UI.label("", 13, UI.INK)
	text.custom_minimum_size = Vector2(0, 54)
	text.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	text.add_theme_constant_override("line_spacing", 3)
	text.visible_characters_behavior = TextServer.VC_CHARS_AFTER_SHAPING
	text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(text)
	next_ind = UI.label("▼", 10, UI.PINK, HORIZONTAL_ALIGNMENT_RIGHT)
	next_ind.visible = false
	v.add_child(next_ind)
	gui_input.connect(_on_input)

func _on_input(e: InputEvent) -> void:
	if (e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT) or (e is InputEventScreenTouch and e.pressed):
		_tap()

func _unhandled_key_input(e: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	if e.pressed and not e.echo and (e.keycode == KEY_SPACE or e.keycode == KEY_ENTER or e.keycode == KEY_Z):
		_tap()

func _tap() -> void:
	if _typing:
		_skip = true
	elif _wait:
		tapped.emit()

func _process(dt: float) -> void:
	if next_ind.visible:
		next_ind.modulate.a = 0.4 + 0.6 * absf(sin(Time.get_ticks_msec() / 250.0))

static var _fast = null

## 테스트용: 주소에 ?fasttext 가 있으면 글자를 한 번에 보여 준다
static func fast_text() -> bool:
	if _fast == null:
		_fast = OS.has_feature("web") and str(JavaScriptBridge.eval("location.search.indexOf('fasttext') >= 0", true)).to_lower() in ["true", "1"]
	return _fast

static func to_bbcode(s: String) -> String:
	var out := ""
	var on := false
	for ch in s:
		if ch == "*":
			out += "[b][color=#d6334f]" if not on else "[/color][/b]"
			on = not on
		elif ch == "[":
			out += "[lb]"
		else:
			out += ch
	if on:
		out += "[/color][/b]"
	return out

## 대사를 찍는다. portrait가 있으면 말하는 동안 입을 움직인다.
func type_line(who: String, line: String, portrait: PortraitView = null, me := false) -> void:
	name_label.text = who
	nameplate.add_theme_stylebox_override("panel", UI.box(UI.BLUE if me else UI.NAVY, UI.INK, 2, 4))
	# *강조*는 「」로 감싸 보여 주고, 그 부분이 찍힐 때 쾅 울린다
	var plain := line.replace("*", "")
	var emph := []
	var on := false
	var shown := ""
	for ch in line:
		if ch == "*":
			shown += "」" if on else "「"
			on = not on
			continue
		emph.append(on)
		shown += ch
	plain = shown
	text.text = shown
	text.visible_characters = 0
	next_ind.visible = false
	_typing = true
	_skip = false
	if portrait:
		portrait.talking = true
	var fast := fast_text()
	var i := 0
	var pitch := 0.9 if me else 1.15
	while i < plain.length():
		if _skip or fast:
			break
		i += 1
		text.visible_characters = i
		var ch := plain[i - 1]
		if ch != " " and i % 2 == 0:
			Sfx.play("blip" if not me else "blip_low", pitch + randf() * 0.1)
		var delay := 0.034
		if ch in ".?…":
			delay = 0.16
		elif ch == ",":
			delay = 0.09
		elif ch == "!" or ch == "」":
			delay = 0.2
			_stamp()
		await get_tree().create_timer(delay).timeout
		if not is_inside_tree():
			return
	text.visible_characters = -1
	_typing = false
	if portrait:
		portrait.talking = false
	if line.contains("*") or (line.ends_with("!") and _skip):
		pass

func _stamp() -> void:
	Sfx.play("stamp")
	var tw := create_tween()
	text.pivot_offset = text.size / 2
	tw.tween_property(text, "scale", Vector2(1.04, 1.04), 0.04)
	tw.tween_property(text, "scale", Vector2.ONE, 0.08)
	shake(shake_target if shake_target else self)

static func shake(c: Control, amount := 4.0) -> void:
	if not is_instance_valid(c):
		return
	var base := c.position
	var tw := c.create_tween()
	for k in 5:
		tw.tween_property(c, "position", base + Vector2(randf_range(-amount, amount), randf_range(-amount, amount) * 0.5), 0.03)
	tw.tween_property(c, "position", base, 0.03)

func wait_tap() -> void:
	next_ind.visible = true
	_wait = true
	await tapped
	_wait = false
	next_ind.visible = false
	Sfx.play("pick")
