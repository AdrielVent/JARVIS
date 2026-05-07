from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    ROOT / "index.html",
    ROOT / "src" / "styles.css",
    ROOT / "src" / "app.js",
    ROOT / "bridge" / "jarvis_local_bridge.py",
    ROOT / "assets" / "jarvis-local-qr.png",
    ROOT / "assets" / "jarvis-local-qr.svg",
    ROOT / "README.md",
    ROOT / "JARVIS_CANON_AND_DESIGN_BRIEF.md",
    ROOT / "JARVIS_PROJECT_VALIDATION.md",
]


class StaticHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self._in_title = False
        self.stylesheets: list[str] = []
        self.scripts: list[str] = []
        self.test_ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag == "link" and data.get("rel") == "stylesheet" and data.get("href"):
            self.stylesheets.append(data["href"])
        if tag == "script" and data.get("src"):
            self.scripts.append(data["src"])
        if data.get("data-testid"):
            self.test_ids.add(data["data-testid"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate_files() -> None:
    for path in REQUIRED_FILES:
        require(path.exists(), f"Missing required file: {path.relative_to(ROOT)}")


def validate_html() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = StaticHTMLParser()
    parser.feed(html)
    require("Project J.A.R.V.I.S." in parser.title, "HTML title must name Project J.A.R.V.I.S.")
    require("app-shell" in parser.test_ids, "App shell test id is required.")
    for href in parser.stylesheets:
        require((ROOT / href).exists(), f"Stylesheet target missing: {href}")
    for src in parser.scripts:
        require((ROOT / src).exists(), f"Script target missing: {src}")


def validate_css() -> None:
    css = (ROOT / "src" / "styles.css").read_text(encoding="utf-8")
    required_tokens = [
        ".command-stage",
        ".voice-core",
        ".health-strip",
        "@media (max-width: 720px)",
        "prefers-reduced-motion",
    ]
    for token in required_tokens:
        require(token in css, f"CSS missing required token: {token}")
    require("letter-spacing: -" not in css, "Negative letter spacing is not allowed.")


def validate_js() -> None:
    js = (ROOT / "src" / "app.js").read_text(encoding="utf-8")
    required_tokens = [
        "connectBridge",
        "resolveBridgeApiBase",
        "jarvis-local-qr.png",
        "simulateTurn",
        "toggleSafety",
        "renderWaveform",
        "drawStarfield",
        "addEventListener",
    ]
    for token in required_tokens:
        require(token in js, f"JavaScript missing required token: {token}")
    require(not re.search(r"\beval\s*\(", js), "JavaScript must not use eval.")


def validate_bridge() -> None:
    bridge = (ROOT / "bridge" / "jarvis_local_bridge.py").read_text(encoding="utf-8")
    required_tokens = [
        "127.0.0.1",
        "ThreadingHTTPServer",
        "system_snapshot",
        "safe_action",
        "open_project_folder",
        "execute_commands",
        "False",
    ]
    for token in required_tokens:
        require(token in bridge, f"Bridge missing required token: {token}")


def main() -> int:
    checks = [validate_files, validate_html, validate_css, validate_js, validate_bridge]
    for check in checks:
        check()
    print("Static validation passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
