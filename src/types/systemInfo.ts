export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type SetupTab = "macos" | "windows";

export type BridgeStatus = {
  status?: string;
  [key: string]: unknown;
};

export type SystemInfo = {
  deviceName?: string;
  os?: string;
  cpu?: string;
  memory?: string;
  battery?: string;
  localTime?: string;
  status?: string;
};
