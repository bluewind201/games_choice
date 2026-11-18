## 동네에 서 있는 것들 (사람·소품). 위치 = 발 밑, 화면 아래쪽일수록 앞에 그려진다.
class_name Actor
extends Node2D

var kind := "person"  # person, tree, lamp, cat, wallet, stone, puddle, dog, coin
var look: Dictionary = {}
var dir := 0
var moving := false
var on_bike := false
var idx := 0
var t := 0.0
var anim_speed := 7.0
var flash := 0.0  # 맞았을 때 깜빡임
var angry := false
var data: Dictionary = {}

func _init(k := "person") -> void:
	kind = k
	if kind == "tree" or kind == "lamp":
		set_process(false)

func _process(dt: float) -> void:
	t += dt
	if flash > 0:
		flash = maxf(0, flash - dt)
	if kind != "stone":
		queue_redraw()
	elif flash > 0 or t < 0.1:
		queue_redraw()

func _draw() -> void:
	match kind:
		"person":
			if flash > 0 and int(flash * 20) % 2 == 0:
				return
			var frame := int(t * anim_speed) % 2
			if on_bike:
				Pix.draw_bike(self, 0, 0, dir, t)
				Pix.draw_character(self, look, 0, -3, dir, 0, false)
			else:
				Pix.draw_character(self, look, 0, 0, dir, frame, moving)
		"tree":
			Pix.draw_tree(self, 0, 0)
		"lamp":
			Pix.draw_lamp(self, 0, 0)
		"cat":
			Pix.draw_cat(self, 0, 0, idx, t)
		"wallet":
			Pix.draw_wallet(self, 0, 0, t)
		"stone":
			Pix.draw_stone(self, 0, 0, flash)
		"puddle":
			Pix.draw_puddle(self, 0, 0, t)
		"dog":
			Pix.draw_dog(self, 0, 0, dir, int(t * 8) % 2 if moving else 0, angry)
		"coin":
			Pix.draw_coin(self, 0, 0, t + idx)
