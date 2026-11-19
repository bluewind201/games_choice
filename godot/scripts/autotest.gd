## 자동 점검: `godot --headless -- --autotest` 로 실행하면 주요 흐름을 차례로 돌려 보고 오류 없이 끝나는지 본다.
extends Node

var main

func _ready() -> void:
	main = Main.inst
	_run.call_deferred()

func step(name: String) -> void:
	print("[autotest] ", name)

func wait(sec: float) -> void:
	await get_tree().create_timer(sec).timeout

func press_wait(text: String, sec := 10.0) -> bool:
	var t := 0.0
	while t < sec:
		if main._press(text, get_tree().root): return true
		await wait(0.25)
		t += 0.25
	print("[autotest]   (버튼 없음) ", text)
	return false

func press(text: String) -> bool:
	var ok: bool = main._press(text, get_tree().root)
	if not ok:
		print("[autotest]   (버튼 없음) ", text)
	return ok

func _run() -> void:
	Game.clear_save()
	main.screen_title()
	await wait(0.2)
	step("타이틀 → 생년월일")
	press("시작하기")
	await wait(0.2)
	press("▶▶")
	press("성향 진단")
	await wait(0.1)
	for i in 12:
		var q: Dictionary = Game.data.quiz[i]
		press(q.a.text if i % 2 == 0 else q.b.text)
		await wait(0.05)
	step("카드: " + str(Game.save.realProfile))
	press("이 성향으로 시작")
	await wait(0.5)
	var w = main.world
	step("운세: %s %s %s 위험물 %d" % [w.fortune.pillar, w.fortune.grade, w.fortune.hazard, w.hazards.size()])
	press("확인, 출발!")
	await wait(0.2)
	# 여러 날의 운세를 훑어본다
	var luck := {}
	for d in range(1, 31):
		var f: Dictionary = Game.fortune_for(Game.save.realProfile, d)
		luck[f.luck] = luck.get(f.luck, 0) + 1
	step("30일 운세 분포 " + str(luck))
	step("돌 밟기")
	if w.hazards.size() > 0:
		var h = w.hazards[0]
		w.teleport(h.pos + Vector2(0.1, 0))
		await wait(0.3)
		step("HP %d 상태 %s" % [Game.w().hp, Game.w().status])
	step("버스")
	w.teleport(Vector2(27, 94.7))
	await wait(0.2)
	step("행동 버튼: " + str(w.current.label if w.current else "없음"))
	w.current.action.call()
	await wait(0.2)
	press("회사 앞 행")
	await wait(3.5)
	step("버스 뒤 위치 %s 시각 %s 돈 %d" % [w.pos, Game.clock_text(Game.w().clock), Game.w().money])
	step("출근 체크")
	w.teleport(Vector2(118, 33.5))
	await wait(0.3)
	step("dayFlags " + str(Game.w().dayFlags))
	step("자전거")
	w.teleport(Vector2(128, 32.7))
	await wait(0.2)
	if w.current: w.current.action.call()
	await wait(0.1)
	step("ride=" + w.ride)
	w.get_off_bike()
	step("지도·퀘스트·상점·옷장")
	w.hud.open_map()
	await wait(0.2)
	press("닫기")
	w.hud.open_quests()
	await wait(0.2)
	press("닫기")
	Game.w().money = 50000
	w.hud.open_shop()
	await wait(0.2)
	press("빨간 티셔츠")
	press("반창고")
	await wait(0.1)
	press("옷장")
	await wait(0.2)
	press("빨간 티셔츠")
	press("닫기")
	step("look " + str(Game.w().look.shirt) + " HP " + str(Game.w().hp))
	step("미니게임 6종")
	for id in ["MG_701", "MG_702", "MG_703", "MG_101", "MG_402", "MG_602", "MG_801"]:
		var res = [null]
		var f := func(): res[0] = await main.run_minigame(id)
		f.call()
		await wait(0.2)
		press("시작!")
		var t := 0.0
		while res[0] == null and t < 40:
			await wait(0.5)
			t += 0.5
			if id == "MG_602": press("휴대폰")
			if id == "MG_602": press("제시")
			if id == "MG_402": press("꾹 참기")
			if id == "MG_701": press("지금")
			if id == "MG_801":
				press("방어"); press("대들기"); press("사이다")
		step("  %s → %s" % [id, res[0]])
	step("미션 MS_301")
	Game.w().clock = 16 * 60 + 40
	for n in w.npcs:
		if n.def.id == "boss":
			w.teleport(n.pos + Vector2(0, 0.8))
	await wait(0.3)
	w.current.action.call()
	var grade = [null]
	await wait(0.3)
	for k in 40:
		if main._press("미션 시작", get_tree().root): break
		await wait(0.25)
	await wait(0.4)
	step("미션 화면: " + str(main.screen))
	var t2 := 0.0
	while t2 < 240:
		await wait(0.25)
		t2 += 0.25
		if press("작전 시작"): continue
		if press("결과") : continue
		var bx = main.screen.get("box") if main.screen else null
		if bx: bx._tap()
		for ev in ["결재 서류", "보고서", "숫자"]:
			pass
		var mm: Dictionary = main.screen.m if main.screen and main.screen.get("m") else {}
		for bt in mm.get("beats", []):
			if bt.get("objection") != null:
				for e in bt.objection.evidence:
					if e.id == bt.objection.correctId:
						press(e.name)
		for lab in ["⚡", "시작!", "결정적 한마디", "📊", "동네로"]:
			if press(lab):
				break
		if main.world.visible and main.screen == null:
			break
	step("미션 후 돈 %d 레벨 %d best %s" % [Game.w().money, Game.w().level, str(Game.save.best)])
	step("잠자기")
	Game.w().clock = 21 * 60 + 10
	w.teleport(Vector2(Game.data.bed[0], Game.data.bed[1]))
	await wait(0.2)
	if w.current: w.current.action.call()
	await wait(0.3)
	step("day %d clock %s" % [Game.w().day, Game.clock_text(Game.w().clock)])
	step("완료")
	get_tree().quit()
