import { AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import BridgeConnect from "./components/BridgeConnect";
import JarvisIntro from "./components/JarvisIntro";
import SystemDashboard from "./components/SystemDashboard";
import {
  findLocalBridges,
  getBridgeStatus,
  getSystemInfo,
  validateBridgeUrl,
} from "./lib/bridgeClient";
import type { ConnectionStatus, SetupTab, SystemInfo } from "./types/systemInfo";

type AppStage = "connect" | "welcome" | "dashboard";

const EMPTY_URL_ERROR = "Please enter your Local Bridge URL.";
const INVALID_URL_ERROR = "Enter a valid URL, for example: http://localhost:8787";
const UNREACHABLE_ERROR =
  "Could not connect to your Local Bridge. Make sure it is running on this device.";
const SYSTEM_INFO_ERROR = "Connected to bridge, but system details could not be loaded.";
const CORS_ERROR = "Connection blocked. Enable CORS on your Local Bridge for this website.";
const NO_BRIDGE_FOUND =
  "No Local Bridge was found. Make sure the bridge app is running, then try again.";

function formatLocalTime() {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function formatConnectionTime() {
  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function statusErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return UNREACHABLE_ERROR;
  }
  return UNREACHABLE_ERROR;
}

function systemInfoErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return CORS_ERROR;
  }
  return SYSTEM_INFO_ERROR;
}

export default function App() {
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [foundBridges, setFoundBridges] = useState<string[]>([]);
  const [isFindingBridge, setIsFindingBridge] = useState(false);
  const [selectedSetupTab, setSelectedSetupTab] = useState<SetupTab>("macos");
  const [scanProgress, setScanProgress] = useState(0);
  const [finderMessage, setFinderMessage] = useState("");
  const [lastConnectionTime, setLastConnectionTime] = useState("");
  const [stage, setStage] = useState<AppStage>("connect");

  const connectToBridge = useCallback(
    async (urlOverride?: string) => {
      const candidate = (urlOverride ?? bridgeUrl).trim();
      setErrorMessage("");

      if (!candidate) {
        setConnectionStatus("error");
        setErrorMessage(EMPTY_URL_ERROR);
        return;
      }

      const validation = validateBridgeUrl(candidate);
      if (!validation.valid) {
        setConnectionStatus("error");
        setErrorMessage(validation.error || INVALID_URL_ERROR);
        return;
      }

      setBridgeUrl(validation.url);
      setConnectionStatus("connecting");
      setDemoMode(false);

      try {
        const status = await getBridgeStatus(validation.url);
        if (status.status !== "online") {
          throw new Error("Bridge status was not online.");
        }
      } catch (error) {
        setConnectionStatus("error");
        setErrorMessage(statusErrorMessage(error));
        return;
      }

      try {
        const nextSystemInfo = await getSystemInfo(validation.url);
        setSystemInfo({
          ...nextSystemInfo,
          deviceName: nextSystemInfo.deviceName?.trim() || "Operator",
          status: nextSystemInfo.status || "online",
        });
        setLastConnectionTime(formatConnectionTime());
        setConnectionStatus("connected");
        setStage("welcome");
      } catch (error) {
        setConnectionStatus("error");
        setErrorMessage(systemInfoErrorMessage(error));
      }
    },
    [bridgeUrl],
  );

  const findBridge = useCallback(async () => {
    setIsFindingBridge(true);
    setScanProgress(0);
    setFinderMessage("");
    setFoundBridges([]);

    const found = await findLocalBridges((checked, total) => {
      setScanProgress(Math.round((checked / total) * 100));
    });

    setFoundBridges(found);
    setIsFindingBridge(false);
    if (found.length === 0) {
      setFinderMessage(NO_BRIDGE_FOUND);
    }
  }, []);

  const tryDemoMode = useCallback(() => {
    setErrorMessage("");
    setConnectionStatus("connected");
    setDemoMode(true);
    setSystemInfo({
      deviceName: "Demo-Workstation",
      os: "J.A.R.V.I.S Demo OS",
      cpu: "Arc Reactor Core",
      memory: "32 GB",
      battery: "100%",
      localTime: formatLocalTime(),
      status: "online",
    });
    setLastConnectionTime(formatConnectionTime());
    setStage("welcome");
  }, []);

  const resetConnection = useCallback(() => {
    setStage("connect");
    setConnectionStatus("idle");
    setErrorMessage("");
  }, []);

  const showDashboard = useCallback(() => {
    setStage("dashboard");
  }, []);

  return (
    <AnimatePresence mode="wait">
      {stage === "connect" && (
        <BridgeConnect
          key="connect"
          bridgeUrl={bridgeUrl}
          connectionStatus={connectionStatus}
          errorMessage={errorMessage}
          foundBridges={foundBridges}
          isFindingBridge={isFindingBridge}
          finderMessage={finderMessage}
          scanProgress={scanProgress}
          selectedSetupTab={selectedSetupTab}
          onBridgeUrlChange={setBridgeUrl}
          onConnect={connectToBridge}
          onFindBridge={findBridge}
          onSelectSetupTab={setSelectedSetupTab}
          onDemoMode={tryDemoMode}
        />
      )}

      {stage === "welcome" && systemInfo && (
        <JarvisIntro
          key="welcome"
          systemInfo={systemInfo}
          demoMode={demoMode}
          onComplete={showDashboard}
        />
      )}

      {stage === "dashboard" && systemInfo && (
        <SystemDashboard
          key="dashboard"
          systemInfo={systemInfo}
          lastConnectionTime={lastConnectionTime}
          demoMode={demoMode}
          onReconnect={resetConnection}
        />
      )}
    </AnimatePresence>
  );
}
