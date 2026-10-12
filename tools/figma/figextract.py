"""Per gift row on a process page: source, idea text, drafts (DRAFTS frame), keyframes (SELECTED frame)."""
import json, sys
tree, pname, out = sys.argv[1:4]
t = json.load(open(tree, encoding="utf-8"))
doc = next(i for i, n in t.items() if n["type"] == "DOCUMENT")
page = next(p for p in t[doc]["children"] if t[p]["name"] == pname)


def walk(i, ox, oy, acc):
    n = t[i]
    x, y = ox + (n["xy"] or [0, 0])[0], oy + (n["xy"] or [0, 0])[1]
    if n["paints"] or n["type"] == "TEXT":
        acc.append((y, x, n))
    for c in n["children"]:
        walk(c, x, y, acc)


def frame(title):
    for f in t[page]["children"]:
        acc = []
        for c in t[f]["children"]:
            walk(c, 0, 0, acc)
        if any(o[2]["type"] == "TEXT" and o[2]["text"].strip() == title for o in acc):
            return acc


def rows(acc):
    anchors = sorted(((y, n) for y, x, n in acc if x < 1200 and n["paints"]), key=lambda a: a[0])
    res = []
    for ai, (ay, an) in enumerate(anchors):
        ny = anchors[ai + 1][0] if ai + 1 < len(anchors) else 1e9
        items = sorted(((x, n) for y, x, n in acc if ay - 300 <= y < ny - 300), key=lambda a: a[0])
        res.append((an["name"].rsplit(" ", 1)[0], an["paints"][0][1], items))
    return res


data = {}
for name, src, items in rows(frame("DRAFTS")):
    seen, drafts = {src}, []
    for x, n in items:
        if x < 4000: continue
        for p in n["paints"]:
            if p[0] == "img" and p[1] not in seen:
                seen.add(p[1]); drafts.append({"x": x, "h": p[1], "w": n["size"]})
    data[src] = {"name": name, "source": src, "drafts": drafts}
for name, src, items in rows(frame("SELECTED")):
    d = data.setdefault(src, {"name": name, "source": src, "drafts": []})
    d["idea"] = " ".join(" ".join(n["text"].replace(" ", " ").split()) for x, n in items if n["type"] == "TEXT")
    seen, sel = {src}, []
    for x, n in items:
        if x < 4000: continue
        for p in n["paints"]:
            if p[0] == "img" and p[1] not in seen:
                seen.add(p[1]); sel.append({"x": x, "h": p[1]})
    d["selected"] = sel
json.dump(list(data.values()), open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for d in data.values():
    print(d["name"], len(d["drafts"]), len(d.get("selected", [])), d.get("idea", "")[:90])
