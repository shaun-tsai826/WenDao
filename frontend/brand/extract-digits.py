# 從 Barlow Condensed SemiBold 取出「5888」的外框路徑（Logo 用，數字不依賴字型）
#
# 用法（需要 fontTools：pip install fonttools）：
#   python3 extract-digits.py <BarlowCondensed-SemiBold.ttf> > digits.json
# 字型來源：https://github.com/google/fonts/tree/main/ofl/barlowcondensed（SIL Open Font License 1.1）
#
# 輸出：每種用途一組 SVG path d（座標已換算到該用途的 viewBox），數字以 center_x 置中、baseline 為基線。
import json
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

TEXT = '5888'

# 與設計稿 Logo A 相同的位置：(viewBox 寬, 中心 x, 基線 y, 字級, 字距)
LAYOUTS = {
    'plate': (140, 70, 68, 58, 2),    # 門牌（登入頁、大圖）：viewBox 140×96
    'header': (140, 70, 70, 62, 2),   # 頂欄小尺寸：數字放大一點
    'icon': (100, 50, 62, 34, 1),     # App 圖示（方形）：viewBox 100×100
    'favicon': (100, 50, 68, 46, 0),  # 瀏覽器分頁：沒有框，數字盡量大
}


def main(font_path):
    font = TTFont(font_path)
    upm = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font['hmtx']
    names = [cmap[ord(c)] for c in TEXT]

    result = {}
    for key, (_, center_x, baseline, size, spacing) in LAYOUTS.items():
        scale = size / upm
        advances = [hmtx[n][0] * scale for n in names]
        width = sum(advances) + spacing * (len(names) - 1)
        x = center_x - width / 2
        pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
        for name, advance in zip(names, advances):
            # 字型座標 y 向上、SVG y 向下：翻轉並移到基線
            glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
            x += advance + spacing
        result[key] = pen.getCommands()
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main(sys.argv[1])
