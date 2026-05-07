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
