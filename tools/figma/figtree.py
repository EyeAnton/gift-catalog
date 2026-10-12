"""Decode a Figma canvas.fig (kiwi) and dump the node tree: pages, frames, image/video hashes."""
import json, struct, sys, zlib
import zstandard

raw = open(sys.argv[1], "rb").read()
assert raw[:8] == b"fig-kiwi"
p, chunks = 12, []
while p < len(raw):
    n = struct.unpack("<I", raw[p:p + 4])[0]
    chunks.append(raw[p + 4:p + 4 + n])
    p += 4 + n


def unpack(c):
    if c[:4] == b"\x28\xb5\x2f\xfd":
        return zstandard.ZstdDecompressor().decompressobj().decompress(c)
    return zlib.decompress(c, -15)


class R:
    def __init__(s, b): s.b, s.i = b, 0
    def byte(s): v = s.b[s.i]; s.i += 1; return v
    def vu(s):
        v = sh = 0
        while True:
            c = s.byte(); v |= (c & 127) << sh; sh += 7
            if c < 128: return v
    def vi(s): v = s.vu(); return (v >> 1) ^ -(v & 1)
    def string(s):
        e = s.b.index(0, s.i); v = s.b[s.i:e].decode("utf-8", "replace"); s.i = e + 1; return v
    def float(s):
        b0 = s.byte()
        if b0 == 0: return 0.0
        bits = b0 | (s.byte() << 8) | (s.byte() << 16) | (s.byte() << 24)
        bits = ((bits << 23) | (bits >> 9)) & 0xFFFFFFFF
        return struct.unpack("<f", struct.pack("<I", bits))[0]


# schema
r = R(unpack(chunks[0]))
defs = []
for _ in range(r.vu()):
    name, kind, fields = r.string(), r.byte(), []
    for _ in range(r.vu()):
        fields.append((r.string(), r.vi(), r.byte(), r.vu()))
    defs.append((name, kind, fields))
byname = {d[0]: d for d in defs}

BUILTIN = {-1: "bool", -2: "byte", -3: "int", -4: "uint", -5: "float", -6: "string", -7: "int64", -8: "uint64"}


def read_type(r, t, arr):
    if arr:
        n = r.vu()
        if t == -2: v = bytes(r.b[r.i:r.i + n]); r.i += n; return v
        return [read_type(r, t, 0) for _ in range(n)]
    if t < 0:
        k = BUILTIN[t]
        if k == "bool": return bool(r.byte())
        if k == "byte": return r.byte()
        if k in ("int", "int64"): return r.vi()
        if k in ("uint", "uint64"): return r.vu()
        if k == "float": return r.float()
        return r.string()
    name, kind, fields = defs[t]
    if kind == 0:  # enum
        v = r.vu()
        return next((f[0] for f in fields if f[3] == v), v)
    if kind == 1:  # struct
        return {f[0]: read_type(r, f[1], f[2]) for f in fields}
    out = {}  # message
    by = {f[3]: f for f in fields}
    while True:
        k = r.vu()
        if k == 0: return out
        f = by[k]
        out[f[0]] = read_type(r, f[1], f[2])


data = R(unpack(chunks[1]))
msg = read_type(data, defs.index(byname["Message"]), 0)
nodes = msg["nodeChanges"]
gid = lambda g: f'{g["sessionID"]}:{g["localID"]}'

rd = lambda v: round(v) if v == v and abs(v) != float("inf") else 0
tree = {}
for n in nodes:
    paints = []
    for f in n.get("fillPaints", []) or []:
        if f.get("type") == "IMAGE" and f.get("image"):
            paints.append(("img", f["image"].get("hash", b"").hex(), f["image"].get("name", "")))
        if f.get("type") == "VIDEO" and f.get("video"):
            paints.append(("vid", f["video"].get("hash", b"").hex(), f["video"].get("name", "")))
    pi = n.get("parentIndex")
    tree[gid(n["guid"])] = {
        "id": gid(n["guid"]), "type": n.get("type"), "name": n.get("name", ""),
        "parent": gid(pi["guid"]) if pi else None, "pos": pi.get("position", "") if pi else "",
        "size": [rd(n["size"]["x"]), rd(n["size"]["y"])] if n.get("size") else None,
        "xy": [rd(n["transform"]["m02"]), rd(n["transform"]["m12"])] if n.get("transform") else None,
        "paints": paints, "text": (n.get("textData") or {}).get("characters", "")[:120],
        "children": [],
    }
for v in tree.values():
    if v["parent"] in tree: tree[v["parent"]]["children"].append(v["id"])
for v in tree.values():
    v["children"].sort(key=lambda c: tree[c]["pos"])
json.dump(tree, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
print(len(nodes), "nodes")
