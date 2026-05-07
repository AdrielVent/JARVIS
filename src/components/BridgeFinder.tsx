import { AnimatePresence, motion } from "framer-motion";
import type { SetupTab } from "../types/systemInfo";
import HudPanel from "./HudPanel";
import LoadingScanner from "./LoadingScanner";

type BridgeFinderProps = {
  foundBridges: string[];
  isFindingBridge: boolean;
  finderMessage: string;
  scanProgress: number;
  selectedSetupTab: SetupTab;
  onFind: () => void;
  onConnect: (url: string) => void;
  onSelectSetupTab: (tab: SetupTab) => void;
};

const setupCopy = {
  macos: {
    title: "MacBook / macOS Setup",
    steps: [
      "Download the Local Bridge for macOS.",
      "Unzip it.",
      "Double-click start-jarvis-bridge.command.",
      "If macOS blocks it, right-click and choose Open.",
      "Keep the Terminal window open.",
      "Return to J.A.R.V.I.S and click Find My Bridge.",
      "Connect to http://127.0.0.1:8787.",
    ],
    troubleshooting: [
      "If macOS asks for network permission, click Allow.",
      "If the bridge does not open, check System Settings > Privacy & Security.",
      "Make sure the bridge app is running before connecting.",
      "Try both: http://localhost:8787 and http://127.0.0.1:8787",
    ],
  },
  windows: {
    title: "Windows Laptop Setup",
    steps: [
      "Download the Local Bridge for Windows.",
      "Unzip it.",
      "Double-click start-jarvis-bridge.bat.",
      "If Windows Firewall asks, click Allow Access.",
      "Keep the Command Prompt window open.",
      "Return to J.A.R.V.I.S and click Find My Bridge.",
      "Connect to http://127.0.0.1:8787.",
    ],
    troubleshooting: [
      "If Windows Firewall asks for permission, click Allow Access.",
      "Make sure the bridge app is still running.",
      "Try both: http://localhost:8787 and http://127.0.0.1:8787",
      "If the bridge is blocked, allow it through Windows Defender Firewall.",
      "Restart the bridge app and click \"Find My Bridge\" again.",
    ],
  },
};

const quickStartCommands = {
  unix: ["cd project-folder", "python3 bridge/jarvis_local_bridge.py"],
  windows: ["cd project-folder", "python bridge/jarvis_local_bridge.py"],
};

export default function BridgeFinder({
  foundBridges,
  isFindingBridge,
  finderMessage,
  scanProgress,
  selectedSetupTab,
  onFind,
  onConnect,
  onSelectSetupTab,
}: BridgeFinderProps) {
  const selectedCopy = setupCopy[selectedSetupTab];
  const baseUrl = import.meta.env.BASE_URL;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const macDownloadUrl = `${normalizedBaseUrl}downloads/JARVIS-Local-Bridge-macOS.zip`;
  const windowsDownloadUrl = `${normalizedBaseUrl}downloads/JARVIS-Local-Bridge-Windows.zip`;

  return (
    <div className="grid gap-5">
      <HudPanel title="Find My Bridge" eyebrow="Section 2" delay={0.12}>
        <div className="space-y-5">
          <p className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm leading-6 text-slate-300">
            We will only check common localhost bridge addresses on your own device. We will not
            scan your network or upload anything.
          </p>

          <button
            className="scan-button w-full"
            type="button"
            onClick={onFind}
            disabled={isFindingBridge}
          >
            <span aria-hidden="true" className="scan-button-light" />
            {isFindingBridge ? "Scanning localhost..." : "Find My Bridge"}
          </button>

          <AnimatePresence mode="wait">
            {isFindingBridge && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LoadingScanner label="Scanning localhost..." progress={scanProgress} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3" aria-live="polite">
            {foundBridges.map((url) => (
              <motion.div
                key={url}
                className="found-bridge flex flex-col gap-3 rounded-lg border border-emerald-300/40 bg-emerald-300/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <span className="text-sm text-emerald-100">Bridge found at: {url}</span>
                <button className="secondary-button" type="button" onClick={() => onConnect(url)}>
                  Connect
                </button>
              </motion.div>
            ))}
            {finderMessage && !isFindingBridge && foundBridges.length === 0 && (
              <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
                {finderMessage}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-500/20 bg-white/[0.03] p-4 text-sm text-slate-300">
            Manual entry fallback: if the helper does not find your bridge, copy its URL from the
            Local Bridge app and enter it in Manual Connection.
          </div>
        </div>
      </HudPanel>

      <HudPanel title="Setup Help" eyebrow="Section 3" delay={0.18}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-cyan-300/20 bg-cyan-950/30 p-1">
            <button
              className={`setup-tab ${selectedSetupTab === "macos" ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectSetupTab("macos")}
            >
              macOS
            </button>
            <button
              className={`setup-tab ${selectedSetupTab === "windows" ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectSetupTab("windows")}
            >
              Windows
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-50">{selectedCopy.title}</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {selectedCopy.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="step-number">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-4">
            <h4 className="font-semibold text-amber-100">Troubleshooting</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {selectedCopy.troubleshooting.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-lg bg-amber-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-white/[0.03] p-4">
            <h4 className="font-semibold text-slate-50">Don't have the Local Bridge yet?</h4>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Download it for your computer, run it locally, then come back here and connect. The
              bridge runs only on your own laptop.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a className="primary-button text-center" href={macDownloadUrl} download>
                Download for macOS
              </a>
              <a className="secondary-button text-center" href={windowsDownloadUrl} download>
                Download for Windows
              </a>
            </div>
          </div>

          <details className="rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm text-slate-300">
            <summary className="cursor-pointer font-semibold text-cyan-100">
              Advanced / Developer setup
            </summary>
            <div className="mt-4 grid gap-4">
              <div>
                <h4 className="font-semibold text-slate-50">macOS/Linux</h4>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-cyan-300/20 bg-slate-950/70 p-3 text-xs leading-6 text-cyan-50">
                  <code>{quickStartCommands.unix.join("\n")}</code>
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-slate-50">Windows</h4>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-cyan-300/20 bg-slate-950/70 p-3 text-xs leading-6 text-cyan-50">
                  <code>{quickStartCommands.windows.join("\n")}</code>
                </pre>
              </div>
              <p className="leading-6">
                Then open the website and connect with:{" "}
                <code>http://127.0.0.1:8787</code>
              </p>
            </div>
          </details>
        </div>
      </HudPanel>
    </div>
  );
}
