## 효과음: 파일 없이 짧은 8비트 소리를 코드로 만들어 쓴다.
extends Node

const RATE := 22050
var _players: Array[AudioStreamPlayer] = []
var _sounds := {}
var _next := 0

func _ready() -> void:
	for i in 6:
		var p := AudioStreamPlayer.new()
		p.volume_db = -8
		add_child(p)
		_players.append(p)
	_sounds.blip = _tone([[880, 0.03]], "square", 0.25)
	_sounds.blip_low = _tone([[520, 0.035]], "square", 0.25)
	_sounds.stamp = _tone([[180, 0.06], [120, 0.1]], "square", 0.5)
	_sounds.pick = _tone([[660, 0.05], [990, 0.06]], "square", 0.3)
	_sounds.good = _tone([[523, 0.07], [659, 0.07], [784, 0.12]], "square", 0.3)
	_sounds.bad = _tone([[330, 0.09], [247, 0.16]], "square", 0.35)
	_sounds.hurt = _tone([[200, 0.05], [90, 0.12]], "noise", 0.5)
	_sounds.coin = _tone([[988, 0.05], [1319, 0.12]], "square", 0.25)
	_sounds.bark = _tone([[300, 0.05], [420, 0.05], [260, 0.08]], "noise", 0.45)
	_sounds.splash = _tone([[0, 0.18]], "noise", 0.3)
	_sounds.bell = _tone([[1047, 0.08], [784, 0.08], [1047, 0.14]], "triangle", 0.35)
	_sounds.levelup = _tone([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]], "square", 0.3)

func muted() -> bool:
	return Game.save.get("muted", false)

func toggle() -> bool:
	Game.save.muted = not muted()
	Game.persist()
	return muted()

func play(name: String, pitch := 1.0) -> void:
	if muted() or not _sounds.has(name):
		return
	var p := _players[_next]
	_next = (_next + 1) % _players.size()
	p.stream = _sounds[name]
	p.pitch_scale = pitch
	p.play()

func _tone(notes: Array, wave: String, vol: float) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	var noise_v := 0.0
	for n in notes:
		var freq: float = n[0]
		var count := int(RATE * float(n[1]))
		for i in count:
			var t := float(i) / RATE
			var env := 1.0 - float(i) / count
			var v := 0.0
			match wave:
				"square":
					v = 1.0 if fmod(t * freq, 1.0) < 0.5 else -1.0
				"triangle":
					v = absf(fmod(t * freq, 1.0) * 4.0 - 2.0) - 1.0
				"noise":
					if i % maxi(1, int(RATE / maxf(freq, 400.0) / 2.0)) == 0:
						noise_v = rng.randf_range(-1, 1)
					v = noise_v
			var s := int(clampf(v * env * vol, -1, 1) * 32767)
			bytes.append(s & 0xff)
			bytes.append((s >> 8) & 0xff)
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.data = bytes
	return w
