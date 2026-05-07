import type { BridgeStatus, SystemInfo } from "../types/systemInfo";

export const COMMON_BRIDGE_URLS = [
  "http://localhost:8787",
  "http://127.0.0.1:8787",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5050",
  "http://127.0.0.1:5050",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
] as const;

type BridgeUrlValidation =
  | { valid: true; url: string }
  | { valid: false; error: string };

export class BridgeHttpError extends Error {
  status: number;

  constructor(status: number, url: string) {
    super(`Bridge returned ${status} for ${url}`);
    this.name = "BridgeHttpError";
    this.status = status;
  }
}

export function validateBridgeUrl(url: string): BridgeUrlValidation {
  const candidate = url.trim();

  if (!candidate) {
    return { valid: false, error: "Please enter your Local Bridge URL." };
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "Enter a valid URL, for example: http://localhost:8787",
      };
    }

    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return { valid: true, url: `${parsed.origin}${path}` };
  } catch {
    return {
      valid: false,
      error: "Enter a valid URL, for example: http://localhost:8787",
    };
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new BridgeHttpError(response.status, url);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  const validation = validateBridgeUrl(baseUrl);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  return validation.url;
}

export async function getBridgeStatus(baseUrl: string, timeoutMs = 1800): Promise<BridgeStatus> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  return fetchJsonWithTimeout<BridgeStatus>(`${normalizedUrl}/status`, timeoutMs);
}

export async function getSystemInfo(baseUrl: string, timeoutMs = 2400): Promise<SystemInfo> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  return fetchJsonWithTimeout<SystemInfo>(`${normalizedUrl}/system-info`, timeoutMs);
}

export async function findLocalBridges(
  onProgress?: (checked: number, total: number, currentUrl: string) => void,
): Promise<string[]> {
  const foundBridges: string[] = [];

  for (const [index, url] of COMMON_BRIDGE_URLS.entries()) {
    try {
      const status = await getBridgeStatus(url, 1200);
      if (status.status === "online") {
        foundBridges.push(url);
      }
    } catch {
      // One offline localhost address should never stop the approved finder.
    } finally {
      onProgress?.(index + 1, COMMON_BRIDGE_URLS.length, url);
    }
  }

  return foundBridges;
}
