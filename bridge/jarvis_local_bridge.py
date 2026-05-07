from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import socket
import subprocess
import time
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


BRIDGE_FILE = Path(__file__).resolve()
ROOT = BRIDGE_FILE.parents[1] if BRIDGE_FILE.parent.name == "bridge" else BRIDGE_FILE.parent
VERSION = "0.2.0"
ALLOWED_CORS_ORIGINS = {
    "null",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8787",
    "http://127.0.0.1:8787",
    "https://adrielvent.github.io",
    "https://adrielvent.github.io/JARVIS/",
}


def _round_gb(value: int) -> float:
    return round(value / (1024**3), 1)


def _read_macos_battery() -> dict[str, Any] | None:
    if platform.system() != "Darwin":
        return None
    try:
        result = subprocess.run(
            ["pmset", "-g", "batt"],
            capture_output=True,
            check=False,
            text=True,
            timeout=1.5,
        )
    except (OSError, subprocess.SubprocessError):
        return None

    output = " ".join(result.stdout.split())
    if not output:
        return None
    percent = None
    for part in output.split():
        if part.endswith("%;"):
            try:
                percent = int(part.removesuffix("%;"))
            except ValueError:
                percent = None
            break
    return {"percent": percent, "raw": output[:240]}


def _run_short_command(command: list[str], timeout: float = 1.2) -> str | None:
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            check=False,
            text=True,
            timeout=timeout,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = result.stdout.strip()
    return value or None


def _read_total_memory() -> str:
    if platform.system() == "Darwin":
        raw = _run_short_command(["sysctl", "-n", "hw.memsize"])
        if raw and raw.isdigit():
            return f"{round(int(raw) / (1024**3))} GB"

    if hasattr(os, "sysconf"):
        try:
            pages = os.sysconf("SC_PHYS_PAGES")
            page_size = os.sysconf("SC_PAGE_SIZE")
            if isinstance(pages, int) and isinstance(page_size, int):
                return f"{round((pages * page_size) / (1024**3))} GB"
        except (OSError, ValueError):
            pass

    return "Unknown"


def _cpu_label() -> str:
    if platform.system() == "Darwin":
        brand = _run_short_command(["sysctl", "-n", "machdep.cpu.brand_string"])
        if brand:
            return brand

    architecture = platform.machine() or "CPU"
    cpu_count = os.cpu_count() or 1
    return f"{architecture} ({cpu_count} cores)"


def _os_label() -> str:
    system_name = platform.system()
    if system_name == "Darwin":
        version = platform.mac_ver()[0] or platform.release()
        return f"macOS {version}"
    if system_name == "Windows":
        return f"Windows {platform.release()}"
    return f"{system_name} {platform.release()}".strip()


def jarvis_system_info() -> dict[str, str]:
    battery = _read_macos_battery()
    battery_text = "Unknown"
    if isinstance(battery, dict) and battery.get("percent") is not None:
        battery_text = f"{battery['percent']}%"

    return {
        "deviceName": socket.gethostname() or "Operator",
        "os": _os_label(),
        "cpu": _cpu_label(),
        "memory": _read_total_memory(),
        "battery": battery_text,
        "localTime": time.strftime("%I:%M %p").lstrip("0"),
        "status": "online",
    }


def system_snapshot() -> dict[str, Any]:
    disk = shutil.disk_usage(Path.home())
    load_average = None
    if hasattr(os, "getloadavg"):
        try:
            load_average = [round(value, 2) for value in os.getloadavg()]
        except OSError:
            load_average = None

    snapshot = {
        "ok": True,
        "bridge": {
            "name": "Project J.A.R.V.I.S. Local Bridge",
            "version": VERSION,
            "bound_to": "127.0.0.1",
            "read_only": False,
            "action_policy": "allowlisted_safe_actions_only",
        },
        "device": {
            "hostname": socket.gethostname(),
            "os": platform.system(),
            "os_release": platform.release(),
            "architecture": platform.machine(),
            "cpu_count": os.cpu_count() or 1,
            "load_average": load_average,
        },
        "disk": {
            "label": "home volume",
            "total_gb": _round_gb(disk.total),
            "free_gb": _round_gb(disk.free),
            "used_percent": round(((disk.total - disk.free) / disk.total) * 100, 1),
        },
        "battery": _read_macos_battery(),
        "capabilities": {
            "read_system_status": True,
            "open_project_folder": True,
            "copy_status_summary": True,
            "execute_commands": False,
            "read_files": False,
            "write_files": False,
            "network_scan": False,
        },
        "timestamp": time.time(),
    }
    snapshot["diagnostics"] = diagnostics_for(snapshot)
    return snapshot


def diagnostics_for(snapshot: dict[str, Any]) -> dict[str, Any]:
    warnings: list[str] = []
    disk = snapshot["disk"]
    device = snapshot["device"]
    battery = snapshot.get("battery")

    if disk["free_gb"] < 20:
        warnings.append(f"Low disk headroom: {disk['free_gb']} GB free.")
    elif disk["used_percent"] >= 90:
        warnings.append(f"Disk is {disk['used_percent']}% full.")

    load_average = device.get("load_average")
    cpu_count = device.get("cpu_count") or 1
    if load_average and load_average[0] > cpu_count * 1.25:
        warnings.append(f"High short-term CPU load: {load_average[0]} across {cpu_count} cores.")

    if isinstance(battery, dict) and battery.get("percent") is not None and battery["percent"] < 20:
        warnings.append(f"Battery is low: {battery['percent']}%.")

    return {
        "status": "attention" if warnings else "nominal",
        "warnings": warnings,
        "summary": "Needs attention." if warnings else "Laptop looks nominal from read-only checks.",
    }


def status_summary(snapshot: dict[str, Any]) -> str:
    device = snapshot["device"]
    disk = snapshot["disk"]
    diagnostics = snapshot["diagnostics"]
    lines = [
        "Project J.A.R.V.I.S. laptop summary",
        f"Device: {device['hostname']}",
        f"OS: {device['os']} {device['os_release']} ({device['architecture']})",
        f"CPU: {device['cpu_count']} cores",
        f"Disk: {disk['free_gb']} GB free of {disk['total_gb']} GB ({disk['used_percent']}% used)",
        f"Health: {diagnostics['summary']}",
    ]
    if diagnostics["warnings"]:
        lines.append("Warnings:")
        lines.extend(f"- {warning}" for warning in diagnostics["warnings"])
    return "\n".join(lines)


def copy_to_clipboard(text: str) -> None:
    if platform.system() != "Darwin":
        raise RuntimeError("Clipboard action currently supports macOS only.")
    subprocess.run(["pbcopy"], input=text, text=True, check=True, timeout=2)


def open_project_folder() -> None:
    if platform.system() != "Darwin":
        raise RuntimeError("Open project folder action currently supports macOS only.")
    subprocess.run(["open", str(ROOT)], check=True, timeout=2)


def safe_action(action: str) -> dict[str, Any]:
    snapshot = system_snapshot()
    if action == "copy-summary":
        summary = status_summary(snapshot)
        copy_to_clipboard(summary)
        return {"ok": True, "action": action, "message": "Copied laptop summary to clipboard.", "summary": summary}
    if action == "open-project":
        open_project_folder()
        return {"ok": True, "action": action, "message": f"Opened project folder: {ROOT}"}
    if action == "refresh":
        return {"ok": True, "action": action, "message": "Refreshed laptop diagnostics.", "snapshot": snapshot}
    return {"ok": False, "action": action, "error": "Action is not allowlisted."}


class JarvisBridgeHandler(SimpleHTTPRequestHandler):
    server_version = "JarvisLocalBridge/0.2"

    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_CORS_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/status":
            self._write_json({"status": "online"})
            return
        if path == "/system-info":
            self._write_json(jarvis_system_info())
            return
        if path == "/api/health":
            self._write_json(
                {
                    "ok": True,
                    "name": "Project J.A.R.V.I.S. Local Bridge",
                    "version": VERSION,
                    "read_only": False,
                    "action_policy": "allowlisted_safe_actions_only",
                }
            )
            return
        if path == "/api/system":
            self._write_json(system_snapshot())
            return
        if path == "/api/diagnostics":
            snapshot = system_snapshot()
            self._write_json(
                {
                    "ok": True,
                    "snapshot": snapshot,
                    "diagnostics": snapshot["diagnostics"],
                    "summary": status_summary(snapshot),
                }
            )
            return
        if path.startswith("/api/"):
            self._write_json({"ok": False, "error": "unknown endpoint"}, HTTPStatus.NOT_FOUND)
            return
        if path == "/":
            self._write_json(
                {
                    "status": "online",
                    "name": "Project J.A.R.V.I.S. Local Bridge",
                    "bridgeUrl": "http://127.0.0.1:8787",
                    "message": "Return to the J.A.R.V.I.S. website and connect to this local bridge.",
                }
            )
            return
        self._write_json({"ok": False, "error": "unknown endpoint"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path.startswith("/api/actions/"):
            action = path.rsplit("/", 1)[-1]
            try:
                result = safe_action(action)
            except Exception as exc:
                result = {
                    "ok": False,
                    "action": action,
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                }
            status = HTTPStatus.OK if result.get("ok") else HTTPStatus.BAD_REQUEST
            self._write_json(result, status)
            return
        self._write_json({"ok": False, "error": "unknown endpoint"}, HTTPStatus.NOT_FOUND)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[jarvis-bridge] {self.address_string()} - {format % args}")

    def _write_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def build_server(host: str, port: int) -> ThreadingHTTPServer:
    handler = partial(JarvisBridgeHandler, directory=str(ROOT))
    return ThreadingHTTPServer((host, port), handler)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Project J.A.R.V.I.S. local laptop bridge.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--self-test", action="store_true", help="Print a system snapshot and exit.")
    args = parser.parse_args()

    if args.self_test:
        snapshot = system_snapshot()
        print(json.dumps({"snapshot": snapshot, "summary": status_summary(snapshot)}, indent=2))
        return 0

    if args.host not in {"127.0.0.1", "localhost"}:
        raise SystemExit("Refusing to bind outside localhost. Use a reverse proxy only if you know the risk.")

    server = build_server(args.host, args.port)
    print(f"Project J.A.R.V.I.S. local bridge running at http://{args.host}:{args.port}")
    print("Use that Local Bridge URL in the J.A.R.V.I.S. web app. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local bridge.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
