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


ROOT = Path(__file__).resolve().parents[1]
VERSION = "0.1.0"


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
    return {"raw": output[:240]}


def system_snapshot() -> dict[str, Any]:
    disk = shutil.disk_usage(Path.home())
    load_average = None
    if hasattr(os, "getloadavg"):
        try:
            load_average = [round(value, 2) for value in os.getloadavg()]
        except OSError:
            load_average = None

    return {
        "ok": True,
        "bridge": {
            "name": "Project J.A.R.V.I.S. Local Bridge",
            "version": VERSION,
            "bound_to": "127.0.0.1",
            "read_only": True,
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
            "execute_commands": False,
            "read_files": False,
            "write_files": False,
            "network_scan": False,
        },
        "timestamp": time.time(),
    }


class JarvisBridgeHandler(SimpleHTTPRequestHandler):
    server_version = "JarvisLocalBridge/0.1"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self._write_json(
                {
                    "ok": True,
                    "name": "Project J.A.R.V.I.S. Local Bridge",
                    "version": VERSION,
                    "read_only": True,
                }
            )
            return
        if path == "/api/system":
            self._write_json(system_snapshot())
            return
        if path.startswith("/api/"):
            self._write_json({"ok": False, "error": "unknown endpoint"}, HTTPStatus.NOT_FOUND)
            return
        super().do_GET()

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
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--self-test", action="store_true", help="Print a system snapshot and exit.")
    args = parser.parse_args()

    if args.self_test:
        print(json.dumps(system_snapshot(), indent=2))
        return 0

    if args.host not in {"127.0.0.1", "localhost"}:
        raise SystemExit("Refusing to bind outside localhost. Use a reverse proxy only if you know the risk.")

    server = build_server(args.host, args.port)
    print(f"Project J.A.R.V.I.S. local bridge running at http://{args.host}:{args.port}")
    print("Open that URL in this laptop's browser. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local bridge.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
