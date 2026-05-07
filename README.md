# Project J.A.R.V.I.S.

Project J.A.R.V.I.S. is a public browser-based J.A.R.V.I.S.-style dashboard built with Vite, React, TypeScript, and Tailwind CSS. The website connects to a user-provided Local Bridge URL, then displays a cinematic local system welcome and dashboard.

Public website after deployment:

```text
https://adrielvent.github.io/JARVIS/
```

## Architecture

GitHub Pages hosts only the frontend website.

```text
Public GitHub Pages website
-> user runs Local Bridge locally
-> user enters http://127.0.0.1:8787
-> browser calls the user's own local bridge
-> dashboard displays that user's laptop details
```

The website alone cannot read someone's laptop. Browsers intentionally block direct access to computer names, files, hardware details, local IP addresses, and private system data. Each user must run the Local Bridge locally on their own laptop.

Default Local Bridge URL:

```text
http://127.0.0.1:8787
```

## Public Usage

1. Open `https://adrielvent.github.io/JARVIS/`.
2. Run the Local Bridge on your own laptop.
3. Enter `http://127.0.0.1:8787`.
4. Click `Connect`, or click `Find My Bridge`.

The Local Bridge Finder only checks approved localhost bridge URLs after the user clicks `Find My Bridge`.

## Local Development

Use two terminals.

Terminal 1:

```bash
python3 bridge/jarvis_local_bridge.py
```

Terminal 2:

```bash
npm install
npm run dev
```

Then open the Vite URL printed in the terminal, usually:

```text
http://127.0.0.1:5173/
```

If that port is occupied, Vite may print:

```text
http://127.0.0.1:5174/
```

Use the printed Vite URL.

## GitHub Pages Deployment

This repo is configured for:

```text
https://adrielvent.github.io/JARVIS/
```

Vite uses:

```ts
base: "/JARVIS/"
```

Deployment flow:

1. Push to `main`.
2. GitHub Actions installs dependencies.
3. GitHub Actions runs TypeScript validation.
4. GitHub Actions runs the local static validation script.
5. GitHub Actions builds the Vite app.
6. GitHub Pages deploys `./dist`.

In GitHub repository settings, set Pages source to `GitHub Actions`.

## Local Bridge API

Expected endpoints:

```text
GET /status
GET /system-info
```

Example `GET /status` response:

```json
{
  "status": "online"
}
```

Example `GET /system-info` response:

```json
{
  "deviceName": "User-Laptop",
  "os": "Windows 11",
  "cpu": "Intel Core i7",
  "memory": "16 GB",
  "battery": "92%",
  "localTime": "9:15 PM",
  "status": "online"
}
```

If `deviceName` is missing, the app displays:

```text
Welcome to J.A.R.V.I.S, Operator.
```

## Local Bridge Finder

The finder never scans automatically on page load. It may only check these approved localhost URLs after the user clicks `Find My Bridge`:

```text
http://localhost:8787
http://127.0.0.1:8787
http://localhost:3001
http://127.0.0.1:3001
http://localhost:5050
http://127.0.0.1:5050
http://localhost:8080
http://127.0.0.1:8080
```

It does not scan LAN IPs, random ports, the internet, or the user's network.

## Security And Privacy

- No external telemetry upload.
- No automatic network scan.
- No LAN scan.
- No random port scan.
- No hidden browser-side laptop inspection.
- Browser data stays in React state for the current session.
- Local Bridge Finder only checks approved localhost URLs after a user click.
- The Local Bridge is localhost-only and refuses to bind outside `127.0.0.1` or `localhost`.
- The Local Bridge CORS allowlist is explicit and includes local Vite origins plus `https://adrielvent.github.io`.
- System details are read only from the Local Bridge URL the user provides.
- Device details are not persisted by the frontend.

## Demo Mode

Click `Try Demo Mode` to preview the J.A.R.V.I.S. animation and dashboard without running the Local Bridge.

## Validation

```bash
npm install
npm run typecheck
npm run build
python3 scripts/validate_static.py
```

## Troubleshooting

- If the site is blank on GitHub Pages, confirm `vite.config.ts` contains `base: "/JARVIS/"`.
- If `npm` is missing, install Node.js LTS.
- If Python is missing, install Python 3.
- If the bridge will not connect, make sure the Local Bridge is running.
- If CORS is blocked, confirm the bridge allows `https://adrielvent.github.io`, `http://127.0.0.1:5173`, `http://localhost:5173`, `http://127.0.0.1:5174`, and `http://localhost:5174`.
- If Vite uses `5174` instead of `5173`, use the printed Vite URL.
- If port `8787` is occupied, stop the old bridge process and restart the bridge.

## Push To GitHub

Target repository:

```text
https://github.com/AdrielVent/JARVIS
```

Commands:

```bash
git status
git branch -M main
git remote add origin https://github.com/AdrielVent/JARVIS.git 2>/dev/null || git remote set-url origin https://github.com/AdrielVent/JARVIS.git
git add .
git commit -m "Prepare JARVIS for GitHub Pages deployment"
git push -u origin main
```
