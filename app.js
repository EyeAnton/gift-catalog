(() => {
  "use strict";

  const GROUPS = [
    { id: "wedding", title: "Wedding" },
    { id: "catalog", title: "Catalog" },
    { id: "symbols", title: "Symbols" },
  ];
  const SVG_NS = "http://www.w3.org/2000/svg";
  const FADE_MS = 350;
  const STATIC_SHOW_MS = 2600;

  // Safari (and every iOS browser) plays VP9 but drops its alpha channel,
  // so WebKit gets the animated WebP versions instead.
  const ua = navigator.userAgent;
  const isWebKit = /AppleWebKit/.test(ua) && !/(Chrome|Chromium|Edg)\//.test(ua);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");

  if (reducedMotion.matches) document.getElementById("shineAnim")?.remove();

  const $catalog = document.getElementById("catalog");
  const $overlay = document.getElementById("overlay");
  const $stage = document.getElementById("stage");
  const $spinner = document.getElementById("spinner");
  const $caption = document.getElementById("caption");
  const $sentName = document.getElementById("sentName");
  const $closeBtn = document.getElementById("closeBtn");

  Promise.all([
    fetch("gifts.json").then((r) => r.json()),
    fetch("silhouettes.json").then((r) => r.json()),
  ])
    .then(([gifts, silhouettes]) => render(gifts.items, silhouettes))
    .catch((err) => {
      $catalog.textContent = "Could not load the catalog.";
      console.error(err);
    });

  /* ---------------- Grid ---------------- */

  function render(items, silhouettes) {
    const frag = document.createDocumentFragment();
    for (const group of GROUPS) {
      const gifts = items.filter((g) => g.group === group.id);
      if (!gifts.length) continue;

      const section = el("section", "group");
      const head = el("div", "group-head");
      const h2 = el("h2");
      h2.textContent = group.title;
      const count = el("span");
      count.textContent = `${gifts.length} gifts`;
      head.append(h2, count);

      const grid = el("div", "grid");
      for (const gift of gifts) grid.append(card(gift, silhouettes[gift.key]));
      section.append(head, grid);
      frag.append(section);
    }
    $catalog.replaceChildren(frag);
    $catalog.removeAttribute("aria-busy");
  }

  function card(gift, sil) {
    const btn = el("button", "card");
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

    const name = el("span", "name");
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

    if (isWebKit) playWebP(gift, id, startAudio);
    else playVideo(gift, id, startAudio);
  }

  function playVideo(gift, id, startAudio) {
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
    video.addEventListener("error", () => playStatic(gift, id), { once: true });
    video.src = gift.full_webm;
    $stage.append(video);
    video.play().catch((err) => {
      if (err.name !== "AbortError") playStatic(gift, id);
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
