# Gift Catalog

Catalog of animated virtual gifts — a section of Anton's portfolio (https://eyeanton.github.io/),
served at https://eyeanton.github.io/gift-catalog/ and linked from the "Virtual Gifts" project card.
Shares the portfolio header and RU/EN setting (`localStorage.lang`, same origin).

- One grid of 56 gifts in `gifts.json` order (wedding and symbols mixed in on purpose — it is one catalog), English names, plain card background.
- Loading skeleton: each gift's real SVG silhouette (`silhouettes.json`) with a shimmer, cross-fading to the still.
- Click a gift: full-screen overlay "as if sent in a chat" — dimmed chat behind, the animation with sound, closes itself when it ends (Esc / click also close).
- Desktop hover plays a small preview.

Plain HTML/CSS/JS, no build step. Data comes from `gifts.json`.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Media

| Path | What |
|---|---|
| `assets/thumbs/<key>.webp` | stills, ≤360px, transparent, trimmed (match silhouettes) |
| `assets/anim/<key>.webm` | 320px VP9 alpha card preview (Chrome, Firefox) |
| `assets/anim/<key>.webp` | 320px animated WebP alpha — Safari/iOS (WebKit drops VP9 alpha) |
| `assets/anim640/<key>.webm` | 640px VP9 alpha full-screen animation (Chrome, Firefox) |
| `assets/anim640/<key>.mov` | 640px HEVC alpha full-screen animation — Safari/iOS |
| `assets/anim640/<key>.mp3` | gift sound |

The 9 symbols have no animation; the overlay shows the still, slightly scaled up.

Source originals (`_raw`, 2.7 GB) are **not** in this repo.

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

## Deploy

Static site — GitHub Pages (root of `main`) or Cloudflare Pages (no build command, output dir `/`).
