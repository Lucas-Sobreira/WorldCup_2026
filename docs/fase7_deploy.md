# Phase 7 — Deploy (Frontend + Backend)

## Objective

Deploy the full stack to production: React frontend on GitHub Pages, FastAPI backend on Render (free tier), with automated CI/CD via GitHub Actions.

---

## Architecture Overview

```
Browser → GitHub Pages (static React build)
              ↓ VITE_API_URL
         Render Web Service (FastAPI + XGBoost)
              ↓
         Dataset + Model artifacts (built at startup)
```

---

## Frontend — GitHub Pages

### GitHub Actions workflow (`.github/workflows/deploy.yml`)

Triggers on push to `main` when `frontend/**` or the workflow file changes.

```
build job:
  1. actions/checkout@v4
  2. actions/setup-node@v4 (Node 20, npm cache)
  3. npm ci
  4. npm run build  (GITHUB_ACTIONS=true, VITE_API_URL from repo variable)
  5. actions/upload-pages-artifact@v3 (path: frontend/dist)

deploy job (needs: build):
  1. actions/deploy-pages@v4
```

Permissions required: `pages: write`, `id-token: write`.

### Vite base path

`vite.config.js` sets `base: '/WorldCup_2026/'` when `GITHUB_ACTIONS=true`, otherwise `/` for local dev.

### VITE_API_URL

Configured as a GitHub repository variable (Settings → Variables → Actions). At build time, Vite bakes the value into the JS bundle. The fallback in `client.js` uses `||` (not `??`) so an empty string also falls back:

```js
baseURL: import.meta.env.VITE_API_URL || "https://worldcup-2026-wsjm.onrender.com"
```

### SPA routing fix

GitHub Pages serves static files — direct navigation to unknown paths (e.g., `/WorldCup_2026/bracket`) returns 404. `frontend/public/404.html` redirects all unknown paths back to the app root:

```html
<script>window.location.replace('/WorldCup_2026/');</script>
```

### Pages source setting

Must be set to **GitHub Actions** (not "Deploy from a branch") in:
`Repository Settings → Pages → Build and deployment → Source`

---

## Backend — Render

### Service configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: worldcup-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    plan: free
    envVars:
      - key: PYTHON_VERSION
        value: "3.11"
```

### CORS

`backend/main.py` allows both local dev and the GitHub Pages origin:

```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lucas-sobreira.github.io",
]
```

### Startup behavior

On first deploy (no artifact cached), the model is trained from scratch (~10–20s). On subsequent restarts, `model/artifacts/model.joblib` is absent (ephemeral filesystem) so training always runs on cold start.

---

## Known Limitations

### Render free tier cold start

The free plan spins down after ~15 min of inactivity. The first request after hibernation takes **30–60 seconds** to respond (model training + bracket simulation).

**Mitigation options:**

| Option | Effort | Cost |
|--------|--------|------|
| UptimeRobot ping every 5 min to `/health` | Low (no code) | Free |
| GitHub Actions cron workflow to ping `/health` | Low | Free |
| Render paid plan (Starter) | Zero effort | ~$7/mo |

---

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://lucas-sobreira.github.io/WorldCup_2026/ |
| Backend | https://worldcup-2026-wsjm.onrender.com |
| Health check | https://worldcup-2026-wsjm.onrender.com/health |
