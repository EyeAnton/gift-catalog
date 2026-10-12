"""Numbered candidate sheet per gift: row S = selected (keyframes), row D = drafts."""
import json, os, sys
from PIL import Image, ImageDraw

tmp = sys.argv[1]
imgdir = os.path.join(tmp, "fig_x", "images")
pages = {1: json.load(open(os.path.join(tmp, "proc1.json"), encoding="utf-8")),
         2: json.load(open(os.path.join(tmp, "proc2.json"), encoding="utf-8"))}
PICK = [(1, "в рожок"), (2, "дерево расцветает"), (2, "книга открытая"), (1, "бутылка появилась"), (2, "набор для пикника")]
S = 130
lines = []
for page, needle in PICK:
    row = next(r for r in pages[page] if needle in r.get("idea", ""))
    lines.append(("S", [row["source"]] + [s["h"] for s in sorted(row.get("selected", []), key=lambda s: s["x"])]))
    lines.append(("D", [s["h"] for s in sorted(row["drafts"], key=lambda s: s["x"])]))
W = max(len(l[1]) for l in lines) * (S + 4)
sheet = Image.new("RGB", (W, len(lines) * (S + 4)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for ri, (tag, hs) in enumerate(lines):
    for ci, h in enumerate(hs):
        im = Image.open(os.path.join(imgdir, h)).convert("RGB")
        im.thumbnail((S, S))
        sheet.paste(im, (ci * (S + 4), ri * (S + 4)))
        dr.rectangle([ci * (S + 4), ri * (S + 4), ci * (S + 4) + 34, ri * (S + 4) + 14], fill=(0, 0, 0))
        dr.text((ci * (S + 4) + 2, ri * (S + 4) + 1), f"{tag}{ci}", fill=(255, 220, 0))
sheet.save(os.path.join(tmp, "cands.jpg"), quality=85)
