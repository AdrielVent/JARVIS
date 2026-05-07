# Project J.A.R.V.I.S.

An original, browser-based command center inspired by pre-Vision J.A.R.V.I.S.: voice-first, low-latency, modular, safety-gated, and visually grounded in a Stark-style technical interface without copying Marvel-owned screen graphics.

## Current Slice

- Static web dashboard, ready to open locally or host on GitHub Pages.
- Animated command core with live system telemetry.
- Mocked sensors, memory recall, Home Assistant, printer telemetry, and safety log.
- No external runtime dependencies.
- GitHub Actions validation using Python standard library only.

## Run Locally

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Connect To This Laptop

Browsers cannot directly inspect or control a laptop for security reasons. To connect J.A.R.V.I.S. to the laptop it is running on, start the read-only local bridge:

```bash
python3 bridge/jarvis_local_bridge.py
```

Then open:

```text
http://127.0.0.1:8765
```

The bridge binds to localhost only and exposes basic system status: hostname, OS, CPU count, disk space, battery, and simple health warnings. It also supports three allowlisted safe actions: refresh status, copy a status summary to the clipboard, and open the project folder.

It does not read arbitrary files, write arbitrary files, run shell commands from the browser, or scan the network.

## Validate

```bash
python3 scripts/validate_static.py
```

## GitHub Pages

This project is static and includes a GitHub Pages workflow. After pushing to GitHub, enable Pages with GitHub Actions as the source. Pushes to `main` will validate and deploy the command center.

## Design Guardrails

- Original interface language only.
- No Marvel logos, copied HUD layouts, armor silhouettes, movie stills, or proprietary assets.
- Physical and digital actions are represented as safety-gated adapters.
- Real integrations should be added behind typed contracts and explicit allowlists.
