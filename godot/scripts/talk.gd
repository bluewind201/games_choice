## 동네 대화창: 화면 아래에 초상화 + 대사 상자 + 선택지.
class_name Talk
extends Control

signal picked(i: int)

var title_tag: PanelContainer
var portrait: PortraitView
var me_portrait: PortraitView
var box: DialogueBox
var choices: VBoxContainer

func _init(title := "") -> void:
	UI.full(self)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var dim := UI.full(UI.color_rect(Color(0.07, 0.05, 0.18, 0.35)))
	add_child(dim)
	var col := UI.vbox(6)
	col.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	col.offset_left = 10
	col.offset_right = -10
	col.offset_bottom = -12
	col.grow_vertical = Control.GROW_DIRECTION_BEGIN
	add_child(col)
	if title != "":
		title_tag = UI.tag(title, UI.YELLOW, UI.INK, 12)
		title_tag.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		col.add_child(title_tag)
	var row := Control.new()
	row.custom_minimum_size = Vector2(0, 128)
	col.add_child(row)
	portrait = PortraitView.new({}, 2)
	portrait.position = Vector2(4, 0)
	row.add_child(portrait)
	me_portrait = PortraitView.new({}, 2)
	me_portrait.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	me_portrait.position = Vector2(-132, 0)
	me_portrait.visible = false
	row.add_child(me_portrait)
	box = DialogueBox.new()
	box.shake_target = col
	col.add_child(box)
	choices = UI.vbox(6)
	col.add_child(choices)
	modulate.a = 0
	create_tween().tween_property(self, "modulate:a", 1.0, 0.15)

func _ready() -> void:
	me_portrait.position.x = size.x - 20 - 128

func say(who: String, look: Dictionary, emotion: String, line: String, me := false) -> void:
	var p := me_portrait if me else portrait
	me_portrait.visible = me
	portrait.visible = not me
	p.set_look(look)
	p.set_emotion(emotion)
	await box.type_line(who, line, p, me)

func wait_tap() -> void:
	await box.wait_tap()

func choose(options: Array) -> int:
	for c in choices.get_children():
		c.queue_free()
	for i in options.size():
		var b := UI.button(str(options[i]), func(): picked.emit(i), "normal", 12)
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		choices.add_child(b)
	var k: int = await picked
	for c in choices.get_children():
		c.queue_free()
	return k

func close() -> void:
	queue_free()
