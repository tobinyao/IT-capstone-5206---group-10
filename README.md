# Fire Vulnerability Assessment Tool (FVAT)

A web application for assessing bushfire vulnerability of heritage sites in the Franklin District, Western Australia. Built by **CITS5206 Capstone — Group 10** in partnership with **Wagyl Kaip South Noongar** and **The University of Western Australia**.

The tool combines a Leaflet-based risk map, model-driven site assessments, a heritage registry, and reference content (regulations, mitigation guidance, local contacts) into a single, role-aware web app.

---

## 1. What's in this repo

```
.
├── src/                  React + TypeScript frontend (Vite)
│   ├── pages/            Risk Map, Model Insights, Heritage Registry, ...
│   ├── components/       Sidebar, ProtectedRoute, AddSiteModal, ...
│   ├── contexts/         AuthContext (login state + localStorage)
│   └── api/              Typed fetch wrappers (auth.ts, ...)
├── backend/              Flask API + SQLite database
│   ├── app.py            App entry point
│   ├── routes/           auth_routes.py, heritage_routes.py
│   ├── services/         risk_model, risk_normalization, site_assessment, db, data_loader
│   ├── database/         schema.sql
│   ├── scripts/          init_sqlite_db.py, seed_sqlite_db.py
│   ├── data/             Raw + processed data (heritage_sites.json, metadata.json, firewatch.sqlite)
│   ├── API_DOCS.md       Endpoint reference
│   └── DATA_MODEL_DOCS.md Risk model and data schema reference
├── public/               Static assets served as-is (favicon, processed GeoJSON, raster overlays)
├── tests/
│   ├── frontend/         Vitest + React Testing Library
│   ├── backend/          pytest
│   └── e2e/              Playwright
├── .env.example          Frontend env template (VITE_API_BASE_URL)
└── package.json / vite.config.ts / tailwind.config.js / tsconfig.*
```

---

## 2. Architecture at a glance

| Layer       | Stack                                                              |
| ----------- | ------------------------------------------------------------------ |
| Frontend    | React 19, TypeScript, Vite 8, Tailwind 3, React Router 7           |
| Map / chart | Leaflet + react-leaflet, Chart.js + react-chartjs-2                |
| State       | React Context (auth), localStorage for session persistence         |
| Backend     | Python 3.10+, Flask, flask-cors, werkzeug (password hashing)       |
| Database    | SQLite (`backend/data/firewatch.sqlite`)                           |
| Tests       | Vitest + RTL (unit), Playwright (e2e), pytest (backend)            |

The frontend calls the backend over HTTP at `/api/*`. The backend reads from SQLite and the JSON / GeoJSON files under `backend/data/` and `public/data/processed/`.

---

## 3. Prerequisites

Install once on the machine that will run the app:

- **Python 3.10 or higher** (we use `python3` in every command below)
- **pip** (ships with modern Python; `python3 -m pip --version` to verify)
- **Node.js 20+** and **npm 10+**
- (Optional) **Google Chrome** if you want to run the Playwright e2e suite

Verify:

```bash
python3 --version
python3 -m pip --version
node -v
npm -v
```

> **Why `python3` (not `python`)?** On macOS and most Linux distributions `python` either points at Python 2 or is unavailable, while `python3` is guaranteed to be Python 3. Using `python3` everywhere keeps the instructions identical across machines. On Windows, `python` works too — substitute it if your shell does not have `python3`.

---

## 4. First-time setup

Clone the repo. **All commands below are run from the repo root** unless otherwise stated.

### 4.1 Frontend

```bash
npm install
cp .env.example .env.local        # leave VITE_API_BASE_URL empty for local dev
```

`VITE_API_BASE_URL` controls where the frontend sends `/api/*` requests:

- **empty** → same origin (use this for local dev; Vite forwards to the backend, or you run the bundle behind a reverse proxy)
- `https://api.example.com` → point at a remote backend

### 4.2 Backend (Python virtual environment)

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python3 -m pip install --upgrade pip
python3 -m pip install flask flask-cors werkzeug
```

> A `requirements.txt` is **not** currently committed. If you prefer reproducible installs, freeze the env once:
> `python3 -m pip freeze > backend/requirements.txt`
> Future installs then become `python3 -m pip install -r backend/requirements.txt`.

### 4.3 Initialise the database

With the virtual environment still active:

```bash
python3 backend/scripts/init_sqlite_db.py
python3 backend/scripts/seed_sqlite_db.py
```

This creates `backend/data/firewatch.sqlite` and populates the `users`, `heritage_sites`, `burn_options`, `granite_polygons`, `app_metadata`, and `geojson_features` tables. The DB file is git-ignored (`*.sqlite`) so each environment owns its own copy.

---

## 5. Running the app

You need **two terminals** in development: one for the backend, one for the frontend.

**Terminal A — backend (port 5000):**

```bash
# from the repo root
source .venv/bin/activate
python3 backend/app.py
# → http://127.0.0.1:5000
```

**Terminal B — frontend (port 5173):**

```bash
# from the repo root
npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173`, register an account on `/register`, then sign in. All pages except `/login` and `/register` are protected by `ProtectedRoute` and will redirect to `/login` if no token is present.

### Building for production

```bash
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Serve dist/ on http://127.0.0.1:4173 to sanity-check
```

The Flask backend can be served behind any WSGI server (gunicorn / uwsgi) in production. The built frontend (`dist/`) is static and can be served by any web server or CDN; configure it to proxy `/api/*` to the backend, or set `VITE_API_BASE_URL` at build time to point at a public backend origin.

---

## 6. Using the app (feature tour)

After signing in you land on the **Risk Map**. The left sidebar groups the pages into *Assessment* and *Data*.

| Page                  | Route                | Purpose                                                                                       |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| Risk Map              | `/`                  | Leaflet map with toggleable layers: fire risk, heritage points, burn options, granite, fuel, slope. Switch between OSM and satellite basemaps. |
| Model Insights        | `/insights`          | Charts and notes describing the scoring weights and model behaviour                           |
| Fire Risk Regulation  | `/regulation`        | Reference content + "Contact Local Planner" CTA → Local Contacts                              |
| Mitigation Guide      | `/mitigation-guide`  | Guidance for risk-reduction actions                                                           |
| Heritage Registry     | `/registry`          | Searchable list of heritage sites; "Add Site" modal for new records                           |
| Site Assessment       | `/assessment`        | Form that posts to `POST /api/site-assessment` and returns a 0–100 score + Low/Medium/High    |
| Local Contacts        | `/contacts`          | District planners and emergency contacts (linked from the Regulation page)                    |

Authentication uses a short-lived demo token. The token + user are stored in `localStorage` under `fvat.auth.token` and `fvat.auth.user`. Logging out (footer of the sidebar) clears both and redirects to `/login`.

---

## 7. Maintaining the app

### 7.1 Updating heritage / map data

Source data lives in two places:

- `backend/data/heritage_sites.json` — raw heritage records used by `/api/heritage`
- `public/data/processed/*.geojson` and `metadata.json` — processed layers used by the Risk Map and the seeding script

Workflow after updating any of these files:

```bash
# from the repo root
source .venv/bin/activate
python3 backend/scripts/seed_sqlite_db.py
```

Schema and field conventions are documented in `backend/DATA_MODEL_DOCS.md` (sections 3 and 4). **Do not commit real protected Aboriginal heritage coordinates** without explicit permission from the relevant heritage authority and Traditional Owners — use the anonymised samples for demonstrations.

### 7.2 Adjusting the risk model

The scoring weights live in `backend/data/metadata.json` and are returned to the frontend via `GET /api/metadata` (consumed by the Model Insights page). To tweak weights without code changes, edit that file and restart the backend. Lookup tables (fuel type, heritage type, burn context, granite, slope conversion) live in `backend/services/risk_normalization.py`.

### 7.3 Adding users / roles

Users are created via `POST /api/register` (or the `/register` page). Roles are `admin`, `user`, or `viewer` (enforced by a `CHECK` constraint in `schema.sql`). There is currently no admin UI; promote a user by running SQL directly:

```bash
sqlite3 backend/data/firewatch.sqlite \
  "UPDATE users SET role='admin' WHERE email='someone@example.com';"
```

### 7.4 Dependency updates

```bash
# frontend
npm outdated
npm update                                  # minor / patch
# major bumps: edit package.json, then `npm install`, run tests

# backend
source .venv/bin/activate
python3 -m pip list --outdated
python3 -m pip install -U flask flask-cors werkzeug
```

After any update, run the full test suite (section 8) before merging.

### 7.5 Backups

The whole application state is in `backend/data/firewatch.sqlite`. Back it up with a plain file copy or:

```bash
sqlite3 backend/data/firewatch.sqlite ".backup backup-$(date +%F).sqlite"
```

---

## 8. Testing

```bash
# Frontend unit / component (Vitest + React Testing Library)
npm test

# End-to-end (Playwright, Chrome)
npm run e2e            # headless
npm run e2e:headed     # watch it run

# Backend (pytest) — from the repo root, with the venv active
source .venv/bin/activate
python3 -m pip install pytest
python3 -m pytest tests/backend
```

Playwright auto-starts `npm run dev` on `127.0.0.1:4173`; if you already have a dev server running, it will reuse it (see `playwright.config.ts`).

---

## 9. API quick reference

Full reference: `backend/API_DOCS.md`. Summary:

| Method | Path                                        | Notes                                       |
| ------ | ------------------------------------------- | ------------------------------------------- |
| GET    | `/`                                         | Health check                                |
| POST   | `/api/register`                             | Body: `{ email, password }`                 |
| POST   | `/api/login`                                | Body: `{ email, password }` → `{ token, user }` |
| GET    | `/api/metadata`                             | Scoring weights + model notes               |
| POST   | `/api/site-assessment`                      | Body: `{ fuelRisk, slopeRisk, heritageTypeRisk, burnContext }` |
| GET    | `/api/heritage` · `/api/sites`              | All heritage sites                          |
| GET    | `/api/heritage/<id>` · `/api/sites/<id>`    | Single site                                 |
| GET    | `/api/layers/heritage`                      | GeoJSON layer                               |
| GET    | `/api/layers/burn-options`                  | GeoJSON layer                               |
| GET    | `/api/layers/granite`                       | GeoJSON layer                               |
| GET    | `/api/processed-metadata`                   | Processed map metadata                      |

---

## 10. Troubleshooting

| Symptom                                            | Likely cause / fix                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `python3: command not found`                       | Install Python 3.10+ from <https://www.python.org/downloads/> (or `brew install python` on macOS)   |
| `ModuleNotFoundError: No module named 'flask'`     | Virtual environment is not active, or you forgot `python3 -m pip install flask flask-cors werkzeug` |
| Frontend shows "Unable to reach the server"        | Backend not running on `:5000`, or `VITE_API_BASE_URL` points at the wrong host                     |
| CORS error in browser console                      | Make sure `flask-cors` is installed and the backend was restarted after installing it               |
| `/api/heritage` returns "file not found"           | Run `python3 backend/scripts/seed_sqlite_db.py` to populate SQLite                                  |
| Login succeeds but pages keep redirecting to login | localStorage blocked (private mode / Safari). Tokens fall back to in-memory only — re-login per tab |
| `npm run build` fails on TypeScript errors         | Run `npm run lint` and `npx tsc -b --noEmit` to see the full list                                   |
| Playwright can't find Chrome                       | Install Chrome, or change `channel: 'chrome'` in `playwright.config.ts` to use bundled Chromium     |

---

## 11. Project info

- Course: **CITS5206 Capstone**, UWA — Group 10
- Repo: <https://github.com/tobinyao/IT-capstone-5206---group-10>
- Partners: Wagyl Kaip South Noongar · The University of Western Australia
- District: Franklin · FRK
- Version: **v1.0 Pilot**

For the original project plan, milestones, and Gantt chart see `project_plan.v1.md`. For risk-model details and data schemas see `backend/DATA_MODEL_DOCS.md`. For endpoint contracts see `backend/API_DOCS.md`.
