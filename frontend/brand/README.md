# brand — 溫叨Pantry 的 Logo 與 App 圖示

> 版本：v1.0（2026-11-03）
> 變更摘要：v1.0 Logo A（台北市門牌 5888）定稿，建立圖示產生流程。

## 設計

- **Logo A 經典門牌**（2026-11-03 使用者選定；設計稿最下排 Logo-A）：藍底 `#1d5fd6`（App 主色）、內側白色細框、白色數字「5888」一行排開，白字對比 5.6:1。
- 數字字型：**Barlow Condensed SemiBold**（窄體數字，像門牌）。只用它的外框做成 SVG 路徑，畫面上不需要載入這個字型。

## 檔案

| 檔案 | 用途 |
|---|---|
| `extract-digits.py` | 從字型檔取出「5888」的外框路徑 → `digits.json`（只有要換字型或調整位置時才需要重跑） |
| `digits.json` | 各用途的數字路徑（門牌、頂欄、App 圖示、瀏覽器分頁），**所有圖示的唯一來源** |
| `build-icons.mjs` | 依 `digits.json` 產生下面所有檔案 |
| `svg/*.svg` | 各用途的 SVG 原始檔（logo、logo-header、app-icon、app-icon-ios、app-icon-maskable、app-icon-monochrome、favicon、safari-pinned-tab） |
| `../src/components/brandPaths.ts` | `BrandLogo.vue` 用的路徑（自動產生，不要手改） |
| `../public/icons/*.png`、`../public/favicon.ico` | PWA、iOS、瀏覽器分頁用的圖示 |
| `BarlowCondensed-OFL.txt` | 字型授權全文 |

## 重新產生圖示

改了 `build-icons.mjs` 裡的顏色或排版後，在 `frontend/` 底下執行（需要 Google Chrome）：

```bash
node brand/build-icons.mjs
```

要換數字的字型或調整數字位置時，先重新取出外框（需要 fontTools）：

```bash
python3 -m venv /tmp/brand-venv && /tmp/brand-venv/bin/pip install fonttools
curl -L -o /tmp/BarlowCondensed-SemiBold.ttf https://github.com/google/fonts/raw/main/ofl/barlowcondensed/BarlowCondensed-SemiBold.ttf
/tmp/brand-venv/bin/python brand/extract-digits.py /tmp/BarlowCondensed-SemiBold.ttf > brand/digits.json
node brand/build-icons.mjs
```

## 各圖示的注意事項

- **maskable**（Android）：系統會裁成圓形等形狀，門牌縮成 0.78 倍放在中央 80% 的安全範圍內。
- **iOS**（apple-icon）：系統自己會裁圓角，所以圖片是滿版方形、沒有透明。
- **monochrome**：系統只看不透明的部分再自己上色，所以是透明底、只有門牌線條與數字。
- **瀏覽器分頁**：16px 太小，拿掉框線、數字盡量放大；16px 仍難以辨認數字，32px 以上清楚。

## 授權

數字外框取自 Barlow Condensed（Copyright 2017 The Barlow Project Authors，https://github.com/jpt/barlow），採 SIL Open Font License 1.1（全文見 `BarlowCondensed-OFL.txt`）。OFL 允許把字型用於 Logo 與圖示。
