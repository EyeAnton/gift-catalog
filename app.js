(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const FADE_MS = 350;
  const STATIC_SHOW_MS = 2600;

  // Safari (and every iOS browser) plays VP9 but drops its alpha channel,
  // so WebKit gets HEVC-with-alpha .mov in the overlay (falling back to the
  // 320px animated WebP) and the animated WebP for card hover previews.
  const ua = navigator.userAgent;
  const isWebKit = /AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg)\//.test(ua);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");

  if (reducedMotion.matches) document.getElementById("shineAnim")?.remove();

  /* ---------------- Language (shared with the portfolio site via localStorage) ---------------- */

  // Russian is the source: it is written in index.html and read from the DOM once.
  // English lives here, keyed by data-i18n.
  const EN = {
    "nav.home": "Home", "nav.work": "Projects", "nav.contact": "Contact",
    "crumb": "← All projects",
    "hero.eyebrow": "Case study · Motion &amp; AI 3D",
    "hero.lead": "A collection of animated 3D gifts for a social app: from the idea and one shared style to a package developers ship with no manual work.",
    "hero.try": "Send a gift ↓", "hero.how": "How it was made",
    "meta.role": "Role", "meta.company": "Format", "meta.companyV": "In-house · NDA", "meta.when": "Period", "meta.whenV": "2025 — 2026", "meta.tools": "Tools",
    "stat.gifts": "gifts in one style", "stat.anim": "animations with alpha and sound", "stat.weight": "per full-screen animation",
    "show.eyebrow": "What the recipient sees",
    "show.title": "The whole screen belongs to the gift",
    "show.text": "A gift message lands in a dating chat, the conversation dims, and a transparent-background animation plays full screen on top. The same in the app and on the web.",
    "show.matches": "Matches", "show.prev1": "sent you a gift",
    "show.match": "You liked each other · today",
    "proc.eyebrow": "Process",
    "proc.title": "One gift, five steps",
    "proc.text": "Every gift takes the same path in Figma: source, brief, chroma-key drafts, key frames and the finished animation. Each step is a selection.",
    "proc.1t": "Source", "proc.1d": "A static 3D gift as the starting point",
    "proc.2t": "Idea", "proc.2d": "A short brief: what happens in the frame",
    "proc.3t": "Drafts", "proc.3d": "Frame variants on chroma key; the best go further",
    "proc.4t": "Key frames", "proc.4d": "Start, phases and end — the backbone for video generation",
    "proc.5t": "Result", "proc.5d": "Background cut to alpha, the animation gets its own sound",
    "task.eyebrow": "The task",
    "task.title": "A gift is an emotion that lands in a chat",
    "task.text": "A social app with a lot of content needs a steady flow of gifts: for holidays, weddings, confessions and just because. Every gift lives in three places at once.",
    "task.1t": "Tiny in the grid", "task.1d": "In the store a gift is a fingertip-sized icon. The silhouette has to read instantly, without a label.",
    "task.2t": "Big over the chat", "task.2d": "Once sent, it plays full screen over the conversation — with a transparent background and sound.",
    "task.3t": "Ready for developers", "task.3d": "Mobile apps, web and Figma get one package: files for every platform, no manual finishing.",
    "style.eyebrow": "Approach &amp; style",
    "style.title": "One style for the whole collection",
    "style.text": "A wedding cake, a yacht and a panda with a heart are made at different times with different tools, yet in a chat they have to look like one set. So rules come first, generation second.",
    "style.r1": "Soft volumetric 3D and warm light — a gift you want to hold",
    "style.r2": "A clean silhouette with no background: trimmed to the outline and centred",
    "style.r3": "A short animation with a start and an end — the gift arrives and leaves on its own",
    "style.r4": "Every animated gift has its own sound",
    "pipe.eyebrow": "Pipeline",
    "pipe.title": "From storyboard to a file in the app",
    "pipe.text": "A Node.js script ties generation, chroma key and export together, so a new gift goes all the way through, and hands-on work stays where it matters: style and animation.",
    "pipe.1t": "Idea &amp; storyboard", "pipe.1d": "Occasion, look, key frames",
    "pipe.2t": "Generation", "pipe.2d": "Gemini for prompts and frames, Kling API for video",
    "pipe.3t": "Review &amp; polish", "pipe.3d": "Blender, edit and fixes in After Effects",
    "pipe.4t": "Chroma key", "pipe.4d": "ffmpeg cuts the background into an alpha channel",
    "pipe.5t": "Export", "pipe.5d": "VP9 alpha · HEVC alpha · WebP · MP3",
    "pipe.6t": "Package", "pipe.6d": "JSON manifest + media for mobile, web and Figma",
    "cat.eyebrow": "Interactive catalog",
    "cat.title": "Send a gift",
    "cat.text": "Tap any of them — it arrives the way the recipient sees it in a chat. Animated gifts play with sound.",
    "tech.eyebrow": "Delivery",
    "tech.title": "A transparent background in any browser",
    "tech.text": "Every gift ships in several formats, and the browser picks the one it can show with an alpha channel.",
    "tech.1k": "Grid", "tech.1d": "A ~26 KB still plus the gift's SVG silhouette, which shimmers while the image loads.",
    "tech.2k": "Hover preview", "tech.2d": "~0.4 MB in Chrome and Firefox; Safari gets an animated WebP with alpha.",
    "tech.3k": "Full screen", "tech.3d": "~1 MB per animation + a ~190 KB MP3. Sound starts in sync with the first frame.",
    "tech.safari": "Safari plays VP9 but drops transparency — the gift arrives on a black square. So WebKit gets HEVC with alpha. ffmpeg writes a stream Safari can't decode, so the .mov files are built through AVFoundation with a small Swift tool.",
    "res.eyebrow": "Result",
    "res.title": "A collection ready to ship",
    "res.1t": "56 gifts", "res.1d": "holidays, weddings, romance and symbols — in one visual language",
    "res.2t": "A repeatable process", "res.2d": "a new gift goes through the same pipeline, from storyboard to finished files",
    "res.3t": "Zero manual packaging", "res.3d": "developers get a manifest and media for every platform",
    "res.4t": "Works everywhere", "res.4d": "transparent animation with sound in Chrome, Firefox, Safari and on iPhone",
    "next.eyebrow": "Next project",
    "next.text": "A Telegram bot that turns photos into stickers and stylised portraits through AI pipelines.",
    "next.all": "All projects →", "next.contact": "Contact &amp; CV",
    "foot.note": "Built without frameworks · works on any device",
    "foot.ds": "Design system",
  };
  const NAV_LABEL = { ru: "Разделы", en: "Sections" };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const $i18n = [...document.querySelectorAll("[data-i18n]")];
  const RU = Object.fromEntries($i18n.map((n) => [n.dataset.i18n, n.innerHTML]));
  let lang = store.get("lang") || ((navigator.language || "ru").toLowerCase().startsWith("ru") ? "ru" : "en");
  const $lang = document.getElementById("lang");
  const langHooks = []; // parts built in JS re-render themselves on a language switch
  function applyLang() {
    const dict = lang === "ru" ? RU : EN;
    document.documentElement.lang = lang;
    for (const n of $i18n) n.innerHTML = dict[n.dataset.i18n] ?? RU[n.dataset.i18n];
    document.querySelector(".tabs")?.setAttribute("aria-label", NAV_LABEL[lang]);
    $lang.textContent = lang === "ru" ? "EN" : "RU";
    langHooks.forEach((f) => f());
  }
  $lang.addEventListener("click", () => {
    lang = lang === "ru" ? "en" : "ru";
    store.set("lang", lang);
    applyLang();
  });
  applyLang();
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------- Reveal on scroll (same behaviour as the portfolio) ---------------- */

  document.documentElement.classList.add("js");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((n) => io.observe(n));
  } else {
    document.querySelectorAll(".reveal").forEach((n) => n.classList.add("in"));
  }

  const $catalog = document.getElementById("gcCatalog");
  const $overlay = document.getElementById("overlay");
  const $stage = document.getElementById("stage");
  const $spinner = document.getElementById("spinner");
  const $caption = document.getElementById("caption");
  const $sentName = document.getElementById("sentName");
  const $closeBtn = document.getElementById("closeBtn");

  Promise.all([
    fetch("gifts.json?v=3").then((r) => r.json()),
    fetch("silhouettes.json?v=3").then((r) => r.json()),
    fetch("showcase.json?v=2").then((r) => r.json()).catch(() => ({})),
    fetch("process.json?v=1").then((r) => r.json()).catch(() => ({ items: [] })),
  ])
    .then(([gifts, silhouettes, showcase, process]) => render(gifts.items, silhouettes, showcase, process))
    .catch((err) => {
      $catalog.textContent = "Could not load the catalog.";
      console.error(err);
    });

  /* ---------------- Grid ---------------- */

  function render(items, silhouettes, showcase, process) {
    // One catalog, one grid, in gifts.json order (groups are mixed there on purpose).
    const grid = el("div", "gc-grid");
    for (const gift of items) grid.append(card(gift, silhouettes[gift.key]));
    $catalog.replaceChildren(grid);
    $catalog.removeAttribute("aria-busy");
    setupShowcase(items, showcase);
    setupProcess(items, process.items || []);
  }

  /* ---------------- Process: one gift, five steps (working frames from Figma, process.json) ---------------- */

  const PROC_UI = {
    ru: { picked: "в работу", note: "Бриф из рабочего файла Figma", send: "Отправить в чат ↗" },
    en: { picked: "picked", note: "Brief from the working Figma file (translated)", send: "Send in a chat ↗" },
  };

  function setupProcess(items, list) {
    const $tabs = document.getElementById("gcProcTabs");
    const $proc = $tabs?.closest(".gc-proc");
    const steps = [1, 2, 3, 4, 5].map((i) => document.getElementById(`gcPs${i}`));
    const entries = list.map((p) => ({ ...p, gift: items.find((g) => g.key === p.key) })).filter((p) => p.gift);
    if (!$proc || !entries.length) { $proc?.closest("section")?.remove(); return; }
    let current = 0;

    const tabs = entries.map((p, i) => {
      const b = el("button", "chip");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.textContent = p.gift.name;
      b.addEventListener("click", () => {
        if (i === current) return;
        current = i;
        $proc.classList.add("switching");
        setTimeout(show, 250);
      });
      return b;
    });
    $tabs.replaceChildren(...tabs);

    const img = (src, cls) => {
      const n = el("img", cls);
      n.src = src; n.alt = ""; n.loading = "lazy"; n.decoding = "async";
      return n;
    };

    function show() {
      const p = entries[current];
      const base = `assets/process/${p.key}/`;
      const t = PROC_UI[lang];
      tabs.forEach((b, i) => b.setAttribute("aria-selected", String(i === current)));

      steps[0].replaceChildren(img(base + "source.webp", "gc-tile big"));

      const brief = el("blockquote", "gc-brief");
      brief.textContent = `«${p.idea[lang] || p.idea.ru}»`;
      const note = el("p", "gc-brief-note");
      note.textContent = t.note;
      steps[1].replaceChildren(brief, note);

      const drafts = el("div", "gc-strip");
      for (const d of p.drafts) {
        const w = el("div", "gc-draft" + (d.picked ? " picked" : ""));
        if (d.picked) w.dataset.label = t.picked;
        w.append(img(base + d.src, "gc-tile"));
        drafts.append(w);
      }
      steps[2].replaceChildren(drafts);

      const frames = el("div", "gc-strip gc-frames");
      p.frames.forEach((f, i) => {
        if (i) { const a = el("span", "gc-arrow"); a.textContent = "→"; frames.append(a); }
        frames.append(img(base + f, "gc-tile"));
      });
      steps[3].replaceChildren(frames);

      const stage = el("div", "gc-result-stage");
      if (isWebKit || reducedMotion.matches) {
        stage.append(img(reducedMotion.matches ? p.gift.still : p.gift.preview_webp_safari));
      } else {
        const v = el("video");
        Object.assign(v, { muted: true, loop: true, playsInline: true, autoplay: true, preload: "metadata" });
        v.src = p.gift.preview_webm;
        stage.append(v);
      }
      const send = el("button", "btn ghost small");
      send.type = "button";
      send.textContent = t.send;
      send.addEventListener("click", () => openOverlay(p.gift, send));
      const result = el("div", "gc-result");
      result.append(stage, send);
      steps[4].replaceChildren(result);

      $proc.classList.remove("switching");
    }

    show();
    langHooks.push(show);
  }

  /* ---------------- Showcase: laptop + phone, the gift arriving over a dating chat ---------------- */

  // Which gifts play here and how they fit the screen live in showcase.json.
  // Open the page with ?pick to choose them visually (the choice is kept in this browser
  // and can be copied or downloaded as a new showcase.json).
  const PICK_MODE = new URLSearchParams(location.search).has("pick");
  const PICK_KEY = "gcShowcasePick";
  // Gifts listed in showcase.json "hires" also have 1080px files (tools/encode_showcase.sh).
  let hires = new Set();
  const srcFor = (g) => hires.has(g.key)
    ? `assets/anim1080/${g.key}.${isWebKit ? "mov" : "webm"}`
    : (isWebKit && g.full_mov_safari ? g.full_mov_safari : g.full_webm);

  function setupShowcase(items, config) {
    const $devices = document.getElementById("gcDevices");
    const $pick = document.getElementById("gcPick");
    if (!$devices) return;
    const animated = items.filter((g) => g.full_webm);
    const byKey = new Map(animated.map((g) => [g.key, g]));
    const videos = [...$devices.querySelectorAll(".gc-fx-v")];
    const names = [...$devices.querySelectorAll(".gc-gift-name")];
    let gifts = [], chips = [], index = 0, run = 0, visible = false, timers = [];

    hires = new Set(config.hires || []);
    let state = { gifts: config.gifts || [], fit: config.fit || "mixed" };
    if (PICK_MODE) {
      try { state = { ...state, ...JSON.parse(store.get(PICK_KEY)) }; } catch {}
    }

    function apply(save) {
      if (save) store.set(PICK_KEY, JSON.stringify(state));
      $devices.dataset.fit = state.fit;
      gifts = state.gifts.map((k) => byKey.get(k)).filter(Boolean);
      if (!gifts.length) gifts = animated.slice(0, 6);
      chips = gifts.map((g, i) => {
        const b = el("button", "chip");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.textContent = g.name;
        b.addEventListener("click", () => { index = i; start(); });
        return b;
      });
      $pick.replaceChildren(...chips);
      index = Math.min(index, gifts.length - 1);
    }

    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const wait = (ms) => new Promise((res) => later(res, ms));
    function reset() {
      timers.forEach(clearTimeout);
      timers = [];
      $devices.classList.remove("playing", "arrived");
      for (const v of videos) { v.classList.remove("on"); v.pause(); }
    }

    function start() {
      const id = ++run;
      reset();
      const gift = gifts[index];
      chips.forEach((c, i) => c.setAttribute("aria-selected", String(i === index)));
      names.forEach((n) => { n.textContent = gift.name; });

      if (reducedMotion.matches) { // a still instead of motion
        $devices.classList.add("arrived", "playing");
        for (const v of videos) { v.poster = gift.still; v.classList.add("on"); }
        return;
      }

      // Buffer both screens fully before anything moves, so playback never stutters.
      const ready = Promise.all(videos.map((v) => new Promise((res) => {
        v.addEventListener("canplaythrough", res, { once: true });
        v.addEventListener("error", res, { once: true });
        v.src = srcFor(gift);
        v.load();
      })));

      // chat first, then the gift message, then the screen goes to the gift
      later(() => $devices.classList.add("arrived"), 700);
      Promise.all([Promise.race([ready, wait(8000)]), wait(1400)]).then(() => {
        if (id !== run) return;
        $devices.classList.add("playing");
        Promise.all(videos.map((v) => { v.currentTime = 0; return v.play().catch(() => {}); })).then(() => {
          if (id === run) videos.forEach((v) => v.classList.add("on"));
        });
        const upcoming = gifts[(index + 1) % gifts.length];
        if (upcoming !== gift) fetch(srcFor(upcoming)).catch(() => {}); // warm the cache

        let done = false;
        const next = () => {
          if (id !== run || done) return;
          done = true;
          videos.forEach((x) => x.classList.remove("on"));
          later(() => $devices.classList.remove("playing"), 300);
          later(() => {
            if (id !== run) return;
            index = (index + 1) % gifts.length;
            if (visible) start(); else reset();
          }, 1800);
        };
        videos[1].onended = next; // the phone leads; the laptop plays the same file
        videos[1].onerror = next;
        later(next, ((videos[1].duration || 8) + 3) * 1000); // never get stuck
      });
    }

    apply(false);
    if (PICK_MODE) buildPicker();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !$devices.classList.contains("arrived")) start();
        if (!visible) { run++; reset(); }
      }, { threshold: 0.35 }).observe($devices);
    } else {
      visible = true;
      start();
    }

    /* ---- ?pick: choose and order the showcase gifts ---- */
    function buildPicker() {
      const box = el("div", "gc-picker surface");
      box.innerHTML = `
        <div class="gc-picker-head">
          <div>
            <p class="eyebrow">Выбор подарков · только для вас</p>
            <p class="gc-picker-hint">Нажимайте подарки в том порядке, в каком они должны идти. Повторное нажатие убирает. Выбор сразу играет в мокапах и сохраняется в этом браузере.</p>
          </div>
          <div class="gc-picker-tools">
            <span class="gc-picker-fit">
              <button class="chip" type="button" data-fit="mixed">Телефон по длинной, ноутбук целиком</button>
              <button class="chip" type="button" data-fit="cover">Везде по длинной</button>
              <button class="chip" type="button" data-fit="contain">Везде целиком</button>
            </span>
            <button class="btn ghost small" type="button" data-act="reset">Как в showcase.json</button>
            <button class="btn ghost small" type="button" data-act="copy">Скопировать JSON</button>
            <button class="btn small" type="button" data-act="download">Скачать showcase.json</button>
          </div>
        </div>
        <div class="gc-picker-grid"></div>`;
      $pick.after(box);
      const grid = box.querySelector(".gc-picker-grid");
      const items = animated.map((g) => {
        const b = el("button", "gc-pk");
        b.type = "button";
        b.dataset.key = g.key;
        b.innerHTML = `<img src="${g.still}" alt="" loading="lazy"><span>${g.name}</span><i></i>`;
        b.addEventListener("click", () => {
          const at = state.gifts.indexOf(g.key);
          if (at >= 0) state.gifts.splice(at, 1);
          else state.gifts.push(g.key);
          const keep = gifts[index];
          apply(true);
          sync();
          if (at < 0) index = gifts.indexOf(g); // play the one just added
          else index = Math.max(0, gifts.indexOf(keep));
          if (visible || at < 0) start();
        });
        grid.append(b);
        return b;
      });
      box.querySelectorAll("[data-fit]").forEach((b) => b.addEventListener("click", () => {
        state.fit = b.dataset.fit;
        apply(true);
        sync();
      }));
      const json = () => JSON.stringify({ gifts: gifts.map((g) => g.key), fit: state.fit, hires: [...hires] }, null, 1) + "\n";
      box.querySelector("[data-act=reset]").addEventListener("click", () => {
        state = { gifts: [...(config.gifts || [])], fit: config.fit || "mixed" };
        store.set(PICK_KEY, "");
        apply(false);
        sync();
        start();
      });
      box.querySelector("[data-act=copy]").addEventListener("click", (e) => {
        navigator.clipboard?.writeText(json()).then(() => { e.target.textContent = "Скопировано ✓"; });
      });
      box.querySelector("[data-act=download]").addEventListener("click", () => {
        const a = el("a");
        a.href = URL.createObjectURL(new Blob([json()], { type: "application/json" }));
        a.download = "showcase.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      function sync() {
        items.forEach((b) => {
          const n = state.gifts.indexOf(b.dataset.key);
          b.classList.toggle("on", n >= 0);
          b.querySelector("i").textContent = n >= 0 ? n + 1 : "";
        });
        box.querySelectorAll("[data-fit]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.fit === state.fit)));
      }
      sync();
    }
  }

  function card(gift, sil) {
    const btn = el("button", "gc-card");
    btn.type = "button";
    btn.setAttribute("aria-label", gift.full_webm ? `${gift.name} — play animation` : gift.name);

    const media = el("div", "media");
    if (sil) media.append(skeleton(sil));

    const img = el("img", "still");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = gift.still;
    const done = () => media.classList.add("loaded");
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener("load", done, { once: true });
    media.append(img);

    const name = el("span", "gc-name");
    name.textContent = gift.name;
    btn.append(media, name);

    if (gift.preview_webm) attachHoverPreview(btn, media, gift);
    btn.addEventListener("click", () => openOverlay(gift, btn));
    return btn;
  }

  function skeleton({ w, h, d }) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "sk");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "url(#shine)");
    path.setAttribute("fill-rule", "evenodd");
    svg.append(path);
    return svg;
  }

  function attachHoverPreview(btn, media, gift) {
    let preview = null;
    btn.addEventListener("mouseenter", () => {
      if (!canHover.matches || reducedMotion.matches || preview) return;
      if (isWebKit) {
        preview = el("img", "preview");
        preview.alt = "";
        preview.addEventListener("load", () => show(preview), { once: true });
        preview.src = gift.preview_webp_safari;
      } else {
        preview = el("video", "preview");
        Object.assign(preview, { muted: true, loop: true, playsInline: true, autoplay: true });
        preview.addEventListener("playing", () => show(preview), { once: true });
        preview.src = gift.preview_webm;
      }
      media.append(preview);
    });
    btn.addEventListener("mouseleave", () => {
      if (!preview) return;
      if (preview.pause) preview.pause();
      preview.remove();
      preview = null;
      media.classList.remove("previewing");
    });
    function show(node) {
      if (node !== preview) return;
      node.classList.add("on");
      media.classList.add("previewing");
    }
  }

  /* ---------------- Overlay ---------------- */

  let session = 0; // bumps on every open/close so stale callbacks do nothing
  let current = null; // { audio, timer, returnFocus }

  function openOverlay(gift, returnFocus) {
    const id = ++session;
    cleanupMedia();
    current = { audio: null, timer: 0, returnFocus };

    $caption.textContent = gift.name;
    $sentName.textContent = gift.name;
    $stage.replaceChildren($spinner);
    $overlay.hidden = false;
    document.body.classList.add("locked");
    requestAnimationFrame(() => $overlay.classList.add("open"));
    $closeBtn.focus({ preventScroll: true });

    if (!gift.full_webm) return playStatic(gift, id);

    $spinner.hidden = false;

    // Start the sound inside the click so browsers allow it; keep it muted
    // until the animation is ready, then rewind and unmute in sync.
    const audio = new Audio(gift.sound);
    audio.preload = "auto";
    audio.muted = true;
    audio.play().catch(() => {});
    current.audio = audio;

    const startAudio = () => {
      if (id !== session) return;
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 1;
      audio.play().catch(() => {});
    };

    if (!isWebKit) playVideo(gift.full_webm, id, startAudio, () => playStatic(gift, id));
    else if (gift.full_mov_safari) playVideo(gift.full_mov_safari, id, startAudio, () => playWebP(gift, id, startAudio));
    else playWebP(gift, id, startAudio);
  }

  function playVideo(src, id, startAudio, onFail) {
    const video = el("video");
    Object.assign(video, { muted: true, playsInline: true, preload: "auto" });
    video.setAttribute("playsinline", "");
    // Muted playback may always start on its own; the browser begins once
    // enough is buffered. (A paused hidden video would never buffer in Chrome.)
    video.addEventListener("playing", () => {
      if (id !== session) return;
      $spinner.hidden = true;
      video.classList.add("on");
      startAudio();
    }, { once: true });
    video.addEventListener("ended", () => id === session && closeOverlay());
    let failed = false;
    const fail = () => {
      if (failed || id !== session) return;
      failed = true;
      video.remove();
      onFail();
    };
    video.addEventListener("error", fail, { once: true });
    video.src = src;
    $stage.append(video);
    video.play().catch((err) => {
      if (err.name !== "AbortError") fail();
    });
  }

  function playWebP(gift, id, startAudio) {
    fetch(gift.preview_webp_safari)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.arrayBuffer();
      })
      .then((buf) => {
        if (id !== session) return;
        const duration = webpDuration(buf);
        const img = el("img");
        img.alt = "";
        img.addEventListener("load", () => {
          if (id !== session) return;
          $spinner.hidden = true;
          img.classList.add("on");
          startAudio();
          // Animated WebP loops forever, so close after one cycle ourselves.
          const ms = duration || (current.audio.duration * 1000) || 4000;
          current.timer = setTimeout(() => id === session && closeOverlay(), ms);
        }, { once: true });
        img.src = URL.createObjectURL(new Blob([buf], { type: "image/webp" }));
        $stage.append(img);
      })
      .catch(() => playStatic(gift, id));
  }

  function playStatic(gift, id) {
    if (id !== session) return;
    if (current.audio) { current.audio.pause(); current.audio = null; }
    $stage.replaceChildren($spinner);
    $spinner.hidden = true;
    const img = el("img", "static");
    img.alt = "";
    img.addEventListener("load", () => {
      if (id !== session) return;
      requestAnimationFrame(() => img.classList.add("on"));
      current.timer = setTimeout(() => id === session && closeOverlay(), STATIC_SHOW_MS);
    }, { once: true });
    img.src = gift.still;
    $stage.append(img);
  }

  function closeOverlay() {
    if ($overlay.hidden || !current) return;
    const id = ++session;
    const { audio, returnFocus } = current;
    clearTimeout(current.timer);
    if (audio) fadeOut(audio);
    $overlay.classList.remove("open");
    setTimeout(() => {
      if (id !== session) return; // reopened meanwhile
      $overlay.hidden = true;
      $spinner.hidden = true;
      cleanupMedia();
      document.body.classList.remove("locked");
      returnFocus?.focus({ preventScroll: true });
      current = null;
    }, FADE_MS);
  }

  function cleanupMedia() {
    for (const node of $stage.children) {
      if (node.pause) { node.pause(); node.removeAttribute("src"); node.load(); }
      if (node.src?.startsWith("blob:")) URL.revokeObjectURL(node.src);
    }
    $stage.replaceChildren($spinner);
    if (current?.audio) current.audio.pause();
    if (current) clearTimeout(current.timer);
  }

  function fadeOut(audio) {
    const step = audio.volume / (FADE_MS / 30);
    const t = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - step);
      if (audio.volume <= 0) { clearInterval(t); audio.pause(); }
    }, 30);
  }

  // Sum of ANMF frame durations in an animated WebP, in ms (0 if not animated).
  function webpDuration(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 12 || v.getUint32(0) !== 0x52494646 || v.getUint32(8) !== 0x57454250) return 0;
    let total = 0;
    for (let p = 12; p + 8 <= v.byteLength;) {
      const fourcc = v.getUint32(p);
      const size = v.getUint32(p + 4, true);
      if (fourcc === 0x414e4d46 && p + 8 + 16 <= v.byteLength) { // "ANMF"
        const o = p + 8 + 12;
        total += v.getUint8(o) | (v.getUint8(o + 1) << 8) | (v.getUint8(o + 2) << 16);
      }
      p += 8 + size + (size & 1);
    }
    return total;
  }

  $overlay.addEventListener("click", closeOverlay);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlay();
  });

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }
})();
