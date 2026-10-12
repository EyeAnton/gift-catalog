# Process frames from the Figma working file

The "Процесс" section (`process.json`, `assets/process/<key>/`) is built from the exported
working file (`.fig`, not in the repo — it holds internal work, keep it out of git).
Pages `add animations_september*` have one row per gift: SOURCE → IDEA (brief) → DRAFTS → SELECTED → PREVIEW.

Needs Python 3 with `pillow` and `zstandard`.

```sh
# 1. unzip the .fig into an empty folder: canvas.fig + images/
python -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "Anton Egorov.fig" fig_x
# 2. decode the kiwi canvas into a node tree
python tools/figma/figtree.py fig_x/canvas.fig figtree.json
# 3. per-gift rows of a page (source hash, brief, drafts, selected)
python tools/figma/figextract.py figtree.json "add animations_september" proc1.json
python tools/figma/figextract.py figtree.json "add animations_september_2" proc2.json
# 4. numbered sheet of candidates (S = selected row, S0 = source; D = drafts) to pick frames by eye
python tools/figma/candsheet.py .
# 5. edit PICK in curate.py, then write assets/process/* and process.json
python tools/figma/curate.py . <repo>
```

Layer names on the September pages 2–3 were copied around and don't match the gift —
identify rows by the brief text (`needle` in `PICK`), not by name. RU briefs are tidied by hand
in `process.json` after step 5 (the Figma text is a rough working note).
