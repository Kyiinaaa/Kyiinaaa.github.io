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
