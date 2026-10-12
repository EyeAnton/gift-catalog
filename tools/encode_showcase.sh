#!/usr/bin/env bash
# High-res animations for the showcase mockups (laptop + phone), macOS only.
#
#   tools/encode_showcase.sh ~/Downloads/Portfolio_cases/01_Gift_Catalog/_raw [width]
#
# For every key in showcase.json "gifts": finds the gift's originals in the raw folder
# (movie-webm.webm for VP9, movie-hevc.mp4 for HEVC), writes
#   assets/anim1080/<key>.webm  — VP9 with alpha (Chrome, Firefox)
#   assets/anim1080/<key>.mov   — HEVC with alpha (Safari, iOS), via tools/hevc_alpha.swift
# never upscaling past the source, then lists the key in showcase.json "hires",
# which makes the page use these files. Needs ffmpeg with libvpx-vp9 and Xcode tools.
set -euo pipefail

RAW="${1:?usage: tools/encode_showcase.sh <raw folder> [width]}"
WIDTH="${2:-1080}"
cd "$(dirname "$0")/.."
OUT=assets/anim1080
mkdir -p "$OUT"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)"; exit 1; }
BIN="${TMPDIR:-/tmp}/hevc_alpha"
[ "$BIN" -nt tools/hevc_alpha.swift ] || swiftc -O tools/hevc_alpha.swift -o "$BIN"

# key -> id (folder names in _raw usually carry the id, e.g. "wedding_rings")
pairs=$(python3 - <<'EOF'
import json
items = {g["key"]: g for g in json.load(open("gifts.json"))["items"]}
for k in json.load(open("showcase.json"))["gifts"]:
    print(k, items[k]["id"])
EOF
)

# Find one original by file name under a folder named exactly like the key or id,
# else under any path containing the id. Prints nothing if missing or ambiguous.
find_src() { # <key> <id> <file name>
  local hits
  hits=$(find "$RAW" -type f -name "$3" \( -path "*/$1/*" -o -path "*/$2/*" \) 2>/dev/null)
  [ -n "$hits" ] || hits=$(find "$RAW" -type f -name "$3" -path "*$2*" 2>/dev/null)
  if [ "$(printf '%s\n' "$hits" | grep -c .)" = 1 ]; then printf '%s' "$hits"
  elif [ -n "$hits" ]; then echo "  ambiguous $3 for $2:" >&2; printf '    %s\n' $hits >&2
  fi
}

done_keys=()
while read -r key id; do
  echo "== $key"
  webm=$(find_src "$key" "$id" movie-webm.webm || true)
  hevc=$(find_src "$key" "$id" movie-hevc.mp4 || true)
  if [ -z "$webm" ] || [ -z "$hevc" ]; then
    echo "  skipped: originals not found (webm: ${webm:-—}, hevc: ${hevc:-—})"
    continue
  fi
  # decode with libvpx-vp9 so the alpha channel survives; never upscale
  ffmpeg -loglevel error -y -c:v libvpx-vp9 -i "$webm" \
    -vf "scale='min($WIDTH,iw)':-2:flags=lanczos" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -row-mt 1 -an -auto-alt-ref 0 \
    "$OUT/$key.webm"
  "$BIN" "$hevc" "$OUT/$key.mov" 3000000 "$WIDTH"
  echo "  ok: $(du -h "$OUT/$key.webm" | cut -f1) webm, $(du -h "$OUT/$key.mov" | cut -f1) mov"
  done_keys+=("$key")
done <<< "$pairs"

# mark the encoded ones in showcase.json
python3 - "${done_keys[@]}" <<'EOF'
import json, sys
c = json.load(open("showcase.json"))
c["hires"] = sorted(set(c.get("hires", [])) | set(sys.argv[1:]))
open("showcase.json", "w").write(json.dumps(c, indent=1) + "\n")
print("showcase.json hires:", ", ".join(c["hires"]) or "—")
EOF
