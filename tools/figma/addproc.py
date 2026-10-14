"""Add more gifts to process.json + assets/process/<key>/ from the Figma rows (existing items are kept as they are).
usage: addproc.py <figdir with proc*.json + fig_x/images> <gift-catalog repo> sheet|write"""
import json, os, sys
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
src, repo, mode = sys.argv[1], sys.argv[2], sys.argv[3]
imgdir = os.path.join(src, "fig_x", "images")
pages = {n: json.load(open(os.path.join(src, f"proc{n}.json"), encoding="utf-8")) for n in (1, 2)}

# key, page, needle (in the brief), EN brief, RU brief (tidied)[, drafts to drop: indices on the check sheet]
NEW = [
    ("sep__crown_ai_3d", 1, "корона на подушке", "A crown on a cushion turns and sparkles.", "Корона на подушке вращается и блестит."),
    ("sep__honey_ai_3d", 1, "наливам мед", "Honey pours in, the jar closes, a little bee flies by.", "Наливаем мёд, закрываем банку, пролетает пчёлка."),
    ("sep__trumpet_bon_3d", 1, "саксофон", "The saxophone plays, releasing notes and hearts.", "Саксофон играет, выпускает ноты и сердечки."),
    ("sep__delicious_lollipop_colored_3d", 1, "леденец", "The lollipop turns and comes closer; candies fill the frame around it.",
     "Леденец вращается и немного приближается к камере, вокруг — карамельки по всему кадру."),
    ("sep__diamond_3d", 1, "бриллиант", "The diamond turns and sparkles among glittering rhinestones.", "Бриллиант вращается и блестит, вокруг много блестящих страз."),
    ("sym__shield", 1, "эмблема", "A plain emblem turns ornate; a pink halo of magic protection surrounds the shield.",
     "Эмблема из простой превращается в украшенную. Вокруг щита — розовый ореол магической защиты."),
    ("sep__male_ring_ai_3d", 1, "кольцо в брутальной", "A ring in a bold men's box: the box opens to show the ring.",
     "Кольцо в брутальной мужской коробочке: коробка открывается и показывает кольцо.", {0, 1, 2, 3}),
    ("sep__bear_airplane_3d", 2, "мишка-самолет", "A teddy plane flies through the clouds, winks at the camera and flies off.",
     "Мишка-самолёт летит среди облаков, мило подмигивает в камеру и вылетает из кадра."),
    ("sep__panda_with_heart_ai_3d", 2, "пандочка", "A cute panda presses a paw to its heart; a heart-shaped halo glows behind it.",
     "Милая панда нажимает лапкой на сердце; за ней плавно разгорается ореол в форме сердца."),
    ("sep__carriage_bon_3d", 2, "карета", "The carriage flies through the air, leaving a trail of hearts.", "Карета пролетает по воздуху, оставляя шлейф из сердечек."),
    ("sep__table_gift_3d", 2, "свечение переливается", "A glow shimmers across the heart; neon stars and hearts fill the frame.",
     "Свечение плавно переливается по сердцу, вокруг — неоновые звёздочки и сердечки на весь кадр.", {5, 7, 8}),
    ("sep__roses2_bon_3d", 2, "собираем букет", "Putting a bouquet together: an armful of flowers appears, then gets wrapped in paper.",
     "Собираем букет: сначала в кадре появляется охапка цветов, потом её оборачивают бумагой."),
]


def row_of(page, needle):
    return next(r for r in pages[page] if needle in r.get("idea", ""))


def parts(r, drop=()):
    S = [s["h"] for s in sorted(r.get("selected", []), key=lambda s: s["x"])]
    D = [s["h"] for s in sorted(r.get("drafts", []), key=lambda s: s["x"])]
    if len(S) > 4:  # four keyframes at most, spread over the sequence
        S = [S[round(i * (len(S) - 1) / 3)] for i in range(4)]
    if len(D) > 9:
        D = [D[round(i * (len(D) - 1) / 8)] for i in range(9)]
    D = [h for i, h in enumerate(D) if i not in drop]
    picked = set(s["h"] for s in r.get("selected", []))
    return S, D, picked


def img(h):
    return Image.open(os.path.join(imgdir, h)).convert("RGB")


if mode == "sheet":
    T = 120
    rows = []
    for key, page, needle, en, ru, *drop in NEW:
        r = row_of(page, needle)
        S, D, picked = parts(r, *drop)
        rows.append((key, [("SRC", r["source"])] + [(f"K{i+1}", h) for i, h in enumerate(S)] + [("D*" if h in picked else "D", h) for h in D]))
    W = max(len(x[1]) for x in rows) * (T + 4) + 4
    sheet = Image.new("RGB", (W, len(rows) * (T + 22)), (25, 25, 30))
    dr = ImageDraw.Draw(sheet)
    for ri, (key, cells) in enumerate(rows):
        y = ri * (T + 22)
        dr.text((4, y + 4), key, fill=(255, 220, 0))
        for ci, (tag, h) in enumerate(cells):
            im = img(h); im.thumbnail((T, T))
            sheet.paste(im, (4 + ci * (T + 4), y + 18))
            dr.rectangle([4 + ci * (T + 4), y + 18, 4 + ci * (T + 4) + 26, y + 30], fill=(0, 0, 0))
            dr.text((6 + ci * (T + 4), y + 19), tag, fill=(255, 255, 255))
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "newproc.jpg")
    sheet.save(out, quality=82)
    print(out, sheet.size)
else:
    pj = os.path.join(repo, "process.json")
    data = json.load(open(pj, encoding="utf-8"))
    have = {it["key"] for it in data["items"]}
    for key, page, needle, en, ru, *drop in NEW:
        if key in have:
            continue
        r = row_of(page, needle)
        S, D, picked = parts(r, *drop)
        d = os.path.join(repo, "assets", "process", key)
        os.makedirs(d, exist_ok=True)

        def save(h, name, size):
            im = img(h); im.thumbnail((size, size)); im.save(os.path.join(d, name), "WEBP", quality=78, method=6)
        save(r["source"], "source.webp", 480)
        item = {"key": key, "idea": {"ru": ru, "en": en}, "frames": [], "drafts": []}
        for i, h in enumerate(S, 1):
            save(h, f"k{i}.webp", 480); item["frames"].append(f"k{i}.webp")
        for i, h in enumerate(D, 1):
            save(h, f"d{i}.webp", 320); item["drafts"].append({"src": f"d{i}.webp", "picked": h in picked})
        data["items"].append(item)
        print(key, len(item["frames"]), len(item["drafts"]))
    json.dump(data, open(pj, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
