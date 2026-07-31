"use strict";

/*
 * Cada contraseña dispara una configuración fija de 5 etapas y un texto
 * final propio, que se muestra al completar el módulo.
 * Cada etapa define:
 *   monitor: dígito 1-4 mostrado en la pantalla del módulo
 *   labels:  etiquetas de los botones, de izquierda a derecha (posición 1-4)
 */
const SCENARIOS = {
  "2640": {
    stages: [
      { monitor: 3, labels: [2, 4, 1, 3] },
      { monitor: 4, labels: [1, 3, 4, 2] },
      { monitor: 2, labels: [4, 1, 2, 3] },
      { monitor: 1, labels: [3, 2, 4, 1] },
      { monitor: 4, labels: [2, 1, 3, 4] },
    ],
    finalText:
      "Sentados, todos quietos\n" +
      "Que a nadie se le oiga murmurar\n" +
      "Oimos juntos, bien atentos\n" +
      "La voz resuena al predicar.\n" +
      "Al frente un pulpito, o tras un telon\n" +
      "Pues hablo de ...",
  },
  "1570": {
    stages: [
      { monitor: 1, labels: [4, 2, 1, 3] },
      { monitor: 3, labels: [1, 4, 3, 2] },
      { monitor: 4, labels: [2, 3, 1, 4] },
      { monitor: 2, labels: [3, 1, 4, 2] },
      { monitor: 1, labels: [4, 2, 3, 1] },
    ],
    finalText:
      "De ellos no depende\n" +
      "la melodía que desprenden\n" +
      "Mas es cuestión de la mano\n" +
      "que los toca con cuidado\n" +
      "Si nos deleitan con su sonido\n" +
      "o nos tapamos los oídos.",
  },
  "2215": {
    stages: [
      { monitor: 4, labels: [1, 2, 4, 3] },
      { monitor: 2, labels: [3, 4, 1, 2] },
      { monitor: 1, labels: [2, 1, 3, 4] },
      { monitor: 4, labels: [4, 3, 2, 1] },
      { monitor: 3, labels: [1, 3, 4, 2] },
    ],
    finalText:
      "Es la hora del amuerzo\n" +
      "y ya todo está dispuesto,\n" +
      "los platos en la mesa\n" +
      "colocados con presteza\n" +
      "más una cosa me falta\n" +
      "y el hambre ya me astilla,\n" +
      "no encuentro para sentarme\n" +
      "a la mesa una...",
  },
  "2005": {
    stages: [
      { monitor: 2, labels: [3, 1, 2, 4] },
      { monitor: 1, labels: [4, 2, 3, 1] },
      { monitor: 3, labels: [1, 4, 2, 3] },
      { monitor: 3, labels: [2, 3, 4, 1] },
      { monitor: 2, labels: [4, 1, 3, 2] },
    ],
    finalText:
      "Ya sean reyes, sacerdotes o medigos\n" +
      "todos a mi alrededor quedan reunidos\n" +
      "ya sea para reuniones de funcionarios\n" +
      "o para compartir los alimentos diarios",
  },
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
let currentStages = null;
let currentFinalText = "";
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
const successText = document.getElementById("success-text");

function showScreen(screen) {
  [lockScreen, moduleScreen, successScreen].forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

function startScenario(name) {
  currentStages = SCENARIOS[name].stages;
  currentFinalText = SCENARIOS[name].finalText;
  stageIndex = 0;
  history = {};
  hideFeedback();
  showScreen(moduleScreen);
  renderStage();
}

function renderStage() {
  const stage = currentStages[stageIndex];
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
  const stage = currentStages[stageIndex];
  const correct = correctPosition(stageIndex + 1, stage.monitor, stage.labels, history);

  if (position === correct) {
    history[stageIndex + 1] = { position, label };
    stageIndex++;
    const finished = stageIndex >= currentStages.length;

    showFeedback(true, finished ? "MÓDULO COMPLETO" : "CORRECTO");
    setTimeout(() => {
      hideFeedback();
      if (finished) {
        showFinalText();
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

function showFinalText() {
  successText.textContent = currentFinalText;
  showScreen(successScreen);
}

successScreen.addEventListener("click", resetToLock);
document.addEventListener("keydown", (e) => {
  if (successScreen.classList.contains("active")) resetToLock();
});

function resetToLock() {
  currentStages = null;
  currentFinalText = "";
  stageIndex = 0;
  history = {};
  showScreen(lockScreen);
  setTimeout(() => passwordInput.focus(), 50);
}
