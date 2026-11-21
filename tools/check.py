#!/usr/bin/env python3
"""Consistency check of the data the portfolio loads from /gift-catalog/ (stdlib only, offline).

    python3 tools/check.py

Fails (exit 1) when:
  - gifts.json / process.json / silhouettes.json / showcase.json don't parse or lack their top-level keys;
  - a media path in gifts.json points to a missing file, or a gift has no still;
  - gift keys repeat, or silhouettes.json and gifts.json disagree on the keys;
  - a process.json gift is unknown or its source/frames/drafts are missing in assets/process/<key>/;
  - showcase.json names a key that isn't in gifts.json.
Warns (exit 0) about files under assets/ that no JSON refers to (e.g. stray editor temp files).
Paths the portfolio's projects.json uses directly are counted too when the portfolio repo is found
next to this one (../portfolio) or in $PORTFOLIO_DIR.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_FIELDS = ("still", "preview_webm", "preview_webp_safari", "full_webm", "full_hd_webm", "full_mov_safari", "sound")


def load(name, key, errors):
    try:
        with open(os.path.join(ROOT, name), encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError) as e:
        errors.append(f"{name}: {e}")
        return None
    if key and not isinstance(data.get(key) if isinstance(data, dict) else None, list):
        errors.append(f"{name}: no list '{key}'")
        return None
    return data


def main():
    errors, used = [], set()
    gifts = load("gifts.json", "items", errors)
    process = load("process.json", "items", errors)
    sil = load("silhouettes.json", None, errors)
    showcase = load("showcase.json", "gifts", errors)

    keys = []
    for g in (gifts or {}).get("items", []):
        key = g.get("key")
        if not key:
            errors.append(f"gifts.json: item without key: {g}")
            continue
        keys.append(key)
        if not g.get("still"):
            errors.append(f"gifts.json {key}: no still")
        for field in MEDIA_FIELDS:
            p = g.get(field)
            if not p:
                continue
            used.add(os.path.normpath(p))
            if not os.path.isfile(os.path.join(ROOT, p)):
                errors.append(f"gifts.json {key}.{field}: missing {p}")
    dup = sorted({k for k in keys if keys.count(k) > 1})
    if dup:
        errors.append(f"gifts.json: repeated keys {dup}")
    known = set(keys)

    if isinstance(sil, dict) and gifts:
        for k in sorted(known - set(sil)):
            errors.append(f"silhouettes.json: no silhouette for {k}")
        for k in sorted(set(sil) - known):
            errors.append(f"silhouettes.json: {k} is not in gifts.json")

    for it in (process or {}).get("items", []):
        key = it.get("key")
        if key not in known:
            errors.append(f"process.json: {key} is not in gifts.json")
        names = ["source.webp"] + list(it.get("frames", [])) + [d.get("src") for d in it.get("drafts", [])]
        for n in names:
            p = os.path.join("assets", "process", str(key), str(n))
            used.add(os.path.normpath(p))
            if not os.path.isfile(os.path.join(ROOT, p)):
                errors.append(f"process.json {key}: missing {p}")

    for k in (showcase or {}).get("gifts", []):
        if k not in known:
            errors.append(f"showcase.json: {k} is not in gifts.json")

    # the portfolio's case blocks also point at files here ("/gift-catalog/assets/..."); count them when it's checked out next door
    portfolio = os.environ.get("PORTFOLIO_DIR") or os.path.join(os.path.dirname(ROOT), "portfolio")
    pj = os.path.join(portfolio, "projects.json")
    if os.path.isfile(pj):
        with open(pj, encoding="utf-8", errors="replace") as f:
            for p in re.findall(r"/gift-catalog/(assets/[^\"'\s)]+)", f.read()):
                used.add(os.path.normpath(p))

    unused = []
    for d, _, files in os.walk(os.path.join(ROOT, "assets")):
        for f in files:
            if f == ".DS_Store":
                continue
            rel = os.path.normpath(os.path.relpath(os.path.join(d, f), ROOT))
            if rel not in used:
                unused.append(rel)

    print(f"{len(keys)} gifts, {len((process or {}).get('items', []))} with process steps, {len(used)} media files referenced")
    if unused:
        print(f"warning: {len(unused)} file(s) under assets/ are not referenced by any JSON, e.g.:")
        for p in sorted(unused)[:5]:
            print("   ", p)
    for e in errors:
        print("error:", e)
    print("FAIL" if errors else "OK")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
