"use strict";

/*
 * Cada contraseña dispara una configuración fija de 5 etapas.
 * Cada etapa define:
 *   monitor: dígito 1-4 mostrado en la pantalla del módulo
 *   labels:  etiquetas de los botones, de izquierda a derecha (posición 1-4)
 */
const SCENARIOS = {
  "2640": [
    { monitor: 3, labels: [2, 4, 1, 3] },
    { monitor: 4, labels: [1, 3, 4, 2] },
    { monitor: 2, labels: [4, 1, 2, 3] },
    { monitor: 1, labels: [3, 2, 4, 1] },
    { monitor: 4, labels: [2, 1, 3, 4] },
  ],
  "1570": [
    { monitor: 1, labels: [4, 2, 1, 3] },
    { monitor: 3, labels: [1, 4, 3, 2] },
    { monitor: 4, labels: [2, 3, 1, 4] },
    { monitor: 2, labels: [3, 1, 4, 2] },
    { monitor: 1, labels: [4, 2, 3, 1] },
  ],
  "2215": [
    { monitor: 4, labels: [1, 2, 4, 3] },
    { monitor: 2, labels: [3, 4, 1, 2] },
    { monitor: 1, labels: [2, 1, 3, 4] },
    { monitor: 4, labels: [4, 3, 2, 1] },
    { monitor: 3, labels: [1, 3, 4, 2] },
  ],
  "2005": [
    { monitor: 2, labels: [3, 1, 2, 4] },
    { monitor: 1, labels: [4, 2, 3, 1] },
    { monitor: 3, labels: [1, 4, 2, 3] },
    { monitor: 3, labels: [2, 3, 4, 1] },
    { monitor: 2, labels: [4, 1, 3, 2] },
  ],
};

/**
 * Reglas del módulo Memoria (Keep Talking and Nobody Explodes).
 * history está indexado desde 1: history[1] = { position, label } de la etapa 1, etc.
 * Devuelve la posición correcta (1-4) para la etapa dada.
 */
function correctPosition(stageNum, monitor, labels, history) {
  const posOfLabel = (label) => labels.indexOf(label) + 1;

  switch (stageNum) {
    case 1:
      return { 1: 2, 2: 2, 3: 3, 4: 4 }[monitor];
    case 2:
      return { 1: posOfLabel(4), 2: history[1].position, 3: 1, 4: history[1].position }[monitor];
    case 3:
      return {
        1: posOfLabel(history[2].label),
        2: posOfLabel(history[1].label),
        3: 3,
        4: posOfLabel(4),
      }[monitor];
    case 4:
      return { 1: history[1].position, 2: 1, 3: history[2].position, 4: history[2].position }[monitor];
    case 5:
      return {
        1: posOfLabel(history[1].label),
        2: posOfLabel(history[2].label),
        3: posOfLabel(history[4].label),
        4: posOfLabel(history[3].label),
      }[monitor];
    default:
      throw new Error("Etapa inválida: " + stageNum);
  }
}

// ---- Estado del juego ----
let currentScenario = null;
let stageIndex = 0; // 0-based, etapa actual = stageIndex + 1
let history = {};

// ---- Elementos DOM ----
const lockScreen = document.getElementById("lock-screen");
const moduleScreen = document.getElementById("module-screen");
const successScreen = document.getElementById("success-screen");
const passwordInput = document.getElementById("password-input");
const lockMessage = document.getElementById("lock-message");
const stageCounter = document.getElementById("stage-counter");
const monitorDigit = document.getElementById("monitor-digit");
const buttonsRow = document.getElementById("buttons-row");
const feedback = document.getElementById("feedback");
const feedbackIcon = document.getElementById("feedback-icon");
const feedbackText = document.getElementById("feedback-text");

function showScreen(screen) {
  [lockScreen, moduleScreen, successScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function startScenario(name) {
  currentScenario = SCENARIOS[name];
  stageIndex = 0;
  history = {};
  hideFeedback();
  showScreen(moduleScreen);
  renderStage();
}

function renderStage() {
  const stage = currentScenario[stageIndex];
  stageCounter.textContent = `ETAPA ${stageIndex + 1}/5`;
  monitorDigit.textContent = String(stage.monitor);

  buttonsRow.innerHTML = "";
  stage.labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.className = "mem-button";
    btn.textContent = String(label);
    btn.addEventListener("click", () => handlePress(i + 1, label));
    buttonsRow.appendChild(btn);
  });
}

function showFeedback(success, text) {
  feedback.classList.remove("success", "fail");
  feedback.classList.add(success ? "success" : "fail");
  feedbackIcon.textContent = success ? "✓" : "✗";
  feedbackText.textContent = text;
  moduleScreen.classList.add("feedback-mode");
}

function hideFeedback() {
  moduleScreen.classList.remove("feedback-mode");
}

function handlePress(position, label) {
  const stage = currentScenario[stageIndex];
  const correct = correctPosition(stageIndex + 1, stage.monitor, stage.labels, history);

  if (position === correct) {
    history[stageIndex + 1] = { position, label };
    stageIndex++;
    const finished = stageIndex >= currentScenario.length;

    showFeedback(true, finished ? "MÓDULO COMPLETO" : "CORRECTO");
    setTimeout(() => {
      hideFeedback();
      if (finished) {
        showScreen(successScreen);
      } else {
        renderStage();
      }
    }, 650);
  } else {
    showFeedback(false, "INCORRECTO — REINICIANDO");

    stageIndex = 0;
    history = {};
    setTimeout(() => {
      hideFeedback();
      renderStage();
    }, 750);
  }
}

function tryPassword() {
  const value = passwordInput.value.trim().toUpperCase();
  if (SCENARIOS[value]) {
    passwordInput.value = "";
    lockMessage.textContent = "";
    startScenario(value);
  } else {
    lockMessage.textContent = "ACCESO DENEGADO";
    lockMessage.classList.remove("shake");
    // fuerza reflow para poder re-disparar la animación
    void lockMessage.offsetWidth;
    lockMessage.classList.add("shake");
    passwordInput.value = "";
  }
}

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryPassword();
});

// mantiene el foco en el input para que el teclado móvil aparezca al tocar la pantalla
lockScreen.addEventListener("click", () => passwordInput.focus());
passwordInput.focus();

successScreen.addEventListener("click", resetToLock);
document.addEventListener("keydown", (e) => {
  if (successScreen.classList.contains("active")) resetToLock();
});

function resetToLock() {
  currentScenario = null;
  stageIndex = 0;
  history = {};
  showScreen(lockScreen);
  setTimeout(() => passwordInput.focus(), 50);
}
