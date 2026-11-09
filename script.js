const slides = document.getElementById("slides");
const scenes = [...document.querySelectorAll(".scene")];
const backButton = document.getElementById("backButton");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const announcer = document.getElementById("announcer");
const noButton = document.getElementById("noButton");
const yesButton = document.getElementById("yesButton");
const noMessage = document.getElementById("noMessage");
const restartButton = document.getElementById("restartButton");

const noMessages = [
  "Ese botón es un poco tímido...",
  "¿Segura? Piénsalo otra vez 😌",
  "Uy, casi...",
  "Creo que el «sí» te queda mejor 💗",
  "El universo está intentando decirte algo...",
];

let currentScene = 0;
let noAttempts = 0;
let pointerStart = null;
let transitioning = false;

function setScene(nextIndex, { announce = true } = {}) {
  const safeIndex = Math.max(0, Math.min(nextIndex, scenes.length - 1));
  if (safeIndex === currentScene && nextIndex !== 0) return;

  if (currentScene === 6 && safeIndex !== 6) resetNoButton();

  currentScene = safeIndex;
  slides.style.transform = `translate3d(-${currentScene * 100}%, 0, 0)`;
  progressBar.style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
  progressLabel.textContent = `${currentScene + 1} de ${scenes.length}`;
  backButton.classList.toggle("is-visible", currentScene > 0 && currentScene < 7);
  backButton.tabIndex = currentScene > 0 && currentScene < 7 ? 0 : -1;

  scenes.forEach((scene, index) => {
    const isActive = index === currentScene;
    scene.classList.toggle("is-active", isActive);
    scene.toggleAttribute("inert", !isActive);
    scene.setAttribute("aria-hidden", String(!isActive));
  });

  document.body.dataset.scene = String(currentScene);
  if (announce) {
    announcer.textContent = `Página ${currentScene + 1} de ${scenes.length}`;
  }

  transitioning = true;
  window.setTimeout(() => {
    transitioning = false;
  }, 730);
}

function nextScene() {
  if (!transitioning && currentScene < scenes.length - 1 && currentScene !== 6) {
    setScene(currentScene + 1);
  }
}

function previousScene() {
  if (!transitioning && currentScene > 0) {
    setScene(currentScene - 1);
  }
}

function rectanglesOverlap(a, b, padding = 0) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function moveNoButton(event) {
  if (event) event.preventDefault();
  if (currentScene !== 6) return;

  if (!noButton.classList.contains("is-running")) {
    const rect = noButton.getBoundingClientRect();
    document.body.appendChild(noButton);
    noButton.classList.add("is-running");
    noButton.style.left = `${rect.left}px`;
    noButton.style.top = `${rect.top}px`;
  }

  const buttonWidth = noButton.offsetWidth || 120;
  const buttonHeight = noButton.offsetHeight || 54;
  const margin = 14;
  const headerGuard = Math.max(70, parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-top"), 10) + 52 || 70);
  const yesRect = yesButton.getBoundingClientRect();
  let candidate;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = margin + Math.random() * Math.max(1, window.innerWidth - buttonWidth - margin * 2);
    const y = headerGuard + Math.random() * Math.max(1, window.innerHeight - buttonHeight - headerGuard - margin);
    candidate = { left: x, top: y, right: x + buttonWidth, bottom: y + buttonHeight };
    if (!rectanglesOverlap(candidate, yesRect, 24)) break;
  }

  noButton.style.left = `${candidate.left}px`;
  noButton.style.top = `${candidate.top}px`;
  noAttempts += 1;
  noMessage.textContent = noMessages[(noAttempts - 1) % noMessages.length];
}

function resetNoButton() {
  const choiceZone = document.getElementById("choiceZone");
  noButton.classList.remove("is-running");
  noButton.removeAttribute("style");
  choiceZone.appendChild(noButton);
  noMessage.textContent = "";
  noAttempts = 0;
}

function celebrate() {
  const colors = ["#d97a91", "#f7dce4", "#ded7f2", "#dce8d4", "#f5c96a", "#fffaf4"];
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 52; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--duration", `${1.8 + Math.random() * 1.5}s`);
      piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      piece.style.setProperty("--spin", `${360 + Math.random() * 900}deg`);
      piece.style.animationDelay = `${Math.random() * 0.35}s`;
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 3800);
    }
  }

  noButton.hidden = true;
  yesButton.disabled = true;
  announcer.textContent = "¡Laura ha dicho que sí!";
  window.setTimeout(() => setScene(7, { announce: false }), 420);
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", nextScene);
});

backButton.addEventListener("click", previousScene);
yesButton.addEventListener("click", celebrate);

["pointerenter", "pointerdown", "touchstart", "focus"].forEach((eventName) => {
  noButton.addEventListener(eventName, moveNoButton, { passive: false });
});

noButton.addEventListener("click", moveNoButton);

restartButton.addEventListener("click", () => {
  noButton.hidden = false;
  yesButton.disabled = false;
  resetNoButton();
  setScene(0);
});

slides.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  pointerStart = { x: event.clientX, y: event.clientY };
});

slides.addEventListener("pointerup", (event) => {
  if (!pointerStart || transitioning) return;
  const distanceX = event.clientX - pointerStart.x;
  const distanceY = event.clientY - pointerStart.y;
  pointerStart = null;

  if (Math.abs(distanceX) < 55 || Math.abs(distanceX) < Math.abs(distanceY) * 1.2) return;
  if (distanceX < 0 && currentScene !== 6) nextScene();
  if (distanceX > 0) previousScene();
});

slides.addEventListener("pointercancel", () => {
  pointerStart = null;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") nextScene();
  if (event.key === "ArrowLeft") previousScene();
});

window.addEventListener("resize", () => {
  if (noButton.classList.contains("is-running")) moveNoButton();
});

setScene(0, { announce: false });
// La primera interacción debe responder de inmediato; aquí no hay una transición previa que esperar.
transitioning = false;
