(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Theme toggle (remembers choice; falls back to system setting)
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const stored = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  if (stored) root.dataset.theme = stored;

  const syncResolved = () => {
    root.dataset.themeResolved = root.dataset.theme || (media.matches ? "dark" : "light");
  };
  syncResolved();
  media.addEventListener("change", syncResolved);

  document.querySelector(".theme").addEventListener("click", () => {
    const next = root.dataset.themeResolved === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    syncResolved();
  });

  // Mobile menu
  const toggle = document.querySelector(".nav__toggle");
  const links = document.getElementById("nav-links");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("open", open);
  };
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  // Highlight the nav link for the section in view
  const navLinks = [...links.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

  // Reveal on scroll
  const revealTargets = document.querySelectorAll(".section__head, .job, .case, .mini, .skill, .edu > *, .stats__grid li");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => { el.classList.add("reveal"); revealObserver.observe(el); });
  }

  // Terminal: replay the test run line by line
  const term = document.querySelector("#terminal code");
  if (term && !reduceMotion) {
    const lines = term.innerHTML.split("\n");
    term.innerHTML = "";
    let i = 0;
    const cursor = '<span class="cursor"></span>';
    const step = () => {
      const shown = lines.slice(0, i + 1).join("\n");
      term.innerHTML = shown + (i < lines.length - 1 ? cursor : "");
      i++;
      if (i < lines.length) {
        const delay = i === 1 ? 700 : lines[i - 1].trim() === "" ? 250 : 320;
        setTimeout(step, delay);
      }
    };
    setTimeout(step, 400);
  }


  // Case study detail sheets
  const openSheet = (dlg) => {
    if (!dlg || dlg.open) return;
    dlg.classList.remove("closing");
    dlg.showModal();
    document.body.classList.add("sheet-open");
    const inner = dlg.querySelector(".sheet__inner");
    if (inner) inner.scrollTop = 0;
  };
  const closeSheet = (dlg) => {
    if (!dlg.open || dlg.classList.contains("closing")) return;
    if (reduceMotion) { dlg.close(); return; }
    dlg.classList.add("closing");
    dlg.addEventListener("animationend", () => { dlg.classList.remove("closing"); dlg.close(); }, { once: true });
  };
  document.querySelectorAll("[data-open]").forEach((card) => {
    const dlg = document.getElementById(card.dataset.open);
    card.addEventListener("click", () => openSheet(dlg));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(dlg); }
    });
  });
  document.querySelectorAll("dialog.sheet").forEach((dlg) => {
    dlg.addEventListener("close", () => document.body.classList.remove("sheet-open"));
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeSheet(dlg); });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) closeSheet(dlg);
    });

    // Tabs
    const tablist = dlg.querySelector(".tabs");
    if (tablist) {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')];
      const select = (idx, focus) => {
        const prev = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
        if (idx === prev) return;
        tablist.dataset.active = idx;
        tabs.forEach((t, k) => {
          const on = k === idx;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute("aria-controls"));
          panel.hidden = !on;
          if (on) {
            panel.style.setProperty("--dx", idx > prev ? "28px" : "-28px");
            panel.classList.remove("enter"); void panel.offsetWidth; panel.classList.add("enter");
          }
        });
        if (focus) tabs[idx].focus();
        dlg.querySelector(".sheet__inner").scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      };
      tabs.forEach((t, k) => t.addEventListener("click", () => select(k)));
      tablist.addEventListener("keydown", (e) => {
        const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
        if (e.key === "ArrowRight") select((cur + 1) % tabs.length, true);
        if (e.key === "ArrowLeft") select((cur - 1 + tabs.length) % tabs.length, true);
      });
    }

    // Gallery
    const gal = dlg.querySelector("[data-gallery]");
    if (gal) {
      const slides = [...gal.querySelectorAll(".gal__slide")];
      const thumbs = [...gal.querySelectorAll(".gal__thumb")];
      const count = gal.querySelector(".gal__count");
      let cur = 0;
      const show = (idx) => {
        idx = (idx + slides.length) % slides.length;
        if (idx === cur && !slides[idx].hidden) return;
        const dir = idx > cur ? 1 : -1;
        slides.forEach((s, k) => { s.hidden = k !== idx; });
        const s = slides[idx];
        s.style.setProperty("--dx", `${dir * 30}px`);
        s.classList.remove("enter"); void s.offsetWidth; s.classList.add("enter");
        thumbs.forEach((t, k) => t.classList.toggle("active", k === idx));
        const strip = thumbs[idx]?.parentElement;
        if (strip && strip.scrollWidth > strip.clientWidth) {
          const t = thumbs[idx];
          strip.scrollTo({ left: t.offsetLeft - strip.offsetLeft - (strip.clientWidth - t.clientWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
        }
        count.textContent = `${idx + 1} / ${slides.length}`;
        cur = idx;
      };
      thumbs[0]?.classList.add("active");
      thumbs.forEach((t, k) => t.addEventListener("click", () => show(k)));
      gal.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => show(cur + Number(b.dataset.step))));
      dlg.addEventListener("keydown", (e) => {
        if (e.target.closest(".tabs")) return;
        if (e.key === "ArrowRight") show(cur + 1);
        if (e.key === "ArrowLeft") show(cur - 1);
      });
    }
  });

  // Copy email
  document.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "Copied ✓";
        btn.classList.add("done");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1800);
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
