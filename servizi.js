(function () {
  const section = document.getElementById("renixBuildHome");
  if (!section) return;

  const label = document.getElementById("renixBuildLabel");
  const stage = section.querySelector(".renix-house-stage");
  const chips = Array.from(section.querySelectorAll("[data-renix-chip]"));
  const groups = Array.from(section.querySelectorAll(".build-step"));

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const steps = groups.map((group) => {
    const drawElements = Array.from(group.querySelectorAll(".draw")).map((el) => {
      let length = 1000;

      if (typeof el.getTotalLength === "function") {
        length = el.getTotalLength();
      }

      el.style.strokeDasharray = length;
      el.style.strokeDashoffset = length;

      return { el, length };
    });

    const fadeElements = Array.from(group.querySelectorAll(".fade"));

    return {
      group,
      drawElements,
      fadeElements,
      start: parseFloat(group.dataset.start),
      end: parseFloat(group.dataset.end),
      chip: group.dataset.chip,
      label: group.dataset.label
    };
  });

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    const scrolled = clamp(-rect.top, 0, scrollable);

    return scrollable > 0 ? scrolled / scrollable : 0;
  }

  function drawStep(step, amount) {
    const cleanAmount = clamp(amount, 0, 1);

    step.group.style.opacity = cleanAmount > 0.01 ? 1 : 0;

    step.drawElements.forEach((item, index) => {
      const delay = index * 0.025;
      const local = clamp((cleanAmount - delay) / 0.78, 0, 1);

      item.el.style.strokeDashoffset = item.length * (1 - local);
    });

    step.fadeElements.forEach((el, index) => {
      const delay = 0.18 + index * 0.04;
      const local = clamp((cleanAmount - delay) / 0.45, 0, 1);

      el.style.opacity = local;
    });
  }

  function update() {
    const progress = getScrollProgress();

    let activeStep = steps[0];

    steps.forEach((step) => {
      const amount = clamp(
        (progress - step.start) / (step.end - step.start),
        0,
        1
      );

      drawStep(step, amount);

      if (progress >= step.start) {
        activeStep = step;
      }
    });

    if (label && activeStep) {
      label.textContent = activeStep.label;
    }

    chips.forEach((chip) => {
      chip.classList.toggle(
        "active",
        activeStep && chip.dataset.renixChip === activeStep.chip
      );
    });

    if (stage) {
      stage.style.transform = `scale(${1 + progress * 0.035}) translateY(${progress * -10}px)`;
    }
  }

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });

      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  update();
})();