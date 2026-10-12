"""Build assets/process/* and process.json for the case page from hand-picked Figma frames.
Indices refer to the numbered candidate sheet: S = SELECTED row (S0 = source), D = DRAFTS row."""
import json, os, shutil, sys
from PIL import Image

tmp, repo = sys.argv[1], sys.argv[2]
imgdir = os.path.join(tmp, "fig_x", "images")
pages = {1: json.load(open(os.path.join(tmp, "proc1.json"), encoding="utf-8")),
         2: json.load(open(os.path.join(tmp, "proc2.json"), encoding="utf-8"))}

PICK = [
    dict(key="sep__icecream_3d", page=1, needle="в рожок",
         en="Fill the cone with ice cream and sprinkles; frost covers the scoop.",
         frames=["S1", "S2", "S3"], drafts=["D0", "D1", "D2", "D3", "D4"], picked=["D1", "D2", "D3"]),
    dict(key="sep__sakura", page=2, needle="дерево расцветает",
         en="Phase 1: the tree blossoms. Phase 2: petals drift down like a sakura in bloom.",
         frames=["S1", "D1", "S4"], drafts=["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"], picked=["D0", "D1", "D4"]),
    dict(key="sep__love_book_3d", page=2, needle="книга открытая",
         en="Phase 1: the open book writes I LOVE YOU and a heart; the pen flies off.",
         frames=["S1", "S2", "S3", "S4"], drafts=["D1", "D2", "D3", "D4", "D5", "D6", "D7"], picked=["D1"]),
    dict(key="sep__potion_bon_3d", page=1, needle="бутылка появилась",
         en="The bottle appears and opens, releasing a cloud of love that fills the whole screen.",
         frames=["S0", "S1", "S3"], drafts=["D0", "D1", "D2", "D3", "D4", "D6"], picked=["D4", "D6"]),
    dict(key="sep__picnic_bon_3d", page=2, needle="набор для пикника",
         en="A picnic set on a red-and-white blanket; food comes out of the basket.",
         frames=["S1", "S3", "S5", "S7"], drafts=["D0", "D2", "S3", "S4", "S5", "S6", "S7"], picked=["D0", "S3", "S7"]),
]


def save(h, path, size):
    im = Image.open(os.path.join(imgdir, h)).convert("RGB")
    im.thumbnail((size, size))
    im.save(path, "WEBP", quality=78, method=6)


shutil.rmtree(os.path.join(repo, "assets", "process"), ignore_errors=True)
out = []
for g in PICK:
    row = next(r for r in pages[g["page"]] if g["needle"] in r.get("idea", ""))
    S = [row["source"]] + [s["h"] for s in sorted(row.get("selected", []), key=lambda s: s["x"])]
    D = [s["h"] for s in sorted(row["drafts"], key=lambda s: s["x"])]
    ref = lambda r: (S if r[0] == "S" else D)[int(r[1:])]
    d = os.path.join(repo, "assets", "process", g["key"])
    os.makedirs(d, exist_ok=True)
    save(row["source"], os.path.join(d, "source.webp"), 480)
    item = {"key": g["key"], "idea": {"ru": " ".join(row["idea"].split()), "en": g["en"]}, "frames": [], "drafts": []}
    for i, r in enumerate(g["frames"], 1):
        save(ref(r), os.path.join(d, f"k{i}.webp"), 480)
        item["frames"].append(f"k{i}.webp")
    for i, r in enumerate(g["drafts"], 1):
        save(ref(r), os.path.join(d, f"d{i}.webp"), 320)
        item["drafts"].append({"src": f"d{i}.webp", "picked": r in g["picked"]})
    out.append(item)
    print(g["key"], len(item["frames"]), len(item["drafts"]))
json.dump({"items": out}, open(os.path.join(repo, "process.json"), "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
