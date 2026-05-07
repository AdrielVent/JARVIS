from __future__ import annotations

import ast
import json
import re
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    ROOT / "index.html",
    ROOT / "package.json",
    ROOT / "vite.config.ts",
    ROOT / ".github" / "workflows" / "deploy.yml",
    ROOT / "tailwind.config.ts",
    ROOT / "src" / "main.tsx",
    ROOT / "src" / "App.tsx",
    ROOT / "src" / "index.css",
    ROOT / "src" / "components" / "BridgeConnect.tsx",
    ROOT / "src" / "components" / "BridgeFinder.tsx",
    ROOT / "src" / "components" / "JarvisIntro.tsx",
    ROOT / "src" / "components" / "SystemDashboard.tsx",
    ROOT / "src" / "components" / "HudPanel.tsx",
    ROOT / "src" / "components" / "LoadingScanner.tsx",
    ROOT / "src" / "lib" / "bridgeClient.ts",
    ROOT / "src" / "types" / "systemInfo.ts",
    ROOT / "bridge" / "jarvis_local_bridge.py",
    ROOT / "scripts" / "build_bridge_downloads.py",
    ROOT / "public" / "downloads" / "JARVIS-Local-Bridge-macOS.zip",
    ROOT / "public" / "downloads" / "JARVIS-Local-Bridge-Windows.zip",
    ROOT / "README.md",
]

APP_STRINGS = [
    "Connect Your Local Bridge",
    "Enter your bridge URL manually or use the helper to find it on this device.",
    "Manual Connection",
    "Find My Bridge",
    "Setup Help",
    "Enter your Local Bridge URL",
    "http://localhost:8787",
    "Your system details stay on your device. This website only reads data from the Local Bridge URL you provide.",
    "Welcome to J.A.R.V.I.S",
    "Try Demo Mode",
    "How J.A.R.V.I.S connects",
    "J.A.R.V.I.S runs in your browser. To show real laptop details, it connects to a small Local Bridge that you run on your own computer. No one connects to Adriel's laptop. Your bridge runs locally on your device, and your data is not uploaded.",
    "Download and start your Local Bridge",
    "Find or enter your bridge URL",
    "Connect to view your own dashboard",
    "Demo Mode works without the bridge.",
    "Real device mode requires your own Local Bridge running at http://127.0.0.1:8787.",
    "What works now",
    "Real device name",
    "Operating system",
    "Memory",
    "What J.A.R.V.I.S does not do",
    "Does not read files",
    "Does not run hidden commands",
    "Does not scan your network",
    "Does not upload device data",
    "Does not control your laptop without explicit future bridge endpoints",
    "Download for macOS",
    "Download for Windows",
    "JARVIS-Local-Bridge-macOS.zip",
    "JARVIS-Local-Bridge-Windows.zip",
    "Don't have the Local Bridge yet?",
    "Download it for your computer, run it locally, then come back here and connect. The bridge runs only on your own laptop.",
    "your own Local Bridge",
    "Advanced / Developer setup",
    "python3 bridge/jarvis_local_bridge.py",
    "python bridge/jarvis_local_bridge.py",
]

ERROR_STRINGS = [
    "Please enter your Local Bridge URL.",
    "Enter a valid URL, for example: http://localhost:8787",
    "Could not connect to your Local Bridge. Make sure it is running on this device.",
    "Connected to bridge, but system details could not be loaded.",
    "Connection blocked. Enable CORS on your Local Bridge for this website.",
    "No Local Bridge was found. Make sure the bridge app is running, then try again.",
]

APPROVED_URLS = [
    "http://localhost:8787",
    "http://127.0.0.1:8787",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5050",
    "http://127.0.0.1:5050",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_files() -> None:
    for path in REQUIRED_FILES:
        require(path.exists(), f"Missing required file: {path.relative_to(ROOT)}")


def validate_package() -> None:
    package = json.loads(read(ROOT / "package.json"))
    require(package["scripts"]["dev"] == "vite", "npm run dev must start Vite.")
    require(
        package["scripts"]["build:bridges"] == "python3 scripts/build_bridge_downloads.py",
        "npm run build:bridges must generate bridge downloads.",
    )
    require(
        package["scripts"]["build"] == "npm run build:bridges && vite build",
        "npm run build must generate bridge downloads before building Vite.",
    )
    require(package["scripts"]["typecheck"] == "tsc --noEmit", "npm run typecheck must run TypeScript.")
    dependencies = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
    for dependency in ["react", "react-dom", "vite", "typescript", "tailwindcss", "framer-motion"]:
        require(dependency in dependencies, f"Missing package dependency: {dependency}")


def validate_vite_pages_config() -> None:
    vite_config = read(ROOT / "vite.config.ts")
    require('base: "/JARVIS/"' in vite_config, 'Vite config must use base: "/JARVIS/".')
    require('base: "/"' not in vite_config, 'Vite config must not use base: "/".')


def validate_pages_workflow() -> None:
    workflow = read(ROOT / ".github" / "workflows" / "deploy.yml")
    for token in [
        "actions/checkout@",
        "actions/setup-node@",
        "actions/configure-pages@",
        "actions/upload-pages-artifact@",
        "actions/deploy-pages@",
        "contents: read",
        "pages: write",
        "id-token: write",
        "github-pages",
        "path: ./dist",
        "npm install",
        "npm run typecheck",
        "npm run build",
    ]:
        require(token in workflow, f"Deploy workflow missing required token: {token}")


def validate_app_copy() -> None:
    combined = "\n".join(
        read(path)
        for path in [
            ROOT / "src" / "App.tsx",
            ROOT / "src" / "components" / "BridgeConnect.tsx",
            ROOT / "src" / "components" / "BridgeFinder.tsx",
            ROOT / "src" / "components" / "JarvisIntro.tsx",
            ROOT / "src" / "components" / "SystemDashboard.tsx",
        ]
    )
    flattened = " ".join(combined.split())
    for token in APP_STRINGS + ERROR_STRINGS:
        require(" ".join(token.split()) in flattened, f"App copy missing required text: {token}")
    require("Local Bride Finder" not in combined, "Feature must not be called Local Bride Finder.")
    require("Adriel-MacBook-Pro" not in combined, "Do not hardcode private example device names.")


def validate_bridge_client() -> None:
    bridge_client = read(ROOT / "src" / "lib" / "bridgeClient.ts")
    require("AbortController" in bridge_client, "Bridge client must use AbortController timeouts.")
    require("timeoutMs = 1200" in bridge_client or "1200" in bridge_client, "Finder timeout must be 1200ms.")
    require("`${normalizedUrl}/status`" in bridge_client, "Status endpoint must be /status.")
    require("`${normalizedUrl}/system-info`" in bridge_client, "System info endpoint must be /system-info.")

    match = re.search(r"COMMON_BRIDGE_URLS\s*=\s*\[(.*?)\]\s*as const", bridge_client, re.S)
    require(match is not None, "COMMON_BRIDGE_URLS constant is required.")
    parsed_urls = ast.literal_eval("[" + match.group(1).replace(" as const", "") + "]")
    require(parsed_urls == APPROVED_URLS, "Finder URL list must exactly match approved localhost URLs.")
    require("192.168." not in bridge_client, "Finder must not scan LAN IPs.")
    require("window.location.hostname" not in bridge_client, "Finder must not infer private host details.")


def validate_security_boundaries() -> None:
    app = read(ROOT / "src" / "App.tsx")
    bridge_finder = read(ROOT / "src" / "components" / "BridgeFinder.tsx")
    bridge_client = read(ROOT / "src" / "lib" / "bridgeClient.ts")
    require("findLocalBridges(" in app, "App must expose Local Bridge Finder click flow.")
    require("onFindBridge={findBridge}" in app, "Finder must be wired to explicit user action.")
    require("useEffect" not in app, "App should not auto-scan or auto-connect on page load.")
    require("We will only check common localhost bridge addresses" in bridge_finder, "Finder needs pre-scan privacy note.")
    require("fetch(" in bridge_client, "Bridge client should call the user-provided Local Bridge only.")
    require(not re.search(r"\beval\s*\(", bridge_client), "Bridge client must not use eval.")


def validate_bridge_downloads() -> None:
    expected = {
        ROOT / "public" / "downloads" / "JARVIS-Local-Bridge-macOS.zip": {
            "jarvis_local_bridge.py",
            "start-jarvis-bridge.command",
            "README-macOS.txt",
        },
        ROOT / "public" / "downloads" / "JARVIS-Local-Bridge-Windows.zip": {
            "jarvis_local_bridge.py",
            "start-jarvis-bridge.bat",
            "README-Windows.txt",
        },
    }
    for path, expected_names in expected.items():
        require(path.exists(), f"Missing bridge download: {path.relative_to(ROOT)}")
        with zipfile.ZipFile(path) as archive:
            names = set(archive.namelist())
            require(names == expected_names, f"Unexpected ZIP contents for {path.name}: {sorted(names)}")
            for name in expected_names:
                content = archive.read(name).decode("utf-8")
                require("http://127.0.0.1:8787" in content, f"{name} must mention the local bridge URL.")


def validate_css() -> None:
    css = read(ROOT / "src" / "index.css")
    for token in [
        "prefers-reduced-motion",
        "--stark-cyan",
        "--glass-fill",
        ".glass-panel",
        ".stark-hero",
        ".stark-reactor",
        ".scan-button",
        ".found-bridge",
        ".intro-reactor",
        ".finder-radar",
        ".download-tile",
        ".dashboard-workspace",
        ".system-core-module",
        ".telemetry-module",
    ]:
        require(token in css, f"CSS missing required token: {token}")
    require("letter-spacing: -" not in css, "Negative letter spacing is not allowed.")


def validate_python_bridge() -> None:
    bridge = read(ROOT / "bridge" / "jarvis_local_bridge.py")
    for token in [
        'path == "/status"',
        'path == "/system-info"',
        '"deviceName"',
        '"status": "online"',
        "ALLOWED_CORS_ORIGINS",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "https://adrielvent.github.io",
        "Refusing to bind outside localhost",
        "default=8787",
    ]:
        require(token in bridge, f"Bridge missing required token: {token}")
    require('"*"' not in bridge, "Bridge CORS must not use a wildcard origin.")
    require("super().do_GET()" not in bridge, "Bridge must not serve arbitrary local files.")
    require("execute_commands" in bridge and "False" in bridge, "Bridge must keep command execution disabled.")


def main() -> int:
    checks = [
        validate_files,
        validate_package,
        validate_vite_pages_config,
        validate_pages_workflow,
        validate_app_copy,
        validate_bridge_client,
        validate_security_boundaries,
        validate_bridge_downloads,
        validate_css,
        validate_python_bridge,
    ]
    for check in checks:
        check()
    print("Project J.A.R.V.I.S. validation passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
