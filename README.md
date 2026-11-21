# Gift Catalog — data and media of the Virtual Gifts case

**Purpose.** Data and media for the "Virtual Gifts" case of the portfolio: 56 animated 3D gifts
(stills, alpha animations for Chrome/Firefox and Safari, sounds, Figma process frames).
The case page itself lives in the portfolio: https://eyeanton.github.io/project.html?id=virtual-gifts
(blocks in `projects.json` of EyeAnton.github.io, edited in its admin; the interactive parts are `gifts.js` / `gifts.css` there).
The old address https://eyeanton.github.io/gift-catalog/ redirects to it (`index.html`).

**Status:** done, in maintenance — new gifts or re-encodes only. Map of files and data flow: [CODEMAP.md](CODEMAP.md).

This repo keeps only what that page loads from `/gift-catalog/` (GitHub Pages, root of `main`).
**Don't rename or move these files** — the portfolio refers to them by path.

## Run and check

```sh
python3 -m http.server 8000      # then open the portfolio locally, or fetch http://localhost:8000/gifts.json
python3 tools/check.py           # the one check: JSON parses, every referenced file exists, keys agree
```

`tools/check.py` needs only Python 3 (stdlib). It also counts paths that the portfolio's
`projects.json` uses directly when the portfolio repo is next door (`../portfolio`) or in `$PORTFOLIO_DIR`.
Run it before every push that touches `gifts.json`, `process.json`, `silhouettes.json` or `assets/`.

Tools for re-encoding and Figma extraction: `pip install -r tools/requirements.txt`, plus ffmpeg (libvpx-vp9)
and, on macOS, Xcode command line tools for `tools/hevc_alpha.swift`.

## Structure

| Path | What |
|---|---|
| `gifts.json` | the 56 gifts in catalog order: key, English name, media paths |
| `silhouettes.json` | each gift's SVG silhouette — the shimmering skeleton while the still loads |
| `process.json` | "one gift, five steps": brief (RU/EN), drafts, key frames per gift |
| `showcase.json` | record of the original laptop + phone choice (the live choice is in the portfolio admin) |
| `assets/thumbs/<key>.webp` | stills, ≤360px, transparent, trimmed (match silhouettes) |
| `assets/anim/<key>.webm` | 320px VP9 alpha card preview (Chrome, Firefox) |
| `assets/anim/<key>.webp` | 320px animated WebP alpha — Safari/iOS (WebKit drops VP9 alpha) |
| `assets/anim640/<key>.webm` | 640px VP9 alpha full-screen animation (Chrome, Firefox) |
| `assets/anim640/<key>.mov` | 640px HEVC alpha full-screen animation — Safari/iOS |
| `assets/anim640/<key>.mp3` | gift sound |
| `assets/anim1540/<key>.webm` | full-size (1540/1440px) VP9 alpha for the full-screen overlay (`full_hd_webm`; 45 of 47 animated gifts) |
| `assets/process/<key>/` | working frames from Figma for `process.json` (and storyboard frames `s*.webp` used by `projects.json`) |
| `tools/` | maintenance scripts: `check.py`, `normalize_sound.py`, `encode_showcase.sh`, `hevc_alpha.swift`, `figma/` |

The 9 symbols have no animation; the overlay shows the still, slightly scaled up.
Source originals (`_raw`, 2.7 GB) are **not** in this repo.

Which gifts play in the laptop + phone mockups is a field of the block "Подарки: ноутбук и телефон" in the admin
(keys from `gifts.json`); `showcase.json` is kept only as the record of the original choice.

### Re-encoding

Safari/iOS overlay uses HEVC-with-alpha `.mov` (Safari decodes it natively; ~1 MB vs ~3 MB
for a 640px animated WebP). ffmpeg's `hevc_videotoolbox` writes alpha streams AVFoundation
can't decode, so these are made with AVFoundation itself from the original `movie-hevc.mp4`
(`tools/hevc_alpha.swift`: `AVAssetReader` → `AVAssetWriter`, codec `.hevcWithAlpha`, 640px, 1.2 Mbit/s, `.mov` container).

```sh
# VP9 with alpha, 640px (decode with libvpx-vp9 to keep alpha)
ffmpeg -c:v libvpx-vp9 -i movie-webm.webm -vf scale=640:-1 -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 36 -an -auto-alt-ref 0 out.webm
# Animated WebP with alpha for Safari, 640px
ffmpeg -c:v libvpx-vp9 -i movie-webm.webm -vf "fps=20,scale=640:-1:flags=lanczos" -c:v libwebp_anim -q:v 60 -loop 0 -an -f webp out.webp
```

New gifts: add an entry to `gifts.json` and a silhouette to `silhouettes.json`
(alpha → threshold 40 → `findContours(RETR_CCOMP)` → `approxPolyDP(0.7)` → path on a 120px grid), then `python3 tools/check.py`.

The 640px files go soft when stretched over the laptop screen. On the Mac with the originals,
`tools/encode_showcase.sh <path to _raw>` encodes the showcase gifts
to 1080px VP9 alpha + HEVC alpha in `assets/anim1080/`; then list those keys in the admin field
"Подарки с файлами 1080px" of the mockups block (the script also writes them to `showcase.json` "hires",
which the page no longer reads). `assets/anim1080/` is not in the repo at the moment.

## Громкость звуков

Все `assets/anim640/*.mp3` выровнены до **−37 LUFS** (средняя громкость, EBU R128), только усилением, без компрессии. Новый звук: `python tools/normalize_sound.py` (нужен ffmpeg или `pip install imageio-ffmpeg`), проверка без записи — `--check`.
