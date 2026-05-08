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
      "For the Java bridge, double-click start-jarvis-bridge-java.command instead.",
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
      "Double-click start-jarvis-bridge-powershell.bat for the native Windows PowerShell bridge.",
      "Or double-click start-jarvis-bridge.bat for Python, or start-jarvis-bridge-java.bat for Java.",
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
  powershell: ["cd project-folder", "powershell -NoProfile -File bridge/jarvis_local_bridge.ps1"],
  java: ["cd project-folder", "java bridge/JarvisLocalBridge.java"],
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
  const powershellDownloadUrl = `${normalizedBaseUrl}downloads/JARVIS-Local-Bridge-Windows-PowerShell.zip`;
  const javaDownloadUrl = `${normalizedBaseUrl}downloads/JARVIS-Local-Bridge-Java.zip`;

  return (
    <div className="finder-stack">
      <HudPanel title="Find My Bridge" eyebrow="Section 2" delay={0.12} className="finder-panel">
        <div className="finder-layout">
          <div className="finder-radar" aria-hidden="true">
            <span className="radar-ring radar-ring-a" />
            <span className="radar-ring radar-ring-b" />
            <span className="radar-ring radar-ring-c" />
            <span className="radar-beam" />
            <span className="radar-center" />
            <span className="radar-ping ping-a" />
            <span className="radar-ping ping-b" />
          </div>

          <div className="space-y-5">
            <p className="privacy-note">
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
                  className="found-bridge signal-lock-row"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div>
                    <span className="micro-label">Signal acquired</span>
                    <p>Bridge found at: {url}</p>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => onConnect(url)}>
                    Connect
                  </button>
                </motion.div>
              ))}
              {finderMessage && !isFindingBridge && foundBridges.length === 0 && (
                <p className="amber-note">{finderMessage}</p>
              )}
            </div>

            <div className="fallback-note">
              Manual entry fallback: if the helper does not find your bridge, copy its URL from the
              Local Bridge app and enter it in Manual Connection.
            </div>
          </div>
        </div>
      </HudPanel>

      <HudPanel title="Setup Help" eyebrow="Section 3" delay={0.18} className="setup-panel">
        <div className="space-y-5">
          <div className="download-section">
            <div>
              <span className="micro-label">Local Bridge Package</span>
              <h4>Don't have the Local Bridge yet?</h4>
              <p>
                Download it for your computer, run it locally, then come back here and connect. The
                bridge runs only on your own laptop.
              </p>
            </div>
            <div className="download-grid">
              <a className="download-tile download-tile-mac" href={macDownloadUrl} download>
                <span className="download-os">macOS</span>
                <strong>Download for macOS</strong>
                <small>Native .command launcher plus Python and Java bridge options</small>
                <code>http://127.0.0.1:8787</code>
                <em>Secure localhost bridge</em>
              </a>
              <a className="download-tile download-tile-windows" href={windowsDownloadUrl} download>
                <span className="download-os">Windows</span>
                <strong>Download for Windows</strong>
                <small>Includes native PowerShell, Python, and Java bridge launchers</small>
                <code>http://127.0.0.1:8787</code>
                <em>Secure localhost bridge</em>
              </a>
              <a className="download-tile download-tile-windows" href={powershellDownloadUrl} download>
                <span className="download-os">PowerShell</span>
                <strong>Download Windows PowerShell Bridge</strong>
                <small>No Python required. Runs locally on your Windows laptop.</small>
                <code>http://127.0.0.1:8787</code>
                <em>Read-only localhost bridge</em>
              </a>
              <a className="download-tile download-tile-java" href={javaDownloadUrl} download>
                <span className="download-os">Java</span>
                <strong>Download Java Bridge</strong>
                <small>Cross-platform option for macOS and Windows with Java 11+</small>
                <code>http://127.0.0.1:8787</code>
                <em>Secure localhost bridge</em>
              </a>
            </div>
          </div>

          <div className="setup-tabs">
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

          <div className="setup-brief">
            <h3>{selectedCopy.title}</h3>
            <ol>
              {selectedCopy.steps.map((step, index) => (
                <li key={step}>
                  <span className="step-number">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="troubleshooting-panel">
            <h4>Troubleshooting</h4>
            <ul>
              {selectedCopy.troubleshooting.map((item) => (
                <li key={item}>
                  <span aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <details className="developer-setup">
            <summary>Advanced / Developer setup</summary>
            <div className="mt-4 grid gap-4">
              <div>
                <h4>macOS/Linux</h4>
                <pre>
                  <code>{quickStartCommands.unix.join("\n")}</code>
                </pre>
              </div>
              <div>
                <h4>Windows</h4>
                <pre>
                  <code>{quickStartCommands.windows.join("\n")}</code>
                </pre>
              </div>
              <div>
                <h4>Windows PowerShell</h4>
                <pre>
                  <code>{quickStartCommands.powershell.join("\n")}</code>
                </pre>
              </div>
              <div>
                <h4>Java</h4>
                <pre>
                  <code>{quickStartCommands.java.join("\n")}</code>
                </pre>
              </div>
              <p>
                Then open the website and connect with: <code>http://127.0.0.1:8787</code>
              </p>
            </div>
          </details>
        </div>
      </HudPanel>
    </div>
  );
}
