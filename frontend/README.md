# SmartFeed Frontend (Module 3)

React + Vite + Tailwind + Leaflet + Recharts. Talks to the FastAPI backend in `../backend`, or runs fully on built-in demo data.

```bash
cd frontend
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
```

Backend (separate terminal, from repo root): `uvicorn backend.main:app --reload --port 8000`

## Data source switch (navbar dropdown)
| Mode | Behaviour |
|---|---|
| Auto (default) | Uses the backend if `GET /health` answers, otherwise demo data |
| Demo data | In-browser engine (`src/api/mock.js`) that mirrors the API contract: urgency scoring, split matching, multi-depot routing, baseline comparison |
| Live API | Always the backend (`VITE_API_URL`) |

Demo logins: `admin/admin123`, `greenleaf/donor123`, `hopeshelter/receiver123`.

## Screens
| Route | Who | What |
|---|---|---|
| `/` | all | Problem, solution, role entry points |
| `/login`, `/register` | all | Auth with role choice + one-tap demo accounts |
| `/donor`, `/donor/donate` | donor | My donations with countdown + urgency badges, matched receivers, Donate Food form with map pin |
| `/receiver`, `/receiver/request` | receiver | My requests, coverage bar, incoming matches, vehicle ETA, Request Food form with need level 1-5 |
| `/admin` | admin | Control Center: urgency-ranked lists, map, Run Matching, Plan Routes, Re-plan (vehicle breakdown / urgent drop), time-of-day slider, matches, routes, unmatched reasons |
| `/admin/routes` | admin, driver | Per-vehicle timelines, expiry warnings, split-load tags, Print / PDF |
| `/admin/analytics` | admin | Meals saved, baseline comparison, utilisation, distance, urgency mix, plan checklist |
| `/admin/compare` | admin | Old way (proximity / posting order) vs SmartFeed on identical data |
| `/admin/setup` | admin | Depots and vehicles CRUD |
| `/how-it-works` | all | Scoring formulas, matching and routing rules |

## Notes
- Colours: red = urgent (score >= 0.6), amber = soon (>= 0.4), green = safe.
- In Live mode the routing endpoints are fed the current donations, requests, depots, vehicles and latest matches via `POST /routing/plan`.
- The preview-time slider only affects demo mode; the live API uses the real clock.
