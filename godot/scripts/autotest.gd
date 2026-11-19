## 자동 점검: `godot --headless --path godot -- --autotest` 로 실행하면 주요 흐름을 차례로 돌려 보고 오류 없이 끝나는지 본다.
extends Node

var main

func _ready() -> void:
	main = Main.inst
	_run.call_deferred()

func step(name: String) -> void:
	print("[autotest] ", name)

func wait(sec: float) -> void:
	await get_tree().create_timer(sec).timeout

func press(text: String) -> bool:
	return main._press(text, get_tree().root)

func press_wait(text: String, sec := 10.0) -> bool:
	var t := 0.0
	while t < sec:
		if press(text): return true
		await wait(0.25)
		t += 0.25
	print("[autotest]   (버튼 없음) ", text)
	return false

## 미니게임 화면에서 아무 조작이나 계속 눌러 준다
func mash_minigame() -> void:
	for lab in ["점프", "왼쪽", "오른쪽", "①", "꾹 참기", "지금", "방어", "대들기", "사이다"]:
		press(lab)

func run_mg(id: String) -> String:
	var res = [null]
	var f := func(): res[0] = await main.run_minigame(id)
	f.call()
	await press_wait("시작!", 3)
	var t := 0.0
	while res[0] == null and t < 45:
		await wait(0.3)
		t += 0.3
		mash_minigame()
	return str(res[0])

func play_mission(w) -> void:
	w.current = null
	var sn: Dictionary = Game.stage().npc
	w.teleport(sn.pos + Vector2(0, 0.8))
	await wait(0.3)
	if w.current == null:
		step("  (미션 NPC 근처가 아님)")
		return
	w.current.action.call()
	await press_wait("미션 시작", 8)
	await wait(0.4)
	var t := 0.0
	while t < 300:
		await wait(0.25)
		t += 0.25
		if press("작전 시작"): continue
		var bx = main.screen.get("box") if main.screen else null
		if bx: bx._tap()
		mash_minigame()
		var mm: Dictionary = main.screen.m if main.screen and main.screen.get("m") else {}
		for bt in mm.get("beats", []):
			if bt.get("objection") != null:
				for e in bt.objection.evidence:
					if e.id == bt.objection.correctId:
						press(e.name)
		for lab in ["⚡", "시작!", "잠깐만", "동네로", "좋아!", "다시 태어나기"]:
			if press(lab):
				break
		if main.world and main.world.visible and main.screen == null and not main.world.paused:
			break

func _run() -> void:
	Game.clear_save()
	main.screen_title()
	await wait(0.2)
	step("타이틀 → 생년월일 → 태어나기")
	press("시작하기")
	await wait(0.2)
	press("▶▶")
	press("태어나기")
	await wait(0.6)
	var w = main.world
	step("스테이지 %s %d살 · 옷 %s" % [Game.stage().label, Game.stage().age, Game.w().look.shirt])
	step("운세: %s %s %s 위험물 %d" % [w.fortune.pillar, w.fortune.grade, w.fortune.hazard, w.hazards.size()])
	press("확인, 출발!")
	await wait(0.3)
	var luck := {}
	for d in range(1, 31):
		var f: Dictionary = Game.fortune_for(Game.save.realProfile, d)
		luck[f.luck] = luck.get(f.luck, 0) + 1
	step("30일 운세 분포 " + str(luck))
	# 위험물: 나쁜 날로 바꿔서 확인
	var tries := 0
	while w.hazards.is_empty() and tries < 20:
		tries += 1
		Game.w().day += 1
		w._start_day(false)
		await wait(0.1)
		press("확인, 출발!")
	step("위험물 %s %d개 (day %d)" % [w.fortune.hazard, w.hazards.size(), Game.w().day])
	if w.hazards.size() > 0:
		var h = w.hazards[0]
		var hp0: int = Game.w().hp
		w.teleport(h.pos + Vector2(1.0, 0))
		await wait(0.4)
		await press_wait("시작!", 4)
		var t := 0.0
		while w.paused and t < 30:
			await wait(0.3)
			t += 0.3
			mash_minigame()
		await wait(0.3)
		step("위험물 미니게임 뒤 HP %d → %d 상태 '%s'" % [hp0, Game.w().hp, Game.w().status])
	step("HP 바닥 → 광고로 회복")
	Game.w().hp = 5
	w._hurt(20, "limp", "테스트")
	await press_wait("광고 보고", 3)
	await wait(1.6)
	step("HP %d" % Game.w().hp)
	press("확인, 출발!")
	step("미니게임 전부")
	var ids: Array = Stages.MG.keys()
	ids.append_array(["MG_402", "MG_701", "MG_702", "MG_801"])
	for id in ids:
		var r := await run_mg(id)
		step("  %s → %s" % [id, r])
	step("1단계 유딩 미션")
	Game.w().clock = 9 * 60 + 50
	await play_mission(main.world)
	await wait(0.6)
	press("확인, 출발!")
	await wait(0.3)
	step("미션 뒤 스테이지 %s %d살 · 옷 %s · 돈 %d" % [Game.stage().label, Game.stage().age, Game.w().look.shirt, Game.w().money])
	step("6단계 직장인 미션 (정면 승부 포함)")
	Game.w().stage = 5
	Game.apply_outfit()
	main.restart_world()
	await wait(0.6)
	press("확인, 출발!")
	Game.w().clock = 16 * 60 + 40
	await play_mission(main.world)
	await wait(0.6)
	press("확인, 출발!")
	step("미션 뒤 스테이지 %s best %s" % [Game.stage().label, str(Game.save.best)])
	step("노인 → 인생 완주")
	Game.w().stage = 6
	var done := Game.age_up()
	step("완주=%s 스테이지 %s 완주 %d회" % [done, Game.stage().label, Game.w().lifeDone])
	step("완료")
	get_tree().quit()
