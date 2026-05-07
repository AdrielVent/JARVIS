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
    "Start the Local Bridge",
    "Enter or find the bridge URL",
    "Connect to view your dashboard",
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

  return (
    <main className="jarvis-screen min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <motion.header
          className="grid min-h-[32vh] place-items-center py-8 text-center sm:min-h-[38vh] sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="max-w-4xl">
            <div className="mx-auto mb-7 h-36 w-36 sm:h-44 sm:w-44" aria-hidden="true">
              <div className="mini-reactor">
                <span className="mini-ring mini-ring-a" />
                <span className="mini-ring mini-ring-b" />
                <span className="mini-core" />
              </div>
            </div>
            <p className="hud-eyebrow justify-center">Project J.A.R.V.I.S.</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-6xl">
              Connect Your Local Bridge
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-slate-300 sm:text-lg">
              Enter your bridge URL manually or use the helper to find it on this device.
            </p>
          </div>
        </motion.header>

        <HudPanel title="How J.A.R.V.I.S connects" eyebrow="First-Time Setup" delay={0.02}>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div className="space-y-5">
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                J.A.R.V.I.S runs in your browser. To show real laptop details, it connects to a
                small Local Bridge running on your own computer. Your data stays local and is not
                uploaded.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {connectionSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4"
                  >
                    <span className="step-number">{index + 1}</span>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{step}</p>
                  </div>
                ))}
              </div>
              <p className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-50">
                Demo Mode works without the bridge. Real device mode requires a Local Bridge URL,
                usually <code>http://127.0.0.1:8787</code>.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-4">
              <h3 className="font-semibold text-emerald-100">What works now</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {worksNow.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-lg bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-rose-300/20 bg-rose-300/5 p-4">
              <h3 className="font-semibold text-rose-100">What J.A.R.V.I.S does not do</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {doesNotDo.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-lg bg-rose-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </HudPanel>

        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <HudPanel title="Manual Connection" eyebrow="Section 1" delay={0.05}>
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
                <label className="block text-center text-sm font-medium text-cyan-100" htmlFor="bridge-url">
                  Enter your Local Bridge URL
                </label>
                <input
                  id="bridge-url"
                  className="input-hud mt-3 w-full text-center"
                  value={bridgeUrl}
                  onChange={(event) => onBridgeUrlChange(event.target.value)}
                  placeholder="http://localhost:8787"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  disabled={isConnecting}
                />
              </motion.div>

              <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm leading-6 text-slate-300">
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
                <p className="rounded-lg border border-rose-300/35 bg-rose-400/10 p-4 text-sm text-rose-100" role="alert">
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
