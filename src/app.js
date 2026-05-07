const memories = [
  "Architecture stance: event-driven edge runtime with typed internal contracts.",
  "Canon note: pre-Vision J.A.R.V.I.S. is a voice, operating system, and interface presence.",
  "Safety gate: physical actions require allowlisted adapters and audit logging.",
];

const events = [
  { time: "21:24", text: "Safety policy loaded. Parallel physical tool calls disabled." },
  { time: "21:25", text: "Home Assistant adapter mocked behind REST/WS boundary." },
  { time: "21:26", text: "Printer telemetry set to M155-style continuous reporting." },
  { time: "21:27", text: "Memory writes queued outside the audio-critical path." },
];

const replies = [
  "Diagnostics are clean. Wake-word detection is armed, memory recall is responsive, and noncritical workers remain isolated from the speech path.",
  "I have staged the command for review. No physical action will be executed without the safety gate and an allowlisted adapter.",
  "The workshop profile is stable. Printer telemetry is simulated, Home Assistant is mocked, and the command router is in bounded mode.",
  "Analysis complete. Latency remains inside the target envelope, though real providers will need p95 measurements before we declare victory.",
];

const metrics = {
  stt: document.querySelector("#metric-stt"),
  token: document.querySelector("#metric-token"),
  tts: document.querySelector("#metric-tts"),
};

const memoryList = document.querySelector("#memory-list");
const eventLog = document.querySelector("#event-log");
const eventCount = document.querySelector("#event-count");
const assistantLine = document.querySelector("#assistant-line");
const actionFeedback = document.querySelector("#action-feedback");
const turnState = document.querySelector("#turn-state");
const toolSummary = document.querySelector("#tool-summary");
const commandForm = document.querySelector("#command-form");
const commandInput = document.querySelector("#command-input");
const waveform = document.querySelector("#waveform");
const safetyPill = document.querySelector("#safety-pill");
const starfield = document.querySelector("#starfield");
const ctx = starfield.getContext("2d");

let safetyEnabled = true;
let replyIndex = 0;
let particles = [];
let feedbackTimer;

function renderList(target, items, render) {
  target.replaceChildren(...items.map(render));
}

function renderMemory() {
  renderList(memoryList, memories, (memory) => {
    const item = document.createElement("li");
    item.textContent = memory;
    return item;
  });
}

function renderEvents() {
  renderList(eventLog, events.slice(-6).reverse(), (event) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const text = document.createElement("span");
    time.textContent = event.time;
    text.textContent = event.text;
    item.append(time, text);
    return item;
  });
  eventCount.textContent = String(events.length).padStart(2, "0");
}

function renderWaveform() {
  const bars = Array.from({ length: 28 }, (_, index) => {
    const bar = document.createElement("span");
    bar.style.height = `${10 + Math.round(Math.sin(index * 0.7) * 8 + Math.random() * 18)}px`;
    bar.style.animationDelay = `${index * 34}ms`;
    return bar;
  });
  waveform.replaceChildren(...bars);
}

function nowTime() {
  return new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function pushEvent(text) {
  events.push({ time: nowTime(), text });
  renderEvents();
}

function acknowledge(title, detail, sourceElement) {
  window.clearTimeout(feedbackTimer);
  actionFeedback.querySelector("strong").textContent = title;
  actionFeedback.querySelector("span:last-child").textContent = detail;
  actionFeedback.classList.add("is-live");
  turnState.textContent = `Runtime state: ${title.toLowerCase()}`;

  if (sourceElement) {
    sourceElement.classList.add("was-clicked");
    window.setTimeout(() => sourceElement.classList.remove("was-clicked"), 520);
  }

  feedbackTimer = window.setTimeout(() => {
    actionFeedback.classList.remove("is-live");
  }, 1400);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function refreshMetrics() {
  metrics.stt.textContent = `${randomBetween(162, 236)} ms`;
  metrics.token.textContent = `${randomBetween(74, 128)} ms`;
  metrics.tts.textContent = `${randomBetween(108, 176)} ms`;
}

function simulateTurn(source = "manual command", sourceElement) {
  assistantLine.textContent = replies[replyIndex % replies.length];
  replyIndex += 1;
  refreshMetrics();
  renderWaveform();
  pushEvent(`Simulated ${source} processed through bounded router.`);
  acknowledge("Turn processed.", `Simulated ${source}; metrics, waveform, and event log updated.`, sourceElement);
}

function handleTool(tool, sourceElement) {
  const labels = {
    home: "Home Assistant status queried through the mock service bus.",
    printer: "Printer telemetry worker returned stable hotend and bed readings.",
    exec: "OS task request blocked pending explicit allowlist match.",
    memory: "Memory index recall completed with metadata filters.",
  };
  const label = labels[tool] || "Unknown tool request ignored.";
  pushEvent(label);
  toolSummary.textContent = label;
  simulateTurn(`${tool} tool`, sourceElement);
}

function setMode(button) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
  button.classList.add("is-active");
  pushEvent(`Operating mode set to ${button.dataset.mode}.`);
  acknowledge("Mode changed.", `Operating mode is now ${button.dataset.mode}.`, button);
}

function toggleSafety(sourceElement) {
  safetyEnabled = !safetyEnabled;
  safetyPill.textContent = safetyEnabled ? "Safe" : "Review";
  safetyPill.classList.toggle("is-safe", safetyEnabled);
  safetyPill.classList.toggle("is-alert", !safetyEnabled);
  const message = safetyEnabled ? "Safety gate restored to safe mode." : "Safety gate moved to review mode.";
  pushEvent(message);
  acknowledge("Safety state updated.", message, sourceElement);
}

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  starfield.width = Math.floor(window.innerWidth * dpr);
  starfield.height = Math.floor(window.innerHeight * dpr);
  starfield.style.width = `${window.innerWidth}px`;
  starfield.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({ length: Math.min(110, Math.floor(window.innerWidth / 12)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: -0.08 + Math.random() * 0.16,
    vy: 0.05 + Math.random() * 0.22,
    r: 0.7 + Math.random() * 1.8,
    alpha: 0.18 + Math.random() * 0.48,
  }));
}

function drawStarfield() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.y > window.innerHeight + 8) particle.y = -8;
    if (particle.x < -8) particle.x = window.innerWidth + 8;
    if (particle.x > window.innerWidth + 8) particle.x = -8;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(101, 230, 247, ${particle.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStarfield);
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => setMode(button));
});

document.querySelectorAll(".tool-card").forEach((button) => {
  button.addEventListener("click", () => handleTool(button.dataset.tool, button));
});

document.querySelector("[data-action='simulate']").addEventListener("click", (event) => {
  simulateTurn("manual command", event.currentTarget);
});
document.querySelector("[data-action='toggle-safety']").addEventListener("click", (event) => {
  toggleSafety(event.currentTarget);
});

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) return;
  pushEvent(`Command received: ${command}`);
  memories.unshift(`Latest command: ${command}`);
  if (memories.length > 5) memories.pop();
  renderMemory();
  simulateTurn("typed command", commandForm.querySelector("button"));
});

window.addEventListener("resize", sizeCanvas);

renderMemory();
renderEvents();
renderWaveform();
sizeCanvas();
drawStarfield();
