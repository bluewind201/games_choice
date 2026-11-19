## 미니게임 공통: 위쪽 정보줄(남은 시간·제목·목표), 가운데 놀이판, 아래 조작부.
extends RefCounted

signal done(result: String)

var title := ""
var how_to := ""
var time_sec := 10.0
var root: Control
var timer_label: Label
var goal_label: Label
var play: Control
var control: VBoxContainer
var npc: Dictionary
var hostile := false
var finished := false

## 나이(스테이지)가 올라갈수록 조금씩 빨라진다
static func speed_factor(_p: Dictionary) -> float:
	return 1.0 + 0.04 * int(Game.w().get("stage", 0))

func build(stage: Control) -> void:
	root = stage
	var v := UI.vbox(8)
	UI.full(v)
	v.offset_left = 10
	v.offset_right = -10
	v.offset_top = 10
	v.offset_bottom = -14
	root.add_child(v)
	var top := PanelContainer.new()
	top.add_theme_stylebox_override("panel", UI.box(Color(0.11, 0.08, 0.25), UI.INK, 2, 6))
	var h := UI.hbox(8)
	top.add_child(h)
	timer_label = UI.label("10.0", 18, UI.YELLOW, HORIZONTAL_ALIGNMENT_LEFT, false)
	timer_label.custom_minimum_size = Vector2(52, 0)
	h.add_child(timer_label)
	var t := UI.label(title, 12, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, false)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(t)
	goal_label = UI.label("", 12, UI.MINT, HORIZONTAL_ALIGNMENT_RIGHT, false)
	h.add_child(goal_label)
	v.add_child(top)
	play = Control.new()
	play.size_flags_vertical = Control.SIZE_EXPAND_FILL
	play.clip_contents = true
	v.add_child(play)
	control = UI.vbox(6)
	v.add_child(control)

func set_timer(left: float, danger := 3.0) -> void:
	timer_label.text = "%.1f" % maxf(0, left)
	timer_label.add_theme_color_override("font_color", UI.PINK if left <= danger else UI.YELLOW)

func flash(good: bool) -> void:
	var r := UI.full(UI.color_rect(Color(0.3, 1, 0.6, 0.25) if good else Color(1, 0.2, 0.3, 0.3)))
	root.add_child(r)
	var tw := r.create_tween()
	tw.tween_property(r, "color:a", 0.0, 0.4)
	tw.tween_callback(r.queue_free)

func finish(r: String) -> void:
	if finished:
		return
	finished = true
	done.emit(r)

func now() -> float:
	return Time.get_ticks_msec() / 1000.0

func big_button(text: String, h := 64) -> Button:
	var b := UI.button(text, Callable(), "primary", 16)
	b.custom_minimum_size = Vector2(0, h)
	b.action_mode = BaseButton.ACTION_MODE_BUTTON_PRESS
	return b

func run(stage: Control, p: Dictionary, host: bool) -> String:
	npc = p
	hostile = host
	build(stage)
	start()
	return await done

func start() -> void:
	pass
