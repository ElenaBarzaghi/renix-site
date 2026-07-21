// =======================
// HEADER: compatto / nascosto allo scroll
// =======================

const header = document.querySelector(".site-header");

let lastScrollY = window.scrollY;

if (header) {
  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    // Dopo un po' di scroll diventa compatto
    if (currentScrollY > 80) {
      header.classList.add("header-compact");
    } else {
      header.classList.remove("header-compact");
    }

    // Scendendo sparisce, risalendo ricompare
    if (currentScrollY > lastScrollY && currentScrollY > 180) {
      header.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
  });
}


// =======================
// BOTTONE HERO: animazione click + redirect
// =======================

const heroCta = document.querySelector(".hero-cta");

if (heroCta) {
  heroCta.addEventListener("click", (event) => {
    event.preventDefault();

    const href = heroCta.getAttribute("href");

    // Riavvia l'animazione anche se clicchi più volte
    heroCta.classList.remove("is-clicking");
    void heroCta.offsetWidth;
    heroCta.classList.add("is-clicking");

    // Dopo l'animazione vai alla pagina contatti
    setTimeout(() => {
      window.location.href = href;
    }, 780);
  });
}

// =======================
// SLIDER LAVORI MIGLIORI
// =======================

const worksSlider = document.querySelector("[data-slider]");

if (worksSlider) {
  const slides = [...worksSlider.querySelectorAll(".works-slide")];
  const dots = [...worksSlider.querySelectorAll("[data-slider-dots] button")];

  let currentSlide = 0;

  const showSlide = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
    });

    currentSlide = index;
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
    });
  });

  setInterval(() => {
    const nextSlide = (currentSlide + 1) % slides.length;
    showSlide(nextSlide);
  }, 4200);
}

// =======================
// PAGE LOADER RENIX
// =======================

window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.add("is-loaded");
  }, 2300);
});

window.addEventListener("pageshow", () => {
  document.body.classList.add("is-loaded");
});

document.querySelectorAll("a[href]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    const isExternal = link.target === "_blank";
    const isAnchor = href.startsWith("#");
    const isMail = href.startsWith("mailto:");
    const isTel = href.startsWith("tel:");

    if (isExternal || isAnchor || isMail || isTel) return;

    event.preventDefault();

    document.body.classList.remove("is-loaded");

    setTimeout(() => {
      window.location.href = href;
    }, 1600);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (!menuToggle || !mainNav) return;

  const closeMenu = () => {
    menuToggle.classList.remove("is-open");
    mainNav.classList.remove("is-open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Apri il menu");
  };

  menuToggle.addEventListener("click", () => {
    const menuIsOpen = mainNav.classList.toggle("is-open");

    menuToggle.classList.toggle("is-open", menuIsOpen);
    menuToggle.setAttribute("aria-expanded", String(menuIsOpen));
    menuToggle.setAttribute(
      "aria-label",
      menuIsOpen ? "Chiudi il menu" : "Apri il menu"
    );
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = mainNav.contains(event.target);
    const clickedButton = menuToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMenu();
    }
  });
});