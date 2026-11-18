## 화면 부품: 레트로 도트 테마, 버튼, 창, 알림.
class_name UI
extends RefCounted

const NAVY := Color("#23194a")
const INK := Color("#1d1430")
const CREAM := Color("#fff6e0")
const PAPER := Color("#fffaf0")
const YELLOW := Color("#ffd166")
const PINK := Color("#ff4f6d")
const MINT := Color("#8ef0c4")
const BLUE := Color("#4f6dff")
const MUTED := Color("#6b6385")
const GOOD := Color("#2e9e6b")
const BAD := Color("#d6334f")

static var _theme: Theme
static var font: FontFile

static func box(bg: Color, border := INK, bw := 2, pad := 6, shadow := 0) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(bw)
	s.set_content_margin_all(pad)
	s.anti_aliasing = false
	if shadow > 0:
		s.shadow_color = Color(0, 0, 0, .35)
		s.shadow_size = 0
		s.shadow_offset = Vector2(0, shadow)
	return s

static func theme() -> Theme:
	if _theme:
		return _theme
	var t := Theme.new()
	font = load("res://assets/fonts/Galmuri11-Bold.ttf")
	font.antialiasing = TextServer.FONT_ANTIALIASING_NONE
	font.hinting = TextServer.HINTING_NONE
	font.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
	var hanja: FontFile = load("res://assets/fonts/NotoSansKR-hanja.ttf")
	var emoji: FontFile = load("res://assets/fonts/NotoEmoji-subset.ttf")
	font.fallbacks = [hanja, emoji]
	t.default_font = font
	t.default_font_size = 12
	t.set_color("font_color", "Label", INK)
	t.set_color("font_color", "Button", INK)
	t.set_color("font_hover_color", "Button", INK)
	t.set_color("font_pressed_color", "Button", INK)
	t.set_color("font_focus_color", "Button", INK)
	t.set_color("font_disabled_color", "Button", Color(INK, .45))
	t.set_stylebox("normal", "Button", box(Color.WHITE, INK, 2, 7, 3))
	t.set_stylebox("hover", "Button", box(Color("#fff8e6"), INK, 2, 7, 3))
	t.set_stylebox("pressed", "Button", box(Color("#ffe9b0"), INK, 2, 7, 1))
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_stylebox("disabled", "Button", box(Color("#e8e4ee"), Color(INK, .4), 2, 7, 0))
	t.set_stylebox("panel", "PanelContainer", box(PAPER, INK, 3, 10, 4))
	t.set_stylebox("panel", "Panel", box(PAPER, INK, 3, 10, 4))
	t.set_constant("separation", "VBoxContainer", 6)
	t.set_constant("separation", "HBoxContainer", 6)
	t.set_stylebox("scroll", "VScrollBar", box(Color(0, 0, 0, .08), Color(0, 0, 0, 0), 0, 2))
	t.set_stylebox("grabber", "VScrollBar", box(Color(INK, .5), Color(0, 0, 0, 0), 0, 2))
	t.set_stylebox("grabber_highlight", "VScrollBar", box(Color(INK, .6), Color(0, 0, 0, 0), 0, 2))
	t.set_stylebox("grabber_pressed", "VScrollBar", box(Color(INK, .7), Color(0, 0, 0, 0), 0, 2))
	_theme = t
	return t

static func label(text: String, size := 12, color := INK, align := HORIZONTAL_ALIGNMENT_LEFT, wrap := true) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.horizontal_alignment = align
	if wrap:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l

static func outlined(l: Label, outline := INK, px := 3) -> Label:
	l.add_theme_color_override("font_outline_color", outline)
	l.add_theme_constant_override("outline_size", px)
	return l

static func button(text: String, cb: Callable = Callable(), kind := "normal", size := 12) -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_size_override("font_size", size)
	if text.length() > 16 or text.contains("\n"):
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	b.focus_mode = Control.FOCUS_NONE
	var bg := Color.WHITE
	match kind:
		"primary": bg = YELLOW
		"pink": bg = Color("#ffb3c1")
		"mint": bg = MINT
		"blue": bg = Color("#bfcaff")
		"dark": bg = NAVY
	if kind != "normal":
		b.add_theme_stylebox_override("normal", box(bg, INK, 2, 7, 3))
		b.add_theme_stylebox_override("hover", box(bg.lightened(.1), INK, 2, 7, 3))
		b.add_theme_stylebox_override("pressed", box(bg.darkened(.1), INK, 2, 7, 1))
		if kind == "dark":
			for k in ["font_color", "font_hover_color", "font_pressed_color"]:
				b.add_theme_color_override(k, Color.WHITE)
	if cb.is_valid():
		b.pressed.connect(func(): Sfx.play("pick"); cb.call())
	return b

static func vbox(sep := 6) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	return v

static func hbox(sep := 6) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	return h

static func full(c: Control) -> Control:
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return c

static func color_rect(c: Color) -> ColorRect:
	var r := ColorRect.new()
	r.color = c
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func spacer(h := 8) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, h)
	return c

static func tag(text: String, bg: Color, fg := INK, size := 11) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", box(bg, INK, 2, 3))
	var l := label(text, size, fg, HORIZONTAL_ALIGNMENT_CENTER, false)
	p.add_child(l)
	return p

## 가로 막대 게이지
static func gauge(fill: Color, h := 10) -> ProgressBar:
	var p := ProgressBar.new()
	p.show_percentage = false
	p.custom_minimum_size = Vector2(40, h)
	p.add_theme_stylebox_override("background", box(Color("#2a2140"), INK, 2, 0))
	p.add_theme_stylebox_override("fill", box(fill, INK, 0, 0))
	p.max_value = 100
	return p
