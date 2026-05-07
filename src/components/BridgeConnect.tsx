import { motion } from "framer-motion";
import type { ConnectionStatus, SetupTab } from "../types/systemInfo";
import BridgeFinder from "./BridgeFinder";
import HudPanel from "./HudPanel";
import LoadingScanner from "./LoadingScanner";

type BridgeConnectProps = {
  bridgeUrl: string;
  connectionStatus: ConnectionStatus;
  errorMessage: string;
  foundBridges: string[];
  isFindingBridge: boolean;
  finderMessage: string;
  scanProgress: number;
  selectedSetupTab: SetupTab;
  onBridgeUrlChange: (value: string) => void;
  onConnect: (url?: string) => void;
  onFindBridge: () => void;
  onSelectSetupTab: (tab: SetupTab) => void;
  onDemoMode: () => void;
};

export default function BridgeConnect({
  bridgeUrl,
  connectionStatus,
  errorMessage,
  foundBridges,
  isFindingBridge,
  finderMessage,
  scanProgress,
  selectedSetupTab,
  onBridgeUrlChange,
  onConnect,
  onFindBridge,
  onSelectSetupTab,
  onDemoMode,
}: BridgeConnectProps) {
  const isConnecting = connectionStatus === "connecting";
  const connectionSteps = [
    {
      label: "Download and start your Local Bridge",
      detail: "Run the small bridge app on the same laptop you want to visualize.",
    },
    {
      label: "Find or enter your bridge URL",
      detail: "Use the localhost finder or paste the bridge URL from the bridge window.",
    },
    {
      label: "Connect to view your own dashboard",
      detail: "J.A.R.V.I.S renders only the device details returned by your bridge.",
    },
  ];
  const worksNow = [
    "Real device name",
    "Operating system",
    "CPU",
    "Memory",
    "Battery",
    "Local time",
    "Bridge online status",
  ];
  const doesNotDo = [
    "Does not read files",
    "Does not run hidden commands",
    "Does not scan your network",
    "Does not upload device data",
    "Does not control your laptop without explicit future bridge endpoints",
  ];
  const heroCallouts = [
    ["Protocol", "Localhost handshake only"],
    ["Boundary", "No external upload"],
    ["Finder", "Click-initiated scan"],
  ];

  return (
    <main className="jarvis-screen min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="stark-noise absolute inset-0" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <motion.header
          className="stark-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div className="hero-copy">
            <p className="hud-eyebrow">Project J.A.R.V.I.S.</p>
            <h1 className="stark-title">J.A.R.V.I.S</h1>
            <p className="stark-subtitle">Local Systems Interface</p>
            <div className="hero-divider" aria-hidden="true" />
            <p className="hero-kicker">Connect Your Local Bridge</p>
            <p className="mt-4 max-w-2xl text-balance text-base leading-7 text-slate-300 sm:text-lg">
              Enter your bridge URL manually or use the helper to find it on this device.
            </p>
            <div className="hero-command-strip" aria-label="Local bridge security summary">
              {heroCallouts.map(([label, value]) => (
                <div key={label} className="command-readout">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="reactor-stage" aria-hidden="true">
            <div className="stark-reactor">
              <span className="reactor-ring reactor-ring-a" />
              <span className="reactor-ring reactor-ring-b" />
              <span className="reactor-ring reactor-ring-c" />
              <span className="reactor-ring reactor-ring-d" />
              <span className="reactor-crosshair" />
              <span className="reactor-core" />
              <span className="reactor-scan" />
            </div>
            <div className="reactor-callout callout-a">
              <span>LOCAL BRIDGE</span>
              <strong>127.0.0.1:8787</strong>
            </div>
            <div className="reactor-callout callout-b">
              <span>DATA PATH</span>
              <strong>Browser to your laptop</strong>
            </div>
            <div className="reactor-callout callout-c">
              <span>MODE</span>
              <strong>{connectionStatus === "error" ? "Operator attention" : "Ready"}</strong>
            </div>
          </div>
        </motion.header>

        <HudPanel
          title="How J.A.R.V.I.S connects"
          eyebrow="First-Time Setup"
          className="stark-briefing"
          delay={0.02}
        >
          <div className="briefing-layout">
            <div className="briefing-primary">
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                J.A.R.V.I.S runs in your browser. To show real laptop details, it connects to a small
                Local Bridge that you run on your own computer. No one connects to Adriel's
                laptop. Your bridge runs locally on your device, and your data is not uploaded.
              </p>
              <div className="briefing-steps">
                {connectionSteps.map((step, index) => (
                  <div key={step.label} className="briefing-step">
                    <span className="step-number">{index + 1}</span>
                    <div>
                      <p>{step.label}</p>
                      <small>{step.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
              <p className="amber-note">
                Demo Mode works without the bridge. Real device mode requires your own Local Bridge
                running at http://127.0.0.1:8787.
              </p>
            </div>

            <div className="intel-panel intel-panel-green">
              <span className="micro-label">Capability Set</span>
              <h3>What works now</h3>
              <ul>
                {worksNow.map((item) => (
                  <li key={item}>
                    <span aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="intel-panel intel-panel-rose">
              <span className="micro-label">Privacy Boundary</span>
              <h3>What J.A.R.V.I.S does not do</h3>
              <ul>
                {doesNotDo.map((item) => (
                  <li key={item}>
                    <span aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </HudPanel>

        <div className="command-deck-grid">
          <HudPanel title="Manual Connection" eyebrow="Section 1" delay={0.05} className="command-panel">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onConnect();
              }}
            >
              <motion.div
                className="mx-auto max-w-xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.52, ease: "easeOut", delay: 0.12 }}
              >
                <label className="command-label" htmlFor="bridge-url">
                  Enter your Local Bridge URL
                </label>
                <div className="prompt-input-shell">
                  <span className="prompt-prefix" aria-hidden="true">
                    link://
                  </span>
                  <input
                    id="bridge-url"
                    className="input-hud"
                    value={bridgeUrl}
                    onChange={(event) => onBridgeUrlChange(event.target.value)}
                    placeholder="http://localhost:8787"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    disabled={isConnecting}
                  />
                  <span className="prompt-caret" aria-hidden="true" />
                </div>
              </motion.div>

              <p className="privacy-note">
                Your system details stay on your device. This website only reads data from the
                Local Bridge URL you provide.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button className="primary-button" type="submit" disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
                <button className="secondary-button" type="button" onClick={onDemoMode} disabled={isConnecting}>
                  Try Demo Mode
                </button>
              </div>

              {isConnecting && <LoadingScanner label="Verifying bridge..." progress={72} compact />}

              {errorMessage && (
                <p className="error-note" role="alert">
                  {errorMessage}
                </p>
              )}
            </form>
          </HudPanel>

          <BridgeFinder
            foundBridges={foundBridges}
            isFindingBridge={isFindingBridge}
            finderMessage={finderMessage}
            scanProgress={scanProgress}
            selectedSetupTab={selectedSetupTab}
            onFind={onFindBridge}
            onConnect={onConnect}
            onSelectSetupTab={onSelectSetupTab}
          />
        </div>
      </div>
    </main>
  );
}
