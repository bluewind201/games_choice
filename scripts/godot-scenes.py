# 나이 스테이지용 대화 배경(128x80 도트)을 그린다: 유치원·교실·학원·카페, 낮/저녁/밤.
# 사용: python3 scripts/godot-scenes.py  → godot/assets/img/scene_{kinder,class,academy,cafe}_{day,dusk,night}.png
import pathlib
from PIL import Image, ImageDraw

out = pathlib.Path(__file__).resolve().parent.parent / 'godot/assets/img'
SKY = {'day': ('#8fd3ff', '#cdeeff'), 'dusk': ('#ff9e6b', '#ffd08a'), 'night': ('#1d2350', '#2e3a78')}
LIGHT = {'day': 1.0, 'dusk': 0.92, 'night': 0.75}

def hexc(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

def dim(c, k):
    c = hexc(c) if isinstance(c, str) else c
    return tuple(max(0, min(255, int(v * k))) for v in c)

def window(d, x, y, w, h, tag):
    top, bot = SKY[tag]
    d.rectangle([x - 2, y - 2, x + w + 1, y + h + 1], fill=hexc('#f4f4f4'))
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=hexc(bot))
    d.rectangle([x, y, x + w - 1, y + h // 2], fill=hexc(top))
    if tag == 'night':
        for i in range(4):
            d.point((x + 3 + i * 7 % w, y + 2 + (i * 5) % (h // 2)), fill=hexc('#fff6c0'))
    else:
        d.rectangle([x + 2, y + h - 6, x + w - 3, y + h - 1], fill=hexc('#7cc46a' if tag == 'day' else '#9a7a4a'))
    d.line([x + w // 2, y, x + w // 2, y + h - 1], fill=hexc('#f4f4f4'))

def floor(d, y, c1, c2, k):
    d.rectangle([0, y, 127, 79], fill=dim(c1, k))
    for x in range(0, 128, 12):
        d.line([x, y, x, 79], fill=dim(c2, k))
    d.line([0, y, 127, y], fill=dim('#1d1430', 1))

def kinder(tag):
    k = LIGHT[tag]
    im = Image.new('RGB', (128, 80), dim('#ffe9b0', k))
    d = ImageDraw.Draw(im)
    for i, c in enumerate(['#ff8fab', '#8ef0c4', '#bfcaff', '#ffd166']):
        d.rectangle([i * 32, 0, i * 32 + 31, 6], fill=dim(c, k))
    window(d, 10, 14, 26, 22, tag)
    # 알파벳 블록 장식과 그림 게시판
    d.rectangle([48, 12, 84, 34], fill=dim('#fff6e0', k), outline=hexc('#c66f00'))
    for i, c in enumerate(['#ff4f6d', '#4f6dff', '#2e9e6b']):
        d.ellipse([52 + i * 11, 18, 59 + i * 11, 25], fill=dim(c, k))
    d.rectangle([92, 16, 118, 36], fill=dim('#8ef0c4', k), outline=hexc('#1d1430'))
    d.text((97, 19), 'ABC', fill=hexc('#1d1430'))
    floor(d, 56, '#f0c27a', '#d9a65c', k)
    for i, c in enumerate(['#ff4f6d', '#ffd166', '#4f6dff', '#43d39e']):
        x = 6 + i * 9
        d.rectangle([x, 64, x + 7, 71], fill=dim(c, k), outline=hexc('#1d1430'))
    d.rectangle([96, 58, 124, 64], fill=dim('#ff9f1a', k), outline=hexc('#1d1430'))
    d.rectangle([98, 64, 100, 74], fill=hexc('#1d1430'))
    d.rectangle([120, 64, 122, 74], fill=hexc('#1d1430'))
    return im

def classroom(tag, academy=False):
    k = LIGHT[tag]
    im = Image.new('RGB', (128, 80), dim('#e7ecd9' if not academy else '#eef0f6', k))
    d = ImageDraw.Draw(im)
    # 칠판(학원은 화이트보드)
    bx, bw = 34, 60
    d.rectangle([bx - 2, 8, bx + bw + 1, 40], fill=hexc('#8a6a4a'))
    d.rectangle([bx, 10, bx + bw - 1, 38], fill=dim('#2e5b46' if not academy else '#fbfbff', k))
    ink = '#f4f4f4' if not academy else '#4f6dff'
    for i in range(3):
        d.line([bx + 6, 16 + i * 7, bx + 30 + (i * 9) % 20, 16 + i * 7], fill=hexc(ink))
    d.text((bx + 38, 13), 'x+2' if academy else '1+1', fill=hexc(ink))
    window(d, 4, 12, 22, 26, tag)
    window(d, 102, 12, 22, 26, tag)
    # 시계와 급훈 액자
    d.ellipse([60, 1, 67, 7], fill=hexc('#ffffff'), outline=hexc('#1d1430'))
    floor(d, 52, '#c99b62', '#a87d48', k)
    for row, y in enumerate([58, 68]):
        for i in range(4):
            x = 6 + i * 32 + row * 6
            d.rectangle([x, y, x + 20, y + 4], fill=dim('#e0b070', k), outline=hexc('#1d1430'))
            d.rectangle([x + 2, y + 5, x + 3, y + 10], fill=hexc('#1d1430'))
            d.rectangle([x + 17, y + 5, x + 18, y + 10], fill=hexc('#1d1430'))
    return im

def cafe(tag):
    k = LIGHT[tag]
    im = Image.new('RGB', (128, 80), dim('#d9c2a3', k))
    d = ImageDraw.Draw(im)
    for x in range(0, 128, 8):
        d.line([x, 0, x, 44], fill=dim('#c7ad8b', k))
    window(d, 6, 10, 30, 26, tag)
    # 메뉴판
    d.rectangle([48, 6, 92, 30], fill=hexc('#2a2140'), outline=hexc('#8a6a4a'))
    for i in range(4):
        d.line([52, 11 + i * 5, 72, 11 + i * 5], fill=hexc('#fff6e0'))
        d.line([80, 11 + i * 5, 88, 11 + i * 5], fill=hexc('#ffd166'))
    # 화분과 조명
    d.rectangle([104, 26, 112, 36], fill=dim('#c66f00', k))
    d.ellipse([100, 12, 116, 28], fill=dim('#2e9e6b', k))
    for x in (60, 84):
        d.line([x, 0, x, 34], fill=hexc('#1d1430'))
        d.polygon([(x - 4, 38), (x + 4, 38), (x, 34)], fill=hexc('#ffd166' if tag != 'day' else '#fff6c0'))
    floor(d, 50, '#8a6a4a', '#6e5238', k)
    d.rectangle([0, 46, 127, 54], fill=dim('#5a3d28', k), outline=hexc('#1d1430'))
    for x, c in [(14, '#ffffff'), (30, '#ffb3c1'), (96, '#ffffff')]:
        d.rectangle([x, 41, x + 5, 46], fill=hexc(c), outline=hexc('#1d1430'))
    d.rectangle([110, 38, 124, 46], fill=hexc('#555a66'), outline=hexc('#1d1430'))
    return im

for tag in ('day', 'dusk', 'night'):
    kinder(tag).save(out / f'scene_kinder_{tag}.png')
    classroom(tag).save(out / f'scene_class_{tag}.png')
    classroom(tag, True).save(out / f'scene_academy_{tag}.png')
    cafe(tag).save(out / f'scene_cafe_{tag}.png')
print('ok')
