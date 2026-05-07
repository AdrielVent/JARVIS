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
      "Open the Local Bridge app on your Mac.",
      "Make sure it says \"Bridge Online.\"",
      "Look for a URL like: http://localhost:8787",
      "Copy that URL into J.A.R.V.I.S.",
      "Click Connect.",
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
      "Open the Local Bridge app on your Windows laptop.",
      "Make sure it says \"Bridge Online.\"",
      "Look for a URL like: http://localhost:8787",
      "Copy that URL into J.A.R.V.I.S.",
      "Click Connect.",
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
            <h4 className="font-semibold text-slate-50">Don&apos;t have the Local Bridge yet?</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button className="disabled-button" type="button" disabled>
                Download for macOS
                <span>Coming soon</span>
              </button>
              <button className="disabled-button" type="button" disabled>
                Download for Windows
                <span>Coming soon</span>
              </button>
            </div>
          </div>
        </div>
      </HudPanel>
    </div>
  );
}
