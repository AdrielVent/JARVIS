const seedMemories = [
  "Architecture: typed events keep sensors, tools, and memory separated.",
  "Safety: physical actions stay in review mode until real adapters are approved.",
  "Status: this browser build uses mock tools only.",
];

const modes = {
  standby: {
    title: "Standby - listening only",
    detail: "Messages are recorded and answered. Tool buttons stay idle unless you press one.",
    state: "waiting",
    answer: "I am standing by. No tool is active and no device has been changed.",
  },
  analysis: {
    title: "Analyze - diagnostics snapshot",
    detail: "Sensor readiness, latency, memory, and tool health are refreshed when this mode is selected.",
    state: "diagnostics refreshed",
    answer: "I refreshed the diagnostics snapshot. The values below changed, but no external system was contacted.",
  },
  ops: {
    title: "Operate - review before action",
    detail: "Tool cards can stage mocked actions. Real home, printer, or OS control would require an approved adapter.",
    state: "reviewing actions",
    answer: "Operate mode is armed for review. Tool requests are staged and logged; nothing runs automatically.",
  },
};

const toolResults = {
  laptop: {
    summary: "Laptop bridge check requested.",
    answer: "I will look for the local bridge on this laptop. If it is running, I can read basic status only.",
  },
  home: {
    summary: "Home Assistant mock check complete. No lights, locks, or devices were changed.",
    answer: "Home status is mocked as reachable. I did not send a real Home Assistant command.",
  },
  printer: {
    summary: "Printer telemetry mock: hotend 24 C / 0 C target, bed 22 C / 0 C target.",
    answer: "Printer telemetry is simulated. No serial command was sent to a real printer.",
  },
  exec: {
    summary: "OS task blocked. No allowlisted script was selected.",
    answer: "I blocked the OS task path. This build will not run arbitrary local commands.",
  },
  memory: {
    summary: "Memory index checked. Visible memory entries were refreshed only in this browser.",
    answer: "Memory recall is local to the page right now. Nothing was written to a real database.",
  },
};

let memories = [...seedMemories];
let events = [
  { time: "21:24", text: "Browser session started in standby mode." },
  { time: "21:25", text: "Mock tools loaded: home, printer, OS task, memory." },
  { time: "21:26", text: "Safety policy loaded. Real device control is disabled." },
];

const metrics = {
  stt: document.querySelector("#metric-stt"),
  token: document.querySelector("#metric-token"),
  tts: document.querySelector("#metric-tts"),
};

const modeTitle = document.querySelector("#mode-title");
const modeDetail = document.querySelector("#mode-detail");
const bridgeTitle = document.querySelector("#bridge-title");
const bridgeDetail = document.querySelector("#bridge-detail");
const bridgePill = document.querySelector("#bridge-pill");
const bridgeEndpoint = document.querySelector("#bridge-endpoint");
const bridgeDevice = document.querySelector("#bridge-device");
const bridgeOs = document.querySelector("#bridge-os");
const bridgeCpu = document.querySelector("#bridge-cpu");
const bridgeDisk = document.querySelector("#bridge-disk");
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

let currentMode = "standby";
let safetyEnabled = true;
let particles = [];
let feedbackTimer;
let lastCommand = "";
let repeatCount = 0;
let bridgeApiBase = resolveBridgeApiBase();

function resolveBridgeApiBase() {
  const localHosts = new Set(["127.0.0.1", "localhost"]);
  if (window.location.protocol.startsWith("http") && localHosts.has(window.location.hostname)) {
    return `${window.location.origin}/api`;
  }
  return "http://127.0.0.1:8765/api";
}

function renderList(target, items, render) {
  target.replaceChildren(...items.map(render));
}

function renderMemory() {
  const visibleMemories = memories.length ? memories : ["No recent commands or messages."];
  renderList(memoryList, visibleMemories, (memory) => {
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

function pulse(sourceElement) {
  if (!sourceElement) return;
  sourceElement.classList.add("was-clicked");
  window.setTimeout(() => sourceElement.classList.remove("was-clicked"), 520);
}

function acknowledge(title, detail, sourceElement) {
  window.clearTimeout(feedbackTimer);
  actionFeedback.querySelector("strong").textContent = title;
  actionFeedback.querySelector("span:last-child").textContent = detail;
  actionFeedback.classList.add("is-live");
  turnState.textContent = `Runtime state: ${title.toLowerCase().replace(".", "")}.`;
  pulse(sourceElement);

  feedbackTimer = window.setTimeout(() => {
    actionFeedback.classList.remove("is-live");
  }, 1500);
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function refreshMetrics() {
  metrics.stt.textContent = `${randomBetween(162, 236)} ms`;
  metrics.token.textContent = `${randomBetween(74, 128)} ms`;
  metrics.tts.textContent = `${randomBetween(108, 176)} ms`;
}

function updateSafetyPill() {
  safetyPill.textContent = safetyEnabled ? "Safe" : "Review";
  safetyPill.classList.toggle("is-safe", safetyEnabled);
  safetyPill.classList.toggle("is-alert", !safetyEnabled);
}

function setBridgeConnected(snapshot) {
  const osName = `${snapshot.device.os} ${snapshot.device.os_release}`;
  bridgeTitle.textContent = "Connected to this laptop";
  bridgeDetail.textContent =
    "Read-only local bridge is online. J.A.R.V.I.S. can see basic system status, but cannot read files or run commands.";
  bridgePill.textContent = "Connected";
  bridgePill.classList.remove("is-alert");
  bridgePill.classList.add("is-safe");
  bridgeEndpoint.textContent = bridgeApiBase.replace("/api", "");
  bridgeDevice.textContent = snapshot.device.hostname;
  bridgeOs.textContent = osName;
  bridgeCpu.textContent = `${snapshot.device.cpu_count} cores`;
  bridgeDisk.textContent = `${snapshot.disk.free_gb} GB free`;
}

function setBridgeDisconnected() {
  bridgeTitle.textContent = "Disconnected from this laptop";
  bridgeDetail.textContent =
    "Run python3 bridge/jarvis_local_bridge.py, then open http://127.0.0.1:8765 or press Connect Laptop here.";
  bridgePill.textContent = "Offline";
  bridgePill.classList.add("is-alert");
  bridgePill.classList.remove("is-safe");
  bridgeEndpoint.textContent = bridgeApiBase.replace("/api", "");
  bridgeDevice.textContent = "Not connected";
  bridgeOs.textContent = "Unknown";
  bridgeCpu.textContent = "Unknown";
  bridgeDisk.textContent = "Unknown";
}

async function fetchBridgeJson(path, timeoutMs = 1400) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${bridgeApiBase}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Bridge returned ${response.status}`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function connectBridge(sourceElement, quiet = false) {
  pulse(sourceElement);
  if (!quiet) {
    acknowledge("Bridge connecting.", "Checking 127.0.0.1 for the read-only local laptop bridge.", sourceElement);
  }

  try {
    await fetchBridgeJson("/health");
    const snapshot = await fetchBridgeJson("/system");
    setBridgeConnected(snapshot);
    assistantLine.textContent =
      `Connected to ${snapshot.device.hostname}. I can read OS, CPU, and disk status only. File access and command execution are disabled.`;
    toolSummary.textContent = "Laptop bridge: connected in read-only mode.";
    pushEvent(`Laptop bridge connected to ${snapshot.device.hostname}.`);
    if (!quiet) {
      acknowledge("Laptop connected.", "Read-only system status is now visible in the bridge panel.", sourceElement);
    }
    return true;
  } catch (error) {
    setBridgeDisconnected();
    if (!quiet) {
      assistantLine.textContent =
        "I could not reach the local laptop bridge. Start it with python3 bridge/jarvis_local_bridge.py.";
      toolSummary.textContent = "Laptop bridge: offline.";
      pushEvent("Laptop bridge connection failed.");
      acknowledge("Bridge offline.", "Start the local bridge, then press Connect Laptop again.", sourceElement);
    }
    return false;
  }
}

function rememberCommand(command) {
  if (command === lastCommand) {
    repeatCount += 1;
    memories[0] = `Repeated message (${repeatCount}x): ${command}`;
  } else {
    lastCommand = command;
    repeatCount = 1;
    memories.unshift(`Latest message: ${command}`);
  }

  memories = memories.slice(0, 5);
  renderMemory();
}

function runDiagnostics(source = "manual check", sourceElement) {
  refreshMetrics();
  renderWaveform();
  assistantLine.textContent =
    "Diagnostics refreshed. Sensors are mocked as available, memory is local to this page, and no external system was contacted.";
  toolSummary.textContent = "System check complete. Tool bus is idle.";
  pushEvent(`Diagnostics refreshed from ${source}.`);
  acknowledge("Diagnostics refreshed.", "Latency values, waveform, and safety log were updated.", sourceElement);
}

function simulateTurn(source = "manual check", sourceElement) {
  runDiagnostics(source, sourceElement);
}

function handleTool(tool, sourceElement) {
  if (tool === "laptop") {
    connectBridge(sourceElement);
    return;
  }

  const result = toolResults[tool] || {
    summary: "Unknown tool ignored.",
    answer: "I ignored an unknown tool request.",
  };

  assistantLine.textContent = result.answer;
  toolSummary.textContent = result.summary;
  renderWaveform();
  pushEvent(result.summary);
  acknowledge("Tool reviewed.", result.summary, sourceElement);
}

function setMode(button) {
  const nextMode = button.dataset.mode;
  const mode = modes[nextMode] || modes.standby;
  currentMode = nextMode;

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
  button.classList.add("is-active");
  modeTitle.textContent = mode.title;
  modeDetail.textContent = mode.detail;
  assistantLine.textContent = mode.answer;
  turnState.textContent = `Runtime state: ${mode.state}.`;

  if (nextMode === "analysis") {
    runDiagnostics("Analyze mode", button);
    return;
  }

  if (nextMode === "ops") {
    safetyEnabled = false;
    updateSafetyPill();
    toolSummary.textContent = "Operate mode: tool requests are staged for review.";
  } else {
    toolSummary.textContent = "Tool status: idle. No devices have been changed.";
  }

  pushEvent(`Mode set to ${nextMode}.`);
  acknowledge("Mode changed.", mode.detail, button);
}

function toggleSafety(sourceElement) {
  safetyEnabled = !safetyEnabled;
  updateSafetyPill();
  const message = safetyEnabled
    ? "Safety gate is safe. Mock tools can report status only."
    : "Safety gate is review-only. Actions are staged and logged.";
  assistantLine.textContent = message;
  pushEvent(message);
  acknowledge("Safety updated.", message, sourceElement);
}

function clearEventLog(sourceElement) {
  events = [{ time: nowTime(), text: "Safety event log cleared." }];
  renderEvents();
  acknowledge("Log cleared.", "Only the clear event remains in the safety log.", sourceElement);
}

function clearSession(sourceElement) {
  memories = [];
  events = [{ time: nowTime(), text: "Browser session reset." }];
  lastCommand = "";
  repeatCount = 0;
  currentMode = "standby";
  safetyEnabled = true;
  commandInput.value = "Run diagnostics on the system.";
  updateSafetyPill();
  renderMemory();
  renderEvents();
  renderWaveform();
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mode === "standby");
  });
  modeTitle.textContent = modes.standby.title;
  modeDetail.textContent = modes.standby.detail;
  assistantLine.textContent = "Session cleared. I am back in standby and no tool is active.";
  toolSummary.textContent = "Tool status: idle. No devices have been changed.";
  turnState.textContent = "Runtime state: waiting.";
  acknowledge("Session cleared.", "Memory, log, mode, and safety state were reset.", sourceElement);
}

function handleConversation(command, sourceElement) {
  assistantLine.textContent =
    `I treated "${command}" as conversation text, not a tool request. Nothing was executed or changed.`;
  toolSummary.textContent = "Tool status: idle. No devices have been changed.";
  renderWaveform();
  pushEvent("Message answered without invoking a tool.");
  acknowledge("Message handled.", "No tool matched the message, so no action was taken.", sourceElement);
}

function routeCommand(command, sourceElement) {
  const text = command.toLowerCase();

  if (text.includes("clear") || text.includes("reset")) {
    clearSession(sourceElement);
    return;
  }

  if (text.includes("printer") || text.includes("temperature") || text.includes("nozzle") || text.includes("bed")) {
    handleTool("printer", sourceElement);
    return;
  }

  if (text.includes("laptop") || text.includes("computer") || text.includes("mac") || text.includes("disk") || text.includes("cpu")) {
    connectBridge(sourceElement);
    return;
  }

  if (text.includes("home") || text.includes("light") || text.includes("device") || text.includes("assistant")) {
    handleTool("home", sourceElement);
    return;
  }

  if (text.includes("script") || text.includes("execute") || text.includes("terminal") || text.includes("run command")) {
    handleTool("exec", sourceElement);
    return;
  }

  if (text.includes("memory") || text.includes("remember") || text.includes("recall")) {
    handleTool("memory", sourceElement);
    return;
  }

  if (text.includes("diagnostic") || text.includes("check") || text.includes("system") || text.includes("health")) {
    runDiagnostics("typed command", sourceElement);
    return;
  }

  handleConversation(command, sourceElement);
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

document.querySelectorAll(".quick-actions button").forEach((button) => {
  button.addEventListener("click", () => {
    commandInput.value = button.dataset.prompt;
    rememberCommand(button.dataset.prompt);
    routeCommand(button.dataset.prompt, button);
  });
});

document.querySelector("[data-action='diagnostics']").addEventListener("click", (event) => {
  simulateTurn("Run Check button", event.currentTarget);
});

document.querySelector("[data-action='toggle-safety']").addEventListener("click", (event) => {
  toggleSafety(event.currentTarget);
});

document.querySelector("[data-action='clear-session']").addEventListener("click", (event) => {
  clearSession(event.currentTarget);
});

document.querySelector("[data-action='clear-log']").addEventListener("click", (event) => {
  clearEventLog(event.currentTarget);
});

document.querySelector("[data-action='connect-bridge']").addEventListener("click", (event) => {
  connectBridge(event.currentTarget);
});

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) return;
  rememberCommand(command);
  pushEvent(`Command received: ${command}`);
  routeCommand(command, commandForm.querySelector("button"));
});

window.addEventListener("resize", sizeCanvas);

modeTitle.textContent = modes[currentMode].title;
modeDetail.textContent = modes[currentMode].detail;
renderMemory();
renderEvents();
renderWaveform();
updateSafetyPill();
setBridgeDisconnected();
connectBridge(null, true);
sizeCanvas();
drawStarfield();
