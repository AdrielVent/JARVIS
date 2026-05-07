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
    ["Device Name", deviceName],
    ["Operating System", systemInfo.os || "Unknown"],
    ["CPU", systemInfo.cpu || "Unknown"],
    ["Memory", systemInfo.memory || "Unknown"],
    ["Battery", systemInfo.battery || "Unknown"],
    ["Local Time", systemInfo.localTime || "Unknown"],
    ["Bridge Status", systemInfo.status || "online"],
    ["Last Connection Time", lastConnectionTime],
  ];

  return (
    <main className="jarvis-screen min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <motion.header
          className="glass-panel dashboard-hero scanline grid gap-8 p-5 sm:p-6 lg:grid-cols-[1fr_340px] lg:items-center xl:grid-cols-[1fr_390px]"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="min-w-0">
            <p className="hud-eyebrow">Project J.A.R.V.I.S.</p>
            <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight text-slate-50 sm:text-5xl">
              Welcome to J.A.R.V.I.S, {deviceName}.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Bridge telemetry is active from the user-provided Local Bridge URL. Details remain in
              local React state for this browser session.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="bridge-online-indicator">
                <span aria-hidden="true" />
                Bridge Online
              </span>
              {demoMode && <span className="status-chip border-amber-300/50 text-amber-200">Demo Mode</span>}
              <button className="secondary-button sm:ml-auto lg:ml-0" type="button" onClick={onReconnect}>
                Return to Connection
              </button>
            </div>
          </div>

          <motion.div
            className="device-halo mx-auto w-full max-w-[330px]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
            aria-label={`Connected device: ${deviceName}`}
          >
            <div className="device-halo-ring device-halo-ring-a" aria-hidden="true" />
            <div className="device-halo-ring device-halo-ring-b" aria-hidden="true" />
            <div className="device-halo-ring device-halo-ring-c" aria-hidden="true" />
            <div className="device-halo-content">
              <span>Local Device</span>
              <strong>{deviceName}</strong>
              <small>{systemInfo.os || "Bridge connected"}</small>
            </div>
          </motion.div>
        </motion.header>

        <motion.section
          className="glass-panel status-ribbon grid gap-3 p-4 sm:grid-cols-3 sm:items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
        >
          <div>
            <p className="text-xs uppercase text-cyan-200/70">Bridge State</p>
            <p className="mt-1 text-lg font-semibold text-emerald-100">{systemInfo.status || "online"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-cyan-200/70">Last Contact</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">{lastConnectionTime}</p>
          </div>
          <div className="status-wave" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value], index) => (
            <HudPanel key={label} className="stat-card min-h-32 sm:min-h-36" delay={index * 0.07}>
              <p className="text-xs uppercase text-cyan-200/70">{label}</p>
              <p className="mt-4 break-words text-xl font-semibold text-slate-50 sm:text-2xl">{value}</p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-cyan-300/60 via-blue-400/20 to-transparent" />
            </HudPanel>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <HudPanel title="Runtime Channel" eyebrow="Bounded Session" delay={0.2}>
            <div className="space-y-4 text-sm leading-7 text-slate-300">
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
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-lg bg-emerald-300 shadow-glow" />
                Data is not uploaded to an external server.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-lg bg-cyan-300 shadow-glow" />
                Finder checks only approved localhost URLs after a click.
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-lg bg-amber-300 shadow-glow" />
                Browser privacy rules remain intact.
              </li>
            </ul>
          </HudPanel>
        </section>
        <footer className="pb-2 text-center text-xs leading-6 text-slate-500 sm:text-sm">
          Privacy note: telemetry stays local to this browser session and the Local Bridge URL you
          provide. No device data is uploaded, stored, or sent to any external server.
        </footer>
      </div>
    </main>
  );
}
