# Gift Catalog — data and media of the Virtual Gifts case

The case page now lives in the portfolio: https://eyeanton.github.io/project.html?id=virtual-gifts
(blocks in `projects.json` of EyeAnton.github.io, edited in its admin; the interactive parts are `gifts.js` / `gifts.css` there).
The old address https://eyeanton.github.io/gift-catalog/ redirects to it (`index.html`).

This repo keeps only what that page loads from `/gift-catalog/` (GitHub Pages, root of `main`).
**Don't rename or move these files** — the portfolio refers to them by path.

| Path | What |
|---|---|
| `gifts.json` | the 56 gifts in catalog order: key, English name, media paths |
| `silhouettes.json` | each gift's SVG silhouette — the shimmering skeleton while the still loads |
| `process.json` | "one gift, five steps": brief (RU/EN), drafts, key frames per gift |
| `assets/thumbs/<key>.webp` | stills, ≤360px, transparent, trimmed (match silhouettes) |
| `assets/anim/<key>.webm` | 320px VP9 alpha card preview (Chrome, Firefox) |
| `assets/anim/<key>.webp` | 320px animated WebP alpha — Safari/iOS (WebKit drops VP9 alpha) |
| `assets/anim640/<key>.webm` | 640px VP9 alpha full-screen animation (Chrome, Firefox) |
| `assets/anim640/<key>.mov` | 640px HEVC alpha full-screen animation — Safari/iOS |
| `assets/anim640/<key>.mp3` | gift sound |
| `assets/process/<key>/` | working frames from Figma for `process.json` |

The 9 symbols have no animation; the overlay shows the still, slightly scaled up.
Source originals (`_raw`, 2.7 GB) are **not** in this repo.

Which gifts play in the laptop + phone mockups is now a field of the block "Подарки: ноутбук и телефон" in the admin
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
(alpha → threshold 40 → `findContours(RETR_CCOMP)` → `approxPolyDP(0.7)` → path on a 120px grid).

The 640px files go soft when stretched over the laptop screen. On the Mac with the originals,
`tools/encode_showcase.sh ~/Downloads/Portfolio_cases/01_Gift_Catalog/_raw` encodes the showcase gifts
to 1080px VP9 alpha + HEVC alpha in `assets/anim1080/`; then list those keys in the admin field
"Подарки с файлами 1080px" of the mockups block.
