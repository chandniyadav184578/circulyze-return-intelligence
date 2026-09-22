/* ==========================================================================
   Circulyze — Landing carousel (Home / How It Works / Decision Engine /
   Sustainability / Value Recovery / Impact / CTA). One autoplay timer,
   manual controls reset it, respects prefers-reduced-motion.
   ========================================================================== */
window.SR = window.SR || {};

SR.carousel = (function () {
  const DURATION = 10000;
  let slides, dots, track, progressBar, shell;
  let idx = 0, timer = null, paused = false, reduced = false;

  function render(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((el, n) => el.classList.toggle("active", n === idx));
    dots.forEach((b, n) => {
      b.classList.toggle("active", n === idx);
      b.setAttribute("aria-selected", n === idx ? "true" : "false");
    });
  }

  function runProgress() {
    if (reduced) return;
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    // force reflow so the width reset is applied before animating
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${DURATION}ms linear`;
    progressBar.style.width = "100%";
  }

  function restart() {
    clearTimeout(timer);
    if (paused) return;
    runProgress();
    timer = setTimeout(() => goTo(idx + 1), DURATION);
  }

  function goTo(i) {
    render(i);
    restart();
  }

  function pause() {
    if (paused) return;
    paused = true;
    clearTimeout(timer);
    const w = getComputedStyle(progressBar).width;
    progressBar.style.transition = "none";
    progressBar.style.width = w;
  }

  function resume() {
    if (!paused) return;
    paused = false;
    restart();
  }

  function init() {
    shell = document.getElementById("carousel-shell");
    track = document.getElementById("carousel-track");
    progressBar = document.getElementById("c-progress-bar");
    if (!shell || !track) return;
    slides = Array.from(track.querySelectorAll(".c-slide"));
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dotsWrap = document.getElementById("c-indicators");
    dotsWrap.innerHTML = slides.map((s, n) =>
      `<button role="tab" aria-label="Go to ${s.dataset.label} slide" class="${n === 0 ? "active" : ""}"></button>`
    ).join("");
    dots = Array.from(dotsWrap.querySelectorAll("button"));
    dots.forEach((b, n) => b.addEventListener("click", () => goTo(n)));

    document.getElementById("c-prev").addEventListener("click", () => goTo(idx - 1));
    document.getElementById("c-next").addEventListener("click", () => goTo(idx + 1));

    shell.addEventListener("mouseenter", pause);
    shell.addEventListener("mouseleave", resume);
    shell.addEventListener("focusin", pause);
    shell.addEventListener("focusout", resume);

    render(0);
    restart();
  }

  return { init, goTo };
})();
