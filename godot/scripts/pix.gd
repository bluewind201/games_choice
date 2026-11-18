## 도트 그림 도구: 걷는 캐릭터(12x18 도트)와 대화 초상화(64x64 도트), 소품.
## 모두 사각형만으로 그리므로 옷·머리색을 바꿔 꾸밀 수 있다.
class_name Pix
extends RefCounted

const OUT := Color("#1d1430")
static var _cache := {}

## '#fff', '#rrggbb', 'rgba(r,g,b,a)' 문자열 → Color
static func col(s) -> Color:
	if s is Color:
		return s
	if _cache.has(s):
		return _cache[s]
	var c: Color
	var t: String = s
	if t.begins_with("rgba(") or t.begins_with("rgb("):
		var inner := t.substr(t.find("(") + 1).trim_suffix(")")
		var p := inner.split(",")
		c = Color(float(p[0]) / 255.0, float(p[1]) / 255.0, float(p[2]) / 255.0, float(p[3]) if p.size() > 3 else 1.0)
	else:
		c = Color.html(t)
	_cache[s] = c
	return c

static func shade(s, k: float) -> Color:
	var c := col(s)
	return Color(clampf(c.r * k, 0, 1), clampf(c.g * k, 0, 1), clampf(c.b * k, 0, 1), c.a)

const DEFAULT_LOOK := {"skin": "#f2c9a0", "hair": "#2b2118", "shirt": "#4f6dff", "pants": "#2d3047", "hat": null, "glasses": null, "bag": false}

static func full_look(look: Dictionary) -> Dictionary:
	var l := DEFAULT_LOOK.duplicate()
	for k in look:
		l[k] = look[k]
	return l

## 0 아래, 1 위, 2 왼쪽, 3 오른쪽. (x, y) = 발 아래 가운데.
static func draw_character(ci: CanvasItem, look: Dictionary, x: float, y: float, dir: int, frame: int, moving: bool, scale := 1.0) -> void:
	var X := roundf(x) - 6.0
	var Y := roundf(y) - 18.0
	var r := func(px: float, py: float, w: float, h: float, c) -> void:
		ci.draw_rect(Rect2((X + px) * scale, (Y + py) * scale, w * scale, h * scale), col(c))
	var step := (1 if frame else -1) if moving else 0
	var bob := 1 if (moving and frame) else 0
	ci.draw_rect(Rect2((X + 2) * scale, (Y + 17) * scale, 8 * scale, 2 * scale), Color(0, 0, 0, .25))
	ci.draw_rect(Rect2((X + 1) * scale, (Y + 17.5) * scale, 10 * scale, 1 * scale), Color(0, 0, 0, .25))
	var pants = look.get("pants", "#2d3047")
	var dark := shade(pants, 0.7)
	if dir == 2 or dir == 3:
		r.call(4 + step, 13, 3, 5, pants)
		r.call(5 - step, 13, 3, 5, dark)
		r.call(4 + step, 17, 3, 1, "#222")
	else:
		r.call(3, 13 - (1 if step > 0 else 0), 3, 5, pants)
		r.call(6, 13 - (1 if step < 0 else 0), 3, 5, pants)
		r.call(3, 17 - (1 if step > 0 else 0), 3, 1, "#222")
		r.call(6, 17 - (1 if step < 0 else 0), 3, 1, "#222")
	var by := bob
	var shirt = look.get("shirt", "#4f6dff")
	var skin = look.get("skin", "#f2c9a0")
	var bag: bool = look.get("bag", false) == true
	if bag and dir == 0:
		r.call(1, 8 - by, 1, 5, "#c66f00")
	r.call(2, 8 - by, 8, 6, shirt)
	r.call(2, 13 - by, 8, 1, shade(shirt, 0.75))
	var arm := step if moving else 0
	if dir == 2 or dir == 3:
		var ax := (4 + arm) if dir == 2 else (6 - arm)
		r.call(ax, 9 - by, 2, 4, shade(shirt, 0.8))
		r.call(ax, 13 - by, 2, 1, skin)
		if bag:
			r.call(8 if dir == 2 else 1, 8 - by, 3, 5, "#ff9f1a")
	else:
		r.call(0, 9 - by + (1 if arm > 0 else 0), 2, 4, shade(shirt, 0.8))
		r.call(10, 9 - by + (1 if arm < 0 else 0), 2, 4, shade(shirt, 0.8))
		r.call(0, 13 - by + (1 if arm > 0 else 0), 2, 1, skin)
		r.call(10, 13 - by + (1 if arm < 0 else 0), 2, 1, skin)
		if bag and dir == 1:
			r.call(3, 8 - by, 6, 5, "#ff9f1a")
	var hy := 1 - by
	var hair = look.get("hair", "#2b2118")
	r.call(2, hy, 8, 7, skin)
	var hair_dark := shade(hair, 0.8)
	if dir == 1:
		r.call(2, hy, 8, 6, hair)
		r.call(2, hy + 5, 8, 1, hair_dark)
	elif dir == 0:
		r.call(2, hy, 8, 2, hair)
		r.call(2, hy + 2, 1, 3, hair)
		r.call(9, hy + 2, 1, 3, hair)
		r.call(4, hy + 4, 1, 2, "#1a1a1a")
		r.call(7, hy + 4, 1, 2, "#1a1a1a")
		r.call(5, hy + 6, 2, 1, shade(skin, 0.8))
	else:
		var L := dir == 2
		r.call(2, hy, 8, 2, hair)
		r.call(7 if L else 2, hy + 2, 3, 4, hair)
		r.call(3 if L else 8, hy + 4, 1, 2, "#1a1a1a")
	var hs = look.get("hairStyle", "short")
	if hs == null:
		hs = "short"
	if hs == "long":
		if dir == 0:
			r.call(1, hy + 2, 2, 7, hair)
			r.call(9, hy + 2, 2, 7, hair)
		elif dir == 1:
			r.call(2, hy + 5, 8, 4, hair)
		else:
			r.call(7 if dir == 2 else 2, hy + 5, 3, 4, hair)
	elif hs == "pony":
		if dir == 1:
			r.call(5, hy + 5, 2, 5, hair_dark)
		elif dir == 2:
			r.call(10, hy + 2, 2, 5, hair_dark)
		elif dir == 3:
			r.call(0, hy + 2, 2, 5, hair_dark)
		else:
			r.call(10, hy + 1, 2, 4, hair_dark)
	elif hs == "bun":
		r.call(4, hy - 2, 4, 2, hair)
	if look.get("tie", false) == true and dir == 0:
		r.call(5, 8 - by, 2, 4, "#c0392b")
	var gl = look.get("glasses", null)
	if gl != null and dir != 1:
		var c := "#111" if gl == "sun" else "#6b3f1f"
		if dir == 0:
			r.call(3, hy + 4, 3, 2, c)
			r.call(6, hy + 4, 3, 2, c)
			if gl == "round":
				r.call(4, hy + 5, 1, 1, "#cfe8ff")
				r.call(7, hy + 5, 1, 1, "#cfe8ff")
		else:
			r.call(2 if dir == 2 else 7, hy + 4, 3, 2, c)
	var hat = look.get("hat", null)
	var hc = look.get("hatColor", "#e2445c")
	if hc == null:
		hc = "#e2445c"
	if hat == "cap":
		r.call(1, hy - 1, 10, 3, hc)
		r.call(1, hy + 1, 10, 1, shade(hc, 0.75))
		if dir == 0: r.call(2, hy + 2, 8, 1, shade(hc, 0.6))
		if dir == 2: r.call(-2, hy + 1, 4, 1, shade(hc, 0.6))
		if dir == 3: r.call(10, hy + 1, 4, 1, shade(hc, 0.6))
	elif hat == "beanie":
		r.call(1, hy - 2, 10, 4, hc)
		r.call(1, hy + 1, 10, 1, shade(hc, 0.7))
		r.call(5, hy - 4, 2, 2, "#fff")
	elif hat == "catears":
		r.call(2, hy - 1, 8, 1, "#333")
		r.call(2, hy - 3, 2, 2, "#333")
		r.call(8, hy - 3, 2, 2, "#333")
		r.call(3, hy - 2, 1, 1, "#ff8fab")
		r.call(8, hy - 2, 1, 1, "#ff8fab")

## 64x64 대화 초상화. emotion: HAPPY NORMAL PANIC ANGRY SUSPECT CRY
static func draw_portrait(ci: CanvasItem, look: Dictionary, e: String, talking: bool, blink: bool, s := 1.0, ox := 0.0, oy := 0.0) -> void:
	var r := func(x: float, y: float, w: float, h: float, c) -> void:
		ci.draw_rect(Rect2(ox + x * s, oy + y * s, w * s, h * s), col(c))
	look = full_look(look)
	var skin = look.skin
	var skinD := shade(skin, 0.86)
	var skinDD := shade(skin, 0.72)
	var hair = look.hair
	var hairD := shade(hair, 0.75)
	var hairL := shade(hair, 1.25)
	var hs = look.get("hairStyle", "short")
	if hs == null: hs = "short"
	if hs == "long":
		r.call(14, 18, 36, 34, hairD)
		r.call(13, 24, 2, 26, OUT)
		r.call(49, 24, 2, 26, OUT)
	if hs == "pony":
		r.call(46, 22, 8, 6, hairD)
		r.call(48, 26, 7, 16, hair)
		r.call(49, 40, 5, 6, hairD)
		r.call(46, 22, 1, 6, OUT)
	if hs == "bun":
		r.call(25, 2, 14, 9, hair)
		r.call(27, 3, 8, 2, hairL)
	var sh = look.shirt
	r.call(8, 50, 48, 14, sh)
	r.call(6, 54, 2, 10, sh)
	r.call(56, 54, 2, 10, sh)
	r.call(8, 50, 48, 2, shade(sh, 1.15))
	r.call(8, 58, 48, 6, shade(sh, 0.88))
	r.call(6, 53, 1, 11, OUT)
	r.call(57, 53, 1, 11, OUT)
	r.call(7, 50, 1, 4, OUT)
	r.call(56, 50, 1, 4, OUT)
	r.call(8, 49, 48, 1, OUT)
	r.call(26, 42, 12, 9, skinD)
	r.call(26, 42, 12, 2, skinDD)
	if look.get("tie", false) == true:
		r.call(22, 49, 8, 6, "#f4f4f4")
		r.call(34, 49, 8, 6, "#f4f4f4")
		r.call(30, 50, 4, 3, "#c0392b")
		r.call(29, 53, 6, 11, "#c0392b")
		r.call(31, 53, 2, 11, "#e05a4c")
	else:
		r.call(24, 49, 16, 3, shade(sh, 0.7))
		r.call(27, 49, 10, 4, skinD)
	r.call(15, 28, 4, 8, skinD)
	r.call(45, 28, 4, 8, skinD)
	r.call(14, 28, 1, 8, OUT)
	r.call(49, 28, 1, 8, OUT)
	r.call(18, 14, 28, 30, skin)
	r.call(20, 44, 24, 2, skin)
	r.call(17, 16, 1, 26, OUT)
	r.call(46, 16, 1, 26, OUT)
	r.call(18, 42, 2, 2, OUT)
	r.call(44, 42, 2, 2, OUT)
	r.call(20, 46, 24, 1, OUT)
	r.call(18, 40, 2, 2, skinD)
	r.call(44, 40, 2, 2, skinD)
	r.call(22, 44, 20, 2, skinD)
	r.call(16, 8, 32, 10, hair)
	r.call(18, 6, 28, 2, hair)
	r.call(17, 5, 30, 1, OUT)
	r.call(15, 7, 1, 12, OUT)
	r.call(48, 7, 1, 12, OUT)
	r.call(20, 7, 12, 1, hairL)
	if hs == "part":
		r.call(16, 18, 4, 8, hair)
		r.call(44, 18, 4, 6, hair)
		r.call(26, 6, 2, 10, hairD)
		r.call(28, 16, 18, 3, hair)
		r.call(18, 18, 8, 2, hair)
	elif hs == "long":
		r.call(16, 18, 5, 26, hair)
		r.call(43, 18, 5, 26, hair)
		r.call(21, 18, 8, 3, hair)
		r.call(33, 18, 10, 2, hair)
		r.call(29, 18, 4, 1, hair)
	else:
		r.call(16, 18, 4, 10, hair)
		r.call(44, 18, 4, 10, hair)
		r.call(20, 18, 7, 3, hair)
		r.call(27, 18, 6, 2, hair)
		r.call(33, 18, 11, 3, hair)
		r.call(24, 21, 3, 1, hairD)
		r.call(38, 21, 4, 1, hairD)
	r.call(16, 17, 32, 1, hairD)
	var hc = look.get("hatColor", "#e2445c")
	if hc == null: hc = "#e2445c"
	var hat = look.get("hat", null)
	if hat == "cap":
		r.call(14, 2, 36, 12, hc)
		r.call(14, 2, 36, 2, shade(hc, 1.2))
		r.call(13, 13, 38, 3, shade(hc, 0.7))
		r.call(12, 15, 22, 3, shade(hc, 0.6))
		r.call(30, 5, 4, 3, shade(hc, 1.3))
	elif hat == "beanie":
		r.call(14, 1, 36, 15, hc)
		r.call(14, 13, 36, 4, shade(hc, 0.75))
		for x in range(16, 48, 4):
			r.call(x, 2, 1, 11, shade(hc, 0.85))
		r.call(28, -1, 8, 4, "#fff")
	elif hat == "catears":
		r.call(16, 6, 32, 2, "#333")
		r.call(16, 0, 6, 6, "#333")
		r.call(42, 0, 6, 6, "#333")
		r.call(18, 2, 2, 3, "#ff8fab")
		r.call(44, 2, 2, 3, "#ff8fab")
	var brow := shade(hair, 0.6)
	var by := 23
	if e == "ANGRY":
		r.call(21, by, 3, 2, brow); r.call(24, by + 1, 3, 2, brow); r.call(27, by + 2, 2, 2, brow)
		r.call(40, by, 3, 2, brow); r.call(37, by + 1, 3, 2, brow); r.call(35, by + 2, 2, 2, brow)
	elif e == "PANIC" or e == "CRY":
		r.call(21, by + 2, 3, 2, brow); r.call(24, by + 1, 3, 2, brow); r.call(27, by, 2, 2, brow)
		r.call(40, by + 2, 3, 2, brow); r.call(37, by + 1, 3, 2, brow); r.call(35, by, 2, 2, brow)
	elif e == "SUSPECT":
		r.call(21, by + 1, 8, 2, brow); r.call(35, by - 2, 3, 2, brow); r.call(38, by - 3, 5, 2, brow)
	else:
		r.call(21, by, 8, 2, brow); r.call(35, by, 8, 2, brow)
	for x in [22, 36]:
		var ey := 26
		if blink or e == "CRY":
			r.call(x, ey + 3, 6, 1, OUT)
			if e == "CRY":
				r.call(x, ey + 2, 1, 1, OUT); r.call(x + 5, ey + 2, 1, 1, OUT)
		elif e == "HAPPY":
			r.call(x, ey + 3, 1, 2, OUT); r.call(x + 1, ey + 2, 1, 1, OUT); r.call(x + 2, ey + 1, 2, 1, OUT)
			r.call(x + 4, ey + 2, 1, 1, OUT); r.call(x + 5, ey + 3, 1, 2, OUT)
		elif e == "PANIC":
			r.call(x, ey, 6, 6, "#fff"); r.call(x - 1, ey, 1, 6, OUT); r.call(x + 6, ey, 1, 6, OUT)
			r.call(x, ey - 1, 6, 1, OUT); r.call(x, ey + 6, 6, 1, OUT); r.call(x + 2, ey + 2, 2, 2, OUT)
		elif e == "SUSPECT":
			r.call(x, ey + 2, 6, 1, OUT); r.call(x, ey + 3, 6, 2, "#fff"); r.call(x + 3, ey + 3, 2, 2, OUT); r.call(x, ey + 5, 6, 1, skinD)
		else:
			r.call(x, ey, 6, 1, OUT); r.call(x + 1, ey + 1, 4, 5, OUT); r.call(x, ey + 1, 1, 4, OUT); r.call(x + 5, ey + 1, 1, 4, OUT)
			r.call(x + 1, ey + 1, 2, 2, "#fff"); r.call(x + 3, ey + 4, 1, 1, "#5b6bbf")
			if e == "ANGRY":
				r.call(x, ey, 6, 2, skin)
	var gl = look.get("glasses", null)
	if gl != null:
		var c := "#111" if gl == "sun" else "#6b3f1f"
		for x in [20, 34]:
			if gl == "sun":
				r.call(x, 25, 10, 7, "#111")
			else:
				r.call(x, 24, 10, 1, c); r.call(x, 32, 10, 1, c); r.call(x, 24, 1, 9, c); r.call(x + 9, 24, 1, 9, c)
				r.call(x + 7, 26, 1, 2, "rgba(255,255,255,.7)")
		r.call(30, 26, 4, 1, c); r.call(17, 26, 3, 1, c); r.call(44, 26, 3, 1, c)
		if gl == "sun":
			r.call(22, 26, 3, 1, "rgba(255,255,255,.5)"); r.call(36, 26, 3, 1, "rgba(255,255,255,.5)")
	r.call(31, 32, 2, 3, skinD)
	r.call(30, 35, 3, 1, skinDD)
	if e == "HAPPY" or e == "PANIC":
		r.call(20, 34, 5, 2, "rgba(255,110,130,.55)"); r.call(39, 34, 5, 2, "rgba(255,110,130,.55)")
	var my := 38
	var open := talking
	if e == "HAPPY":
		if open:
			r.call(27, my, 10, 1, OUT); r.call(27, my + 1, 10, 3, "#8b1e2e"); r.call(28, my + 4, 8, 1, OUT)
			r.call(28, my + 1, 8, 1, "#fff"); r.call(30, my + 3, 4, 1, "#ff6b81")
		else:
			r.call(26, my, 2, 1, OUT); r.call(28, my + 1, 8, 1, OUT); r.call(36, my, 2, 1, OUT)
	elif e == "ANGRY":
		if open:
			r.call(26, my, 12, 1, OUT); r.call(26, my + 1, 12, 3, "#fff"); r.call(26, my + 4, 12, 1, OUT)
			for x in range(28, 38, 3):
				r.call(x, my + 1, 1, 3, "#bbb")
		else:
			r.call(27, my + 1, 10, 1, OUT); r.call(26, my + 2, 1, 1, OUT); r.call(37, my + 2, 1, 1, OUT)
	elif e == "PANIC":
		if open:
			r.call(29, my - 1, 6, 1, OUT); r.call(28, my, 8, 4, "#8b1e2e"); r.call(29, my + 4, 6, 1, OUT)
		else:
			for i in 10:
				r.call(27 + i, my + (i % 2), 1, 1, OUT)
	elif e == "SUSPECT":
		r.call(28, my + 1, 6, 1, OUT); r.call(34, my, 3, 1, OUT)
		if open: r.call(29, my + 2, 4, 1, "#8b1e2e")
	elif e == "CRY":
		if open:
			r.call(28, my, 8, 1, OUT); r.call(28, my + 1, 8, 3, "#8b1e2e"); r.call(27, my + 2, 1, 1, OUT); r.call(36, my + 2, 1, 1, OUT)
		else:
			r.call(28, my + 2, 8, 1, OUT); r.call(27, my + 3, 1, 1, OUT); r.call(36, my + 3, 1, 1, OUT)
	else:
		if open:
			r.call(29, my, 6, 1, OUT); r.call(29, my + 1, 6, 2, "#8b1e2e"); r.call(30, my + 3, 4, 1, OUT)
		else:
			r.call(29, my + 1, 6, 1, OUT)
	if e == "PANIC":
		r.call(47, 12, 3, 5, "#8fd3ff"); r.call(48, 17, 2, 2, "#8fd3ff"); r.call(48, 13, 1, 2, "#fff"); r.call(12, 20, 2, 4, "#8fd3ff")
	if e == "ANGRY":
		var v := "#e2445c"
		r.call(48, 8, 2, 6, v); r.call(52, 8, 2, 6, v); r.call(46, 10, 6, 2, v); r.call(50, 12, 6, 2, v)
	if e == "CRY":
		r.call(23, 31, 2, 12, "#7cc4f0"); r.call(38, 31, 2, 12, "#7cc4f0"); r.call(23, 31, 1, 4, "#d6f0ff")
	if e == "SUSPECT":
		r.call(50, 10, 4, 1, "#ffd166"); r.call(53, 11, 1, 2, "#ffd166"); r.call(52, 13, 1, 2, "#ffd166"); r.call(52, 16, 1, 1, "#ffd166")

# ---------- 소품 ----------
static func draw_tree(ci: CanvasItem, x: float, y: float) -> void:
	ci.draw_rect(Rect2(x - 9, y - 1, 18, 4), Color(0, 0, 0, .22))
	ci.draw_rect(Rect2(x - 2, y - 8, 4, 9), col("#7a5230"))
	for p in [[0, -16, 10, "#2f7a3c"], [-1, -18, 8, "#3f9a4a"], [-3, -21, 4, "#5fbf5f"]]:
		var cx: float = p[0]; var cy: float = p[1]; var rr: float = p[2]
		ci.draw_rect(Rect2(x + cx - rr, y + cy - rr + 2, rr * 2, rr * 2 - 4), col(p[3]))
		ci.draw_rect(Rect2(x + cx - rr + 2, y + cy - rr, rr * 2 - 4, rr * 2), col(p[3]))

static func draw_lamp(ci: CanvasItem, x: float, y: float) -> void:
	ci.draw_rect(Rect2(x - 3, y, 6, 2), Color(0, 0, 0, .2))
	ci.draw_rect(Rect2(x - 1, y - 26, 2, 27), col("#555"))
	ci.draw_rect(Rect2(x - 4, y - 29, 8, 3), col("#333"))
	ci.draw_rect(Rect2(x - 3, y - 26, 6, 2), col("#ffe9a8"))

static func draw_cat(ci: CanvasItem, x: float, y: float, i: int, t: float) -> void:
	var c := col(["#f4a259", "#333", "#ddd"][i % 3])
	var tail := int(t * 3 + i) % 2
	ci.draw_rect(Rect2(x - 5, y, 10, 2), Color(0, 0, 0, .2))
	for rc in [[-5, -5, 8, 5], [2, -8, 5, 5], [2, -10, 1, 2], [6, -10, 1, 2], [-7, -7 - tail, 2, 4]]:
		ci.draw_rect(Rect2(x + rc[0], y + rc[1], rc[2], rc[3]), c)
	ci.draw_rect(Rect2(x + 3, y - 6, 1, 1), col("#111"))
	ci.draw_rect(Rect2(x + 5, y - 6, 1, 1), col("#111"))

static func draw_wallet(ci: CanvasItem, x: float, y: float, t: float) -> void:
	ci.draw_rect(Rect2(x - 4, y - 3, 8, 5), col("#8b2e2e"))
	ci.draw_rect(Rect2(x - 4, y - 3, 8, 1), col("#b04545"))
	if int(t * 3) % 2:
		ci.draw_rect(Rect2(x + 4, y - 7, 1, 3), col("#fff6b0"))
		ci.draw_rect(Rect2(x + 3, y - 6, 3, 1), col("#fff6b0"))

## 길 위의 돌 (운세 위험물)
static func draw_stone(ci: CanvasItem, x: float, y: float, glow: float) -> void:
	ci.draw_rect(Rect2(x - 6, y, 12, 2), Color(0, 0, 0, .25))
	ci.draw_rect(Rect2(x - 5, y - 6, 10, 6), col("#6e6a72"))
	ci.draw_rect(Rect2(x - 4, y - 7, 7, 1), col("#8d8992"))
	ci.draw_rect(Rect2(x - 3, y - 5, 3, 2), col("#a9a4ad"))
	ci.draw_rect(Rect2(x + 2, y - 3, 3, 3), col("#57535b"))
	if glow > 0:
		ci.draw_rect(Rect2(x - 7, y - 9, 14, 12), Color(1, 0.3, 0.3, 0.18 * glow), false, 1.0)

static func draw_puddle(ci: CanvasItem, x: float, y: float, t: float) -> void:
	ci.draw_rect(Rect2(x - 9, y - 3, 18, 6), col("#3a7fd0"))
	ci.draw_rect(Rect2(x - 7, y - 4, 14, 8), col("#3a7fd0"))
	ci.draw_rect(Rect2(x - 6, y - 3, 6, 1), col("#9fd3ff"))
	var k := int(t * 2) % 3
	ci.draw_rect(Rect2(x - 2 + k * 2, y + 1, 4, 1), col("#7cc4f0"))

static func draw_dog(ci: CanvasItem, x: float, y: float, dir: int, frame: int, angry: bool) -> void:
	var c := col("#c08a50")
	var d := col("#8a5a2b")
	var fx := -1 if dir == 2 else 1
	ci.draw_rect(Rect2(x - 7, y, 14, 2), Color(0, 0, 0, .22))
	ci.draw_rect(Rect2(x - 6, y - 8, 11, 5), c)
	var head_x := x + 3 * fx - (2 if fx < 0 else 0)
	ci.draw_rect(Rect2(head_x, y - 12, 6, 5), c)
	ci.draw_rect(Rect2(head_x + (4 if fx > 0 else -1), y - 10, 3, 2), d)
	ci.draw_rect(Rect2(head_x + (1 if fx > 0 else 3), y - 13, 2, 2), d)
	ci.draw_rect(Rect2(head_x + (3 if fx > 0 else 1), y - 11, 1, 1), col("#111"))
	var l := 1 if frame else 0
	ci.draw_rect(Rect2(x - 5, y - 3, 2, 3 - l), d)
	ci.draw_rect(Rect2(x + 2, y - 3, 2, 3 - (1 - l)), d)
	ci.draw_rect(Rect2(x - 6 - 2 * fx if fx > 0 else x + 5, y - 10 - l, 2, 3), c)
	if angry:
		ci.draw_rect(Rect2(head_x + 2 * fx, y - 19, 2, 4), col("#e2445c"))
		ci.draw_rect(Rect2(head_x + 2 * fx, y - 14, 2, 1), col("#e2445c"))

static func draw_coin(ci: CanvasItem, x: float, y: float, t: float) -> void:
	var w := 6.0 - absf(sin(t * 4.0)) * 4.0
	ci.draw_rect(Rect2(x - 3, y + 1, 6, 1), Color(0, 0, 0, .2))
	ci.draw_rect(Rect2(x - w / 2.0, y - 7, maxf(1.0, w), 7), col("#ffd166"))
	ci.draw_rect(Rect2(x - w / 2.0, y - 7, maxf(1.0, w), 1), col("#fff3c4"))
	ci.draw_rect(Rect2(x - w / 2.0, y - 1, maxf(1.0, w), 1), col("#c9962a"))

static func draw_bike(ci: CanvasItem, x: float, y: float, dir: int, t: float) -> void:
	# 사람 아래에 깔리는 자전거
	var c := col("#2bb39a")
	if dir == 2 or dir == 3:
		ci.draw_rect(Rect2(x - 8, y - 5, 5, 5), col("#222"))
		ci.draw_rect(Rect2(x + 3, y - 5, 5, 5), col("#222"))
		ci.draw_rect(Rect2(x - 7, y - 4, 3, 3), col("#888"))
		ci.draw_rect(Rect2(x + 4, y - 4, 3, 3), col("#888"))
		ci.draw_rect(Rect2(x - 5, y - 6, 10, 2), c)
	else:
		ci.draw_rect(Rect2(x - 1, y - 8, 2, 10), col("#222"))
		ci.draw_rect(Rect2(x - 4, y - 10, 8, 1), c)
