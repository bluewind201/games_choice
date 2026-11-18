## 대화 초상화 (64x64 도트를 정수 배율로 키워 그린다). 말하는 동안 입이 움직이고 가끔 눈을 깜빡인다.
class_name PortraitView
extends Control

var look: Dictionary = {}
var emotion := "NORMAL"
var talking := false
var px := 2
var _mouth := false
var _blink := false
var _t := 0.0
var _next_blink := 2.0
var _bounce := 0.0

func _init(l: Dictionary = {}, scale_px := 2) -> void:
	look = l
	px = scale_px
	custom_minimum_size = Vector2(64, 64) * px
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func set_emotion(e: String) -> void:
	if e != emotion:
		_bounce = 1.0
	emotion = e
	queue_redraw()

func set_look(l: Dictionary) -> void:
	look = l
	queue_redraw()

func _process(dt: float) -> void:
	_t += dt
	var m := talking and int(_t * 9) % 2 == 0
	var b := _t > _next_blink and _t < _next_blink + 0.12
	if _t > _next_blink + 0.12:
		_next_blink = _t + randf_range(2.0, 4.5)
	if _bounce > 0:
		_bounce = maxf(0, _bounce - dt * 5)
		queue_redraw()
	if m != _mouth or b != _blink:
		_mouth = m
		_blink = b
		queue_redraw()

func _draw() -> void:
	var off := -roundf(sin(_bounce * PI) * 3) * px
	var ox := (size.x - 64 * px) / 2.0
	Pix.draw_portrait(self, look, emotion, _mouth, _blink, px, ox, size.y - 64 * px + off)
