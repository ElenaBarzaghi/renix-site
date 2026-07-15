/* =============================================================
   Renix — Sezione video scroll-driven "impianto per impianto"
   Un unico video il cui playback è pilotato dallo scroll (GSAP
   ScrollTrigger). NIENTE autoplay, niente testo, niente controlli.

   Metodo:
     - contenitore esterno alto (600vh), interno sticky 100vh;
     - su 'loadedmetadata' si legge video.duration;
     - ScrollTrigger (scrub) → progress; una MAPPATURA A CAPITOLI
       (chapters + interpolateChapterTime) converte progress → targetTime
       in modo NON lineare: apertura rapida, impianti distribuiti, finale corto;
     - un loop requestAnimationFrame applica video.currentTime = targetTime
       SOLO se lo scarto supera ~1 frame e non è già in 'seeking'
       (niente seek ridondanti → fluido, senza flicker).
     0% scroll = 0s · 100% scroll = fine utile del video.
   ============================================================= */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const section = document.getElementById("renixVideo");
const video = document.getElementById("renixVideoEl");
const loader = section ? section.querySelector(".renixvid__loader") : null;

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 820px)").matches;

let duration = 0;
let targetTime = 0;
let running = false;
let rafId = 0;
let st = null;

// Scarto minimo per aggiornare currentTime (~1 frame). Più largo su mobile.
const SEEK_EPS = isMobile ? 1 / 24 : 1 / 60;

/* ---------- Mappatura a capitoli: scroll (progress) → tempo video (s) ----------
   Progressione NON lineare, ritmata "a capitoli". Ogni riga = un momento
   chiave del video ancorato a una posizione di scroll.
   `progress`: 0..1 (posizione nello scroll della sezione)
   `time`    : secondi nel video (durata reale ~18.8s)
   >>> PER REGOLARE IL RITMO, MODIFICA SOLO QUESTI VALORI <<<
   - avvicina due 'progress' → quella fase dura meno scroll;
   - riduci il salto di 'time' in un tratto → il video lì scorre più lento
     (l'impianto "resta" di più, momento più chiaro). */
const chapters = [
  { progress: 0.00, time: 0.0 },   // casa chiusa iniziale
  { progress: 0.08, time: 3.2 },   // casa aperta / cutaway (apertura RAPIDA)
  { progress: 0.22, time: 6.5 },   // impianto elettrico
  { progress: 0.36, time: 8.2 },   // impianto idraulico
  { progress: 0.50, time: 9.6 },   // fotovoltaico (pannelli sul tetto)
  { progress: 0.64, time: 12.0 },  // inverter / batteria / sistemi tecnici
  { progress: 0.80, time: 15.0 },  // pompa di calore / climatizzazione
  { progress: 0.92, time: 16.7 },  // chiusura verso casa finale
  { progress: 1.00, time: 18.4 },  // casa finale illuminata (coda tagliata)
];

// Trova i due capitoli che racchiudono `progress` e interpola linearmente il tempo.
function interpolateChapterTime(progress) {
  const p = Math.max(0, Math.min(1, progress));
  for (let i = 0; i < chapters.length - 1; i++) {
    const a = chapters[i], b = chapters[i + 1];
    if (p <= b.progress) {
      const span = b.progress - a.progress;
      const local = span > 0 ? (p - a.progress) / span : 0;
      return a.time + local * (b.time - a.time);
    }
  }
  return chapters[chapters.length - 1].time;
}

/* ---------- Loop di seek ottimizzato ---------- */
function seekLoop() {
  if (!running) return;
  if (duration && !video.seeking) {
    const t = Math.min(duration - 0.05, Math.max(0, targetTime));
    if (Math.abs(video.currentTime - t) > SEEK_EPS) {
      try { video.currentTime = t; } catch (e) { /* seek non pronto */ }
    }
  }
  rafId = requestAnimationFrame(seekLoop);
}
function startLoop() { if (!running) { running = true; rafId = requestAnimationFrame(seekLoop); } }
function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

/* ---------- ScrollTrigger ---------- */
function setupScroll() {
  gsap.registerPlugin(ScrollTrigger);
  st = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.5,
    onUpdate: (self) => { targetTime = interpolateChapterTime(self.progress); },
    onToggle: (self) => {
      if (self.isActive) startLoop();
      else { stopLoop(); targetTime = interpolateChapterTime(self.progress); seekOnce(); }
    },
  });
  // Primo frame allineato allo stato iniziale
  targetTime = 0;
  seekOnce();

  // Difesa: ricalcola le distanze quando layout/viewport sono certi
  // (evita sezione collassata se i vh non sono ancora risolti al setup).
  if (document.readyState === "complete") requestAnimationFrame(() => ScrollTrigger.refresh());
  else window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

function seekOnce() {
  if (!duration || video.seeking) return;
  const t = Math.min(duration - 0.05, Math.max(0, targetTime));
  try { video.currentTime = t; } catch (e) {}
}

/* ---------- Fallback: prefers-reduced-motion ---------- */
function reducedFallback() {
  section.classList.add("is-reduced");
  section.style.height = "";
  try { video.currentTime = 0; } catch (e) {} // primo frame statico
}

/* ---------- Loader / errori ---------- */
function hideLoader() { if (loader) loader.classList.add("is-hidden"); }
function showMissing() { section.classList.add("is-missing"); }

/* ---------- Init ---------- */
function init() {
  video.pause();

  const onMeta = () => {
    duration = video.duration || 0;
    if (!duration || !isFinite(duration)) { showMissing(); return; }
    if (prefersReduced || !gsap || !ScrollTrigger) reducedFallback();
    else setupScroll();
  };

  if (video.readyState >= 1) onMeta();
  else video.addEventListener("loadedmetadata", onMeta, { once: true });

  // Nasconde il loader appena c'è abbastanza da mostrare il primo frame
  video.addEventListener("loadeddata", hideLoader, { once: true });
  video.addEventListener("canplay", hideLoader, { once: true });
  video.addEventListener("error", () => { hideLoader(); showMissing(); }, { once: true });

  // Resize: ricalcola le distanze di pin
  window.addEventListener("resize", () => { if (ScrollTrigger) ScrollTrigger.refresh(); }, { passive: true });

  video.load();
}

if (section && video) init();
