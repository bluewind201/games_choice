# 렛츠고! 정상까지 — 아트 방향 & AI 시안 프롬프트 (v0.1)

> 2026-11-26 · 방향: **웹툰풍 고품질 2D 손그림**
> ~~2026-11-27: 인게임 2.5D 툰 3D~~ → **2026-11-28 변경: 인게임은 HD-2D** (GDD 14-1-3). 아래 웹툰 기준은 캐릭터 생김새, 대화 일러스트, 정상 사진, 스토어 아트에 그대로 쓴다.

## 0. 인게임 장난감 미니어처 3D 기준 (2026-11-28 오후, 현재)

| 항목 | 기준 |
|---|---|
| 캐릭터 | 비닐 피규어 느낌, 약 2.5등신, 큰 머리, 단순한 눈. 웹툰 시안 생김새 유지 |
| 질감 | 매끈한 플라스틱(캐릭터) + 점토(나무·바위·땅). 동글동글한 모양 |
| 카메라 | 위에서 비스듬히 내려다보기. 가장자리만 살짝 흐림, 캐릭터는 또렷 |
| 조명 | 따뜻한 오후·노을빛, 석등·창문 불빛 |
| 제작 | 캐릭터·장비: Meshy 이미지→3D + 자동 뼈대. 소품: 코드/블렌더 |
| 기준 시안 | `/mnt/project-files/mountain/3d-ref/what-if-toy3d-t1.jpg`, 시제품 `prototypes/web/stairs-race-toy.html` |

## 0-1. (지난 기준) 인게임 HD-2D (2026-11-28 오전)

| 항목 | 기준 |
|---|---|
| 캐릭터 | 도트 스프라이트, 칸 약 90×160px, 8칸 띠(서기·걷기4·숨참·이김·짐), 아래쪽 정렬, 투명 배경. 화면에서 확대할 때 필터 끔(또렷한 픽셀) |
| 도트 만들기 | 웹툰 시안을 Flow(Nano Banana)에 넣고 "pixel art sprite sheet, 8 frames, green background"로 뽑기 → 초록 빼기 → 반으로 줄이기(최근접) → 손으로 다듬기 |
| 배경 | 로우폴리 3D 디오라마. 질감은 잔 노이즈, 노을 방향광 + 안개, 석등·창문 불빛, 약한 빛번짐 |
| 흐림 | 기본 끔. 쓰더라도 먼 배경에만 약하게 |
| 장비 | 미정 (레이어 방식 추천: 부위별로 같은 8칸 틀에 덧그림) |
| 원본 위치 | `art/pixel-2026-11-28/`, 시제품 `prototypes/web/stairs-race-hd2d.html` |

> 목적: 힉스필드(Higgsfield) 무료 버전으로 "느낌"을 먼저 확인하고, 마음에 들면 유료(상업 이용 가능, Starter 월 $15~)로 전환해 실제 작업에 쓴다.

---

## 1. 그림체 기준 (스타일 가이드 초안)

| 항목 | 기준 |
|---|---|
| 장르 느낌 | 한국 일상·개그 웹툰. 깔끔한 선, 밝은 셀 채색(그림자 1단계 + 하이라이트 1단계) |
| 머리 비율 | 주인공·NPC 모두 4~5등신 (귀엽지만 너무 SD는 아님). 미니게임 중엔 2.5등신 SD 버전 |
| 선 | 진한 갈색(#3a2a20 계열) 단일 굵기 선, 바깥선만 약간 굵게 |
| 색 | 산 배경은 채도 낮은 파스텔, 캐릭터·장비는 채도 높게 → 장비가 눈에 띄게 |
| 표정 | 캐릭터마다 표정 6종(기본·기쁨·당황·분노·지침·감동), 웹툰식 효과(땀방울, 반짝이, 집중선) |
| 장비 | 실루엣만 봐도 구분되게 (모자 모양, 손에 든 물건이 핵심) |

## 2. AI 사용 원칙

1. **무료 버전 = 시안 전용.** 무료 결과물은 상업 이용 불가 + 워터마크 → 게임·스토어 페이지에 절대 넣지 않는다. 방향 결정, 외주 작가에게 보여줄 참고 자료로만 쓴다.
2. **유료 전환 후에도** 같은 캐릭터를 프레임마다 똑같이 그리는 건 AI가 약하다. 주인공·장비 애니메이션 프레임은 사람이 다듬는 공정을 전제로 한다.
3. **Steam 공개:** 플레이어가 보는 그림에 AI 생성물이 들어가면 스토어 페이지 AI 공개 양식에 적는다.
4. 결과물은 `art/reference/날짜_주제_번호.png`로 모으고, 어떤 프롬프트로 뽑았는지 같이 적어 둔다 (나중에 유료로 다시 뽑을 때 재현용).

## 3. 힉스필드 시안 프롬프트 (복사해서 사용)

공통 꼬리말 (모든 프롬프트 끝에 붙이기):

```
Korean webtoon style, clean line art, cel shading, bright pastel colors, full body, white background, character design sheet, high quality 2D illustration
```

### 3-1. 주인공 (산린이 직장인)

```
A cheerful Korean office worker in their late 20s who is a total beginner hiker, wearing jeans, white sneakers and a plain hoodie, holding a smartphone, slightly nervous smile, front view, side view and back view, 4.5 head-tall proportions
```

장비를 다 갖춘 정상 버전:

```
The same Korean office worker, now in a colorful hiking outfit: orange windbreaker, flower crown on a hiking cap, holding a green onion like a trekking pole, big proud grin, victory pose on a mountain summit rock
```

### 3-2. NPC (기획서 6장 기준)

| NPC | 프롬프트 |
|---|---|
| 순자 할머니 | `A tiny energetic Korean grandmother in her 70s, barefoot hiker, bright floral vest, visor cap, doing morning exercise, confident smirk` |
| 다람쥐 도토 | `A mischievous cartoon squirrel mascot holding an acorn, big fluffy tail, wearing a tiny red bandana, playful wink` |
| 봉순 이모 (계곡 산장) | `A warm Korean mountain lodge owner in her 50s, apron, flipping a green onion pancake on a griddle, laughing` |
| 브이로거 준표 | `A young Korean vlogger in his 20s, trendy outdoor gear, selfie stick with action camera, overexcited expression` |
| 강 부장님 | `A tired Korean middle-aged manager in his 50s, expensive hiking gear, knee brace, sweating, holding his lower back` |
| 구름바위 산신 | `A comical mountain spirit old man made of clouds, long white beard, riding a small cloud, mischievous smile, holding a wooden staff` |

### 3-3. 배경 (구간별)

```
Side-scrolling 2D game background, Korean mountain pine forest trail with gentle slope, morning light, Korean webtoon background art style, soft pastel colors, no characters
```

바꿔 넣을 부분: `pine forest trail with gentle slope` →
- 계곡: `rocky valley with a suspension bridge and a mountain hut`
- 단풍: `steep stairs through red and orange autumn maple trees`
- 능선: `windy ridge with a view of a distant city`
- 바위: `steep rocky slope with safety ropes`
- 깔딱고개: `very steep foggy trail near the summit, cold blue tones`
- 정상: `summit rock above a sea of clouds at sunrise, engraved stone marker`

### 3-4. 표정 시트 / 미니게임 SD

```
Expression sheet of the same character, six expressions: neutral, happy, flustered, angry, exhausted, moved to tears, webtoon effects like sweat drops and sparkles, head and shoulders only
```

```
Super deformed chibi version of the same character, 2.5 head-tall, frantically pressing buttons, comedic motion lines
```

## 4. 시안 평가 체크리스트

시안을 뽑으면 아래로 골라 주세요.

- [ ] 주인공을 처음 봤을 때 "웹툰 주인공 같다"는 느낌이 드는가
- [ ] 장비(모자·손 소품)를 바꿨을 때 실루엣만으로 구분되는가
- [ ] NPC끼리 체형·색이 겹치지 않는가
- [ ] 배경이 캐릭터보다 튀지 않는가
- [ ] 정상 사진으로 SNS에 올리고 싶은 그림인가
