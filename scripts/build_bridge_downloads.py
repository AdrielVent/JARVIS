from __future__ import annotations

import stat
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BRIDGE_SOURCE = ROOT / "bridge" / "jarvis_local_bridge.py"
DOWNLOAD_DIR = ROOT / "public" / "downloads"
MAC_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-macOS.zip"
WINDOWS_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-Windows.zip"

PUBLIC_SITE = "https://adrielvent.github.io/JARVIS/"
BRIDGE_URL = "http://127.0.0.1:8787"

MAC_START = """#!/bin/bash
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to run the J.A.R.V.I.S Local Bridge. Install Python 3, then try again."
  echo
  read -r -p "Press Return to close this window."
  exit 1
fi

echo "J.A.R.V.I.S Local Bridge is running at http://127.0.0.1:8787"
echo "Keep this Terminal window open while you use J.A.R.V.I.S."
echo
python3 jarvis_local_bridge.py
echo
read -r -p "Bridge stopped. Press Return to close this window."
"""

WINDOWS_START = """@echo off
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required to run the J.A.R.V.I.S Local Bridge. Install Python 3, then try again.
  echo.
  pause
  exit /b 1
)

echo J.A.R.V.I.S Local Bridge is running at http://127.0.0.1:8787
echo Keep this Command Prompt window open while you use J.A.R.V.I.S.
echo.
python jarvis_local_bridge.py
echo.
pause
"""

MAC_README = f"""J.A.R.V.I.S Local Bridge for macOS

This bridge runs only on your own Mac at:
{BRIDGE_URL}

How to use it:

1. Unzip the file.
2. Double-click start-jarvis-bridge.command.
3. If macOS blocks it, right-click the file and choose Open.
4. Keep the Terminal window open.
5. Return to:
   {PUBLIC_SITE}
6. Click Find My Bridge or enter:
   {BRIDGE_URL}
7. Click Connect.

Your laptop details stay local. The public J.A.R.V.I.S website connects to this bridge running on your own Mac.
"""

WINDOWS_README = f"""J.A.R.V.I.S Local Bridge for Windows

This bridge runs only on your own Windows laptop at:
{BRIDGE_URL}

How to use it:

1. Unzip the file.
2. Double-click start-jarvis-bridge.bat.
3. If Windows asks for permission, click Allow Access.
4. Keep the Command Prompt window open.
5. Return to:
   {PUBLIC_SITE}
6. Click Find My Bridge or enter:
   {BRIDGE_URL}
7. Click Connect.

Your laptop details stay local. The public J.A.R.V.I.S website connects to this bridge running on your own computer.
"""


def write_text(zip_file: zipfile.ZipFile, name: str, text: str, executable: bool = False) -> None:
    info = zipfile.ZipInfo(name)
    info.compress_type = zipfile.ZIP_DEFLATED
    permissions = stat.S_IFREG | (0o755 if executable else 0o644)
    info.external_attr = permissions << 16
    zip_file.writestr(info, text)


def build_zip(path: Path, start_name: str, start_text: str, readme_name: str, readme_text: str) -> None:
    with zipfile.ZipFile(path, "w") as zip_file:
        zip_file.write(BRIDGE_SOURCE, "jarvis_local_bridge.py", compress_type=zipfile.ZIP_DEFLATED)
        write_text(zip_file, start_name, start_text, executable=True)
        write_text(zip_file, readme_name, readme_text)


def main() -> int:
    if not BRIDGE_SOURCE.exists():
        raise FileNotFoundError(f"Missing bridge source: {BRIDGE_SOURCE}")

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    build_zip(MAC_ZIP, "start-jarvis-bridge.command", MAC_START, "README-macOS.txt", MAC_README)
    build_zip(
        WINDOWS_ZIP,
        "start-jarvis-bridge.bat",
        WINDOWS_START,
        "README-Windows.txt",
        WINDOWS_README,
    )

    print(f"Wrote {MAC_ZIP.relative_to(ROOT)}")
    print(f"Wrote {WINDOWS_ZIP.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
