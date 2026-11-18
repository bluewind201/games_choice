# 게임 글자(GDScript·JSON)에 쓰인 이모지·한자만 잘라 작은 보조 글꼴을 만든다.
#  - 흑백 Noto Emoji → godot/assets/fonts/NotoEmoji-subset.ttf
#  - Noto Sans KR(한자) → godot/assets/fonts/NotoSansKR-hanja.ttf
# 사용: python3 scripts/godot-fonts.py NotoEmoji[wght].ttf NotoSansKR[wght].ttf
import sys, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = pathlib.Path(__file__).resolve().parent.parent / 'godot'
text = ''
for p in list(root.rglob('*.gd')) + list(root.rglob('*.json')):
    text += p.read_text(encoding='utf-8')
chars = {ord(c) for c in text}

def make(src, cps, out, wght):
    font = TTFont(src)
    cmap = font.getBestCmap()
    keep = sorted(c for c in cps if c in cmap)
    opts = subset.Options()
    opts.layout_features = ['*']
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=keep)
    sub.subset(font)
    font = instancer.instantiateVariableFont(font, {'wght': wght})
    font.save(out)
    print(out.name, len(keep), 'glyphs', out.stat().st_size, 'bytes')

# 기하 도형(◀▶ 등)은 갈무리 글꼴 것을 쓰도록 이모지 글꼴에서 뺀다
emoji = {c for c in chars if c >= 0x2300 and not (0x25A0 <= c <= 0x25FF) and not (0xAC00 <= c <= 0xD7A3) and not (0x3130 <= c <= 0x318F) and not (0x4E00 <= c <= 0x9FFF)}
emoji |= {0xFE0F, 0x200D}
make(sys.argv[1], emoji, root / 'assets/fonts/NotoEmoji-subset.ttf', 600)
hanja = {c for c in chars if 0x4E00 <= c <= 0x9FFF}
make(sys.argv[2], hanja, root / 'assets/fonts/NotoSansKR-hanja.ttf', 800)
