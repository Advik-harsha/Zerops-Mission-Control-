# Mission Control 🚀
### A live spacecraft control-room dashboard for the WeMakeDevs × Zerops Challenge

> Built in 48 hours · Deployed on Zerops · Solo project by [@Advik-harsha](https://github.com/Advik-harsha)

---

## What it is

**Mission Control** visualises a real Zerops project as a spacecraft control room in real time:

| Visual element | What it shows |
|---|---|
| **Orbital Map** | All services as nodes orbiting a central hub; animated particles flow along paths |
| **Life-Support Panels** | Per-service health cards — green/amber/red, container count, last updated |
| **Launch Sequence** | Animated BUILD → PREPARE → DEPLOY → ORBIT pipeline progress bar |
| **Mission Log** | Auto-scrolling flight-control transcript of deploys, restarts, and status changes |

The dashboard **watches itself** — it visualises the `mission-control` project (the three services it runs on), so you can watch it come to life during deployment.

---

## Architecture

```
mission-control/
  db   (postgresql@14, NON_HA)   — persistent snapshots & event log
  api  (python@3.11, FastAPI)    — polls Zerops API, WebSocket hub, REST
  gui  (static@1, React + Vite)  — spacecraft control-room UI
```

### How Zerops is used

- **Private networking**: `api` → `db` via `db:5432` (never a public address)
- **Environment secrets**: `ZEROPS_API_TOKEN` stored as `envSecret`, never in source
- **Build pipeline**: `gui` is built by Node 22 via Zerops build pipeline, output served by `static@1`
- **Env var injection**: `VITE_API_URL` and `VITE_WS_URL` are injected at build time so the frontend knows where to find the API
- **Readiness check**: `api` has an HTTP readiness probe on `/health`
- **Autoscaling**: `api` configured with vertical autoscaling (1–2 CPU, 0.5–2 GB RAM)

### Real-time data flow

```
Zerops REST API (polling every 15s)
    ↓
api/poller.py (diff → persist to Postgres → broadcast)
    ↓
WebSocket /ws → browser clients
    ↑
api/main.py (also serves REST /api/services + /api/history for initial load)
```

> **Note on polling**: Zerops does not currently expose push webhooks. All real-time updates use a poll-diff-broadcast pattern with 15-second intervals. Documented here as the authoritative architectural decision.

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11, FastAPI, uvicorn, asyncpg, SQLAlchemy async, httpx |
| Frontend | React 18, Vite 5, pure SVG animations (no D3), CSS custom properties |
| Database | PostgreSQL 14 (Zerops managed) |
| Deployment | Zerops (3 services) |

---

## Running locally

### API
```bash
cd api
pip install -r requirements.txt
# Optional: set env vars for real data, or leave blank for mock mode
export DATABASE_URL="postgresql://user:pass@localhost:5432/missioncontrol"
export ZEROPS_API_TOKEN="your_token"
export TARGET_PROJECT_ID="your_project_id"
uvicorn main:app --reload --port 8000
```

### GUI
```bash
cd gui
npm install
npm run dev   # Proxies /api and /ws to localhost:8000
```

Visit `http://localhost:5173` — the GUI will use mock data if no API token is set.

---

## Deployment on Zerops

### 1. Import project
```
Zerops GUI → Projects → Import → paste zerops-project-import.yaml
```

### 2. Set secrets (NEVER in source)
In the Zerops GUI → `api` service → Environment Variables:
- `ZEROPS_API_TOKEN` → your PAT from zerops.io/settings/access-tokens
- `TARGET_PROJECT_ID` → the ID in the URL when viewing mission-control: `app.zerops.io/project/THIS-ID`

### 3. Deploy
```bash
# Install zcli: https://docs.zerops.io/references/cli
zcli login <your_token>
zcli push api    # from repo root
zcli push gui    # from repo root
```

### 4. Verify
- `https://<api-subdomain>.zerops.app/health` → `{"status":"ok"}`
- `https://<gui-subdomain>.zerops.app` → control room renders

---

## AI Usage Disclosure

*(Required by challenge rules — honest accounting of AI assistance)*

| What | AI-generated? | Human decision? |
|---|---|---|
| Architecture design | Yes (Claude Sonnet 4.6) | Approved by me |
| All code scaffolding | Yes (Claude Sonnet 4.6) | Reviewed and understood by me |
| Tech stack choices (FastAPI, asyncpg, SVG-only animations) | Jointly | Confirmed by me |
| Visual design language (deep-space, spacecraft idiom) | Specified by me | — |
| `ZEROPS_API_TOKEN` secret value | **No — I set this** | — |
| `TARGET_PROJECT_ID` | **No — I set this** | — |
| Zerops project creation, secret injection, `zcli push` commands | **No — I executed these** | — |
| Demo video and submission form | **No** | — |
| Understanding the architecture for judge Q&A | My responsibility | — |

I can explain every architectural decision in this project.

---

## License
MIT
