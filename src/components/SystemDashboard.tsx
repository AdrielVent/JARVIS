import { motion } from "framer-motion";
import type { SystemInfo } from "../types/systemInfo";
import HudPanel from "./HudPanel";

type SystemDashboardProps = {
  systemInfo: SystemInfo;
  lastConnectionTime: string;
  demoMode: boolean;
  onReconnect: () => void;
};

export default function SystemDashboard({
  systemInfo,
  lastConnectionTime,
  demoMode,
  onReconnect,
}: SystemDashboardProps) {
  const deviceName = systemInfo.deviceName?.trim() || "Operator";
  const cards = [
    {
      label: "Device Name",
      value: deviceName,
      unit: "Identity",
      detail: "Local Bridge deviceName",
    },
    {
      label: "Operating System",
      value: systemInfo.os || "Unknown",
      unit: "OS",
      detail: "System surface",
    },
    {
      label: "CPU",
      value: systemInfo.cpu || "Unknown",
      unit: "Processor",
      detail: "Bridge-reported chip",
    },
    {
      label: "Memory",
      value: systemInfo.memory || "Unknown",
      unit: "RAM",
      detail: "Installed memory",
    },
    {
      label: "Battery",
      value: systemInfo.battery || "Unknown",
      unit: "Power",
      detail: "Charge state",
    },
    {
      label: "Local Time",
      value: systemInfo.localTime || "Unknown",
      unit: "Clock",
      detail: "Device local time",
    },
    {
      label: "Bridge Status",
      value: systemInfo.status || "online",
      unit: "Link",
      detail: "localhost API",
    },
    {
      label: "Last Connection Time",
      value: lastConnectionTime,
      unit: "Session",
      detail: "Browser timestamp",
    },
  ];

  return (
    <main className="jarvis-screen min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="stark-noise absolute inset-0" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <motion.header
          className="dashboard-workspace"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <span className="dashboard-link dashboard-link-a" aria-hidden="true" />
          <span className="dashboard-link dashboard-link-b" aria-hidden="true" />

          <div className="dashboard-copy">
            <p className="hud-eyebrow">Project J.A.R.V.I.S.</p>
            <h1>Welcome to J.A.R.V.I.S, {deviceName}.</h1>
            <p>
              Bridge telemetry is active from the user-provided Local Bridge URL. Details remain in
              local React state for this browser session.
            </p>
            <div className="dashboard-actions">
              <span className="bridge-online-indicator">
                <span aria-hidden="true" />
                Bridge Online
              </span>
              {demoMode && <span className="status-chip border-amber-300/50 text-amber-200">Demo Mode</span>}
              <button className="secondary-button" type="button" onClick={onReconnect}>
                Return to Connection
              </button>
            </div>
          </div>

          <motion.div
            className="system-core-module"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: "easeOut", delay: 0.12 }}
            aria-label={`Connected device: ${deviceName}`}
          >
            <div className="device-halo">
              <div className="device-halo-ring device-halo-ring-a" aria-hidden="true" />
              <div className="device-halo-ring device-halo-ring-b" aria-hidden="true" />
              <div className="device-halo-ring device-halo-ring-c" aria-hidden="true" />
              <div className="device-halo-ring device-halo-ring-d" aria-hidden="true" />
              <div className="device-halo-content">
                <span>Local Device</span>
                <strong>{deviceName}</strong>
                <small>{systemInfo.os || "Bridge connected"}</small>
              </div>
            </div>
            <div className="core-waveform" aria-hidden="true">
              {Array.from({ length: 18 }, (_, index) => (
                <span key={index} />
              ))}
            </div>
            <div className="core-meta">
              <span>Link: localhost</span>
              <span>Scope: read-only</span>
              <span>Upload: disabled</span>
            </div>
          </motion.div>
        </motion.header>

        <motion.section
          className="status-ribbon glass-panel stark-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
        >
          <div>
            <p className="micro-label">Bridge State</p>
            <p>{systemInfo.status || "online"}</p>
          </div>
          <div>
            <p className="micro-label">Last Contact</p>
            <p>{lastConnectionTime}</p>
          </div>
          <div className="status-wave" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        </motion.section>

        <section className="telemetry-grid">
          {cards.map((card, index) => (
            <HudPanel key={card.label} className="telemetry-module min-h-36" delay={index * 0.06}>
              <div className="telemetry-topline">
                <p className="micro-label">{card.label}</p>
                <span>{card.unit}</span>
              </div>
              <p className="telemetry-value">{card.value}</p>
              <p className="telemetry-detail">{card.detail}</p>
              <div className="telemetry-trace" aria-hidden="true">
                <span />
              </div>
            </HudPanel>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <HudPanel title="Runtime Channel" eyebrow="Bounded Session" delay={0.2}>
            <div className="runtime-copy">
              <p>
                The dashboard is reading only the Local Bridge API contract: <code>/status</code>{" "}
                and <code>/system-info</code>. No file access, network scan, or hidden hardware
                lookup runs from the browser.
              </p>
              <p>
                To expand capabilities later, add explicit bridge endpoints with allowlisted actions
                and clear user approval before anything touches the laptop.
              </p>
            </div>
          </HudPanel>
          <HudPanel title="Signal Integrity" eyebrow="Privacy Boundary" delay={0.28}>
            <ul className="signal-list">
              <li>
                <span className="signal-dot signal-dot-green" aria-hidden="true" />
                Data is not uploaded to an external server.
              </li>
              <li>
                <span className="signal-dot signal-dot-cyan" aria-hidden="true" />
                Finder checks only approved localhost URLs after a click.
              </li>
              <li>
                <span className="signal-dot signal-dot-amber" aria-hidden="true" />
                Browser privacy rules remain intact.
              </li>
            </ul>
          </HudPanel>
        </section>
        <footer className="privacy-footer">
          Privacy note: telemetry stays local to this browser session and the Local Bridge URL you
          provide. No device data is uploaded, stored, or sent to any external server.
        </footer>
      </div>
    </main>
  );
}
