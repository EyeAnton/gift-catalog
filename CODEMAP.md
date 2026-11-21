# CODEMAP — gift-catalog

A static data + media repo. No build, no runtime code of its own except the redirect in `index.html`.
GitHub Pages serves `main` at https://eyeanton.github.io/gift-catalog/; the **portfolio** repo
(EyeAnton.github.io) is the only consumer.

## Data flow

```
_raw originals (not in git, ~2.7 GB, on the Mac)        Figma working file .fig (not in git)
   │ ffmpeg (VP9 alpha, WebP)                              │ tools/figma/figtree.py → figextract.py
   │ tools/hevc_alpha.swift (HEVC alpha .mov)              │ → candsheet.py / curate.py / addproc.py
   │ tools/encode_showcase.sh (1080px, optional)           ▼
   │ tools/normalize_sound.py (mp3 → −37 LUFS)          process.json + assets/process/<key>/
   ▼
assets/{thumbs,anim,anim640,anim1540}/<key>.*  ◄── paths listed in gifts.json (+ silhouettes.json by key)
   │
   │  GitHub Pages: /gift-catalog/…
   ▼
portfolio: gifts.js  loads gifts.json, silhouettes.json, process.json (makes media paths absolute)
           app.js    loads gifts.json, thumbs, full_webm / full_mov_safari (hero strip, export demo)
           projects.json  case blocks; some image paths point straight at /gift-catalog/assets/process/…
```

Browser choice inside the portfolio: WebKit → `preview_webp_safari` / `full_mov_safari`; others → `*_webm`;
full-screen overlay prefers `full_hd_webm` (anim1540) where present.

## Files

| File | Role | Written by |
|---|---|---|
| `index.html` | redirect to `/project.html?id=virtual-gifts` (meta refresh + `location.replace`) | hand |
| `gifts.json` | `{items: [{key, id, group, name, romantic, still, preview_webm, preview_webp_safari, full_webm, full_hd_webm, full_mov_safari, sound}]}` — catalog order | hand / one-off scripts |
| `silhouettes.json` | `{key: {w, h, d}}` SVG path, 120px grid | one-off OpenCV script (not in repo) |
| `process.json` | `{items: [{key, idea:{ru,en}, frames:[…], drafts:[{src, picked}]}]}` | `tools/figma/curate.py` (rewrites all) or `addproc.py` (appends) |
| `showcase.json` | `{gifts:[…], hires:[…]}` — historical; the live choice is in the portfolio admin | `tools/encode_showcase.sh` |
| `tools/check.py` | consistency check (the test of this repo) | — |
| `tools/normalize_sound.py` | loudness of `assets/anim640/*.mp3` | — |
| `tools/encode_showcase.sh`, `tools/hevc_alpha.swift` | high-res re-encode from `_raw` (macOS) | — |
| `tools/figma/*` | `.fig` → process frames, see its README | — |

## Invariants (checked by `tools/check.py`)

- every media path in `gifts.json` exists; keys are unique;
- `silhouettes.json` has exactly the keys of `gifts.json`;
- every `process.json` gift is in `gifts.json` and has `source.webp`, its frames and drafts;
- `showcase.json` keys are in `gifts.json`.

## Gaps

- The encoder for `assets/anim1540/` (commit 59ef7c0) is not in `tools/`.
- The silhouette generator is described in README but not in `tools/`.
