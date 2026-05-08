from __future__ import annotations

import stat
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON_BRIDGE_SOURCE = ROOT / "bridge" / "jarvis_local_bridge.py"
POWERSHELL_BRIDGE_SOURCE = ROOT / "bridge" / "jarvis_local_bridge.ps1"
JAVA_BRIDGE_SOURCE = ROOT / "bridge" / "JarvisLocalBridge.java"
DOWNLOAD_DIR = ROOT / "public" / "downloads"
MAC_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-macOS.zip"
WINDOWS_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-Windows.zip"
WINDOWS_POWERSHELL_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-Windows-PowerShell.zip"
JAVA_ZIP = DOWNLOAD_DIR / "JARVIS-Local-Bridge-Java.zip"

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

MAC_JAVA_START = """#!/bin/bash
cd "$(dirname "$0")"

if ! command -v java >/dev/null 2>&1; then
  echo "Java 11 or newer is required to run the J.A.R.V.I.S Java Local Bridge. Install a JDK, then try again."
  echo
  read -r -p "Press Return to close this window."
  exit 1
fi

echo "J.A.R.V.I.S Java Local Bridge is running at http://127.0.0.1:8787"
echo "Keep this Terminal window open while you use J.A.R.V.I.S."
echo
java JarvisLocalBridge.java
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

WINDOWS_POWERSHELL_BAT = """@echo off
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo Windows PowerShell is required to run this J.A.R.V.I.S Local Bridge.
  echo.
  pause
  exit /b 1
)

echo J.A.R.V.I.S PowerShell Local Bridge is running at http://127.0.0.1:8787
echo Keep this Command Prompt window open while you use J.A.R.V.I.S.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0jarvis_local_bridge.ps1"
echo.
pause
"""

WINDOWS_JAVA_START = """@echo off
cd /d "%~dp0"

where java >nul 2>nul
if errorlevel 1 (
  echo Java 11 or newer is required to run the J.A.R.V.I.S Java Local Bridge. Install a JDK, then try again.
  echo.
  pause
  exit /b 1
)

echo J.A.R.V.I.S Java Local Bridge is running at http://127.0.0.1:8787
echo Keep this Command Prompt window open while you use J.A.R.V.I.S.
echo.
java JarvisLocalBridge.java
echo.
pause
"""

MAC_README = f"""J.A.R.V.I.S Local Bridge for macOS

This bridge runs only on your own Mac at:
{BRIDGE_URL}

Recommended path:

1. Unzip the file.
2. Double-click start-jarvis-bridge.command.
3. If macOS blocks it, right-click the file and choose Open.
4. Keep the Terminal window open.
5. Return to:
   {PUBLIC_SITE}
6. Click Find My Bridge or enter:
   {BRIDGE_URL}
7. Click Connect.

Alternative Java path:

1. Install Java 11 or newer.
2. Double-click start-jarvis-bridge-java.command.
3. Keep the Terminal window open.
4. Return to J.A.R.V.I.S and connect to:
   {BRIDGE_URL}

Your laptop details stay local. The public J.A.R.V.I.S website connects to this bridge running on your own Mac.
"""

WINDOWS_README = f"""J.A.R.V.I.S Local Bridge for Windows

This bridge runs only on your own Windows laptop at:
{BRIDGE_URL}

Recommended native Windows path:

1. Unzip the file.
2. Double-click start-jarvis-bridge-powershell.bat.
3. If Windows asks for permission, click Allow Access.
4. Keep the Command Prompt window open.
5. Return to:
   {PUBLIC_SITE}
6. Click Find My Bridge or enter:
   {BRIDGE_URL}
7. Click Connect.

Python path:

1. Install Python 3 if needed.
2. Double-click start-jarvis-bridge.bat.
3. Keep the Command Prompt window open.

Java path:

1. Install Java 11 or newer if needed.
2. Double-click start-jarvis-bridge-java.bat.
3. Keep the Command Prompt window open.

Your laptop details stay local. The public J.A.R.V.I.S website connects to this bridge running on your own computer.
"""

WINDOWS_POWERSHELL_README = f"""J.A.R.V.I.S Local Bridge for Windows PowerShell

This package does not require Python.
It runs a read-only localhost bridge on your own Windows laptop at:
{BRIDGE_URL}

How to use it:

1. Unzip the file.
2. Double-click start-jarvis-bridge-powershell.bat.
3. If Windows Firewall asks for permission, click Allow Access.
4. Keep the Command Prompt window open.
5. Return to:
   {PUBLIC_SITE}
6. Click Find My Bridge or enter:
   {BRIDGE_URL}
7. Click Connect.

The PowerShell bridge exposes only:
GET /status
GET /system-info

It does not scan your network, read files, upload data, or run arbitrary commands.
"""

JAVA_README = f"""J.A.R.V.I.S Local Bridge for Java

This package is cross-platform for macOS and Windows.
It runs a read-only localhost bridge on your own laptop at:
{BRIDGE_URL}

Requirements:

- Java 11 or newer.

macOS:

1. Unzip the file.
2. Double-click start-jarvis-bridge-java.command.
3. If macOS blocks it, right-click the file and choose Open.
4. Keep the Terminal window open.

Windows:

1. Unzip the file.
2. Double-click start-jarvis-bridge-java.bat.
3. If Windows Firewall asks for permission, click Allow Access.
4. Keep the Command Prompt window open.

Then return to:
{PUBLIC_SITE}

Click Find My Bridge or enter:
{BRIDGE_URL}

The Java bridge exposes only:
GET /status
GET /system-info

It does not scan your network, read files, upload data, or run arbitrary commands.
"""


def write_text(zip_file: zipfile.ZipFile, name: str, text: str, executable: bool = False) -> None:
    info = zipfile.ZipInfo(name)
    info.compress_type = zipfile.ZIP_DEFLATED
    permissions = stat.S_IFREG | (0o755 if executable else 0o644)
    info.external_attr = permissions << 16
    zip_file.writestr(info, text)


def write_file(zip_file: zipfile.ZipFile, source: Path, name: str) -> None:
    zip_file.write(source, name, compress_type=zipfile.ZIP_DEFLATED)


def build_mac_zip() -> None:
    with zipfile.ZipFile(MAC_ZIP, "w") as zip_file:
        write_file(zip_file, PYTHON_BRIDGE_SOURCE, "jarvis_local_bridge.py")
        write_file(zip_file, JAVA_BRIDGE_SOURCE, "JarvisLocalBridge.java")
        write_text(zip_file, "start-jarvis-bridge.command", MAC_START, executable=True)
        write_text(zip_file, "start-jarvis-bridge-java.command", MAC_JAVA_START, executable=True)
        write_text(zip_file, "README-macOS.txt", MAC_README)


def build_windows_zip() -> None:
    with zipfile.ZipFile(WINDOWS_ZIP, "w") as zip_file:
        write_file(zip_file, PYTHON_BRIDGE_SOURCE, "jarvis_local_bridge.py")
        write_file(zip_file, POWERSHELL_BRIDGE_SOURCE, "jarvis_local_bridge.ps1")
        write_file(zip_file, JAVA_BRIDGE_SOURCE, "JarvisLocalBridge.java")
        write_text(zip_file, "start-jarvis-bridge.bat", WINDOWS_START, executable=True)
        write_text(zip_file, "start-jarvis-bridge-powershell.bat", WINDOWS_POWERSHELL_BAT, executable=True)
        write_text(zip_file, "start-jarvis-bridge-java.bat", WINDOWS_JAVA_START, executable=True)
        write_text(zip_file, "README-Windows.txt", WINDOWS_README)


def build_windows_powershell_zip() -> None:
    with zipfile.ZipFile(WINDOWS_POWERSHELL_ZIP, "w") as zip_file:
        write_file(zip_file, POWERSHELL_BRIDGE_SOURCE, "jarvis_local_bridge.ps1")
        write_text(zip_file, "start-jarvis-bridge-powershell.bat", WINDOWS_POWERSHELL_BAT, executable=True)
        write_text(zip_file, "README-Windows-PowerShell.txt", WINDOWS_POWERSHELL_README)


def build_java_zip() -> None:
    with zipfile.ZipFile(JAVA_ZIP, "w") as zip_file:
        write_file(zip_file, JAVA_BRIDGE_SOURCE, "JarvisLocalBridge.java")
        write_text(zip_file, "start-jarvis-bridge-java.command", MAC_JAVA_START, executable=True)
        write_text(zip_file, "start-jarvis-bridge-java.bat", WINDOWS_JAVA_START, executable=True)
        write_text(zip_file, "README-Java.txt", JAVA_README)


def main() -> int:
    for source in [PYTHON_BRIDGE_SOURCE, POWERSHELL_BRIDGE_SOURCE, JAVA_BRIDGE_SOURCE]:
        if not source.exists():
            raise FileNotFoundError(f"Missing bridge source: {source}")

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    build_mac_zip()
    build_windows_zip()
    build_windows_powershell_zip()
    build_java_zip()

    for path in [MAC_ZIP, WINDOWS_ZIP, WINDOWS_POWERSHELL_ZIP, JAVA_ZIP]:
        print(f"Wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
