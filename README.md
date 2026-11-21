# INvisible City - See the unseen. Fix the forgotten.

AI-powered smart-city platform for Islamabad: citizens report problems with a photo, AI triages and
de-duplicates them, and authorities get a prioritised work queue, a live map and accountability insights.

## Run it

Requires **Node.js 22.13+** (uses the built-in `node:sqlite`, so there's no database to install).

```bash
npm install
cp .env.example .env.local     # optional: add ANTHROPIC_API_KEY for real photo analysis
npm run dev                    # http://localhost:3000
```

On first start it creates `data/invisible-city.db` and seeds ~70 realistic demo issues across Islamabad sectors.
To start over, delete the `data/` folder.

- **Without an API key** the app runs in *offline mode*: the category and severity come from keywords in the description (or the category the citizen picks).
- **With `ANTHROPIC_API_KEY`**, Claude vision (`claude-opus-5-5`, structured output) reads the photo and returns the category, severity, confidence, a title, a summary and hazards.

Authority dashboard passcode: `admin123` (change it with `ADMIN_PASSCODE`).

## The 2-minute demo script

1. **Report** → upload a pothole photo → pick demo location **F-10 Markaz** → Submit.
   The AI classifies it as *Road damage* and estimates severity and priority.
2. **Report another** → upload a second photo of the same pothole → **F-10 Markaz** again.
   → *"Possible duplicate detected"*: match score, distance in metres and photo similarity. Both reports are now one issue and its priority goes up.
3. **City Map** → the issue is on the map. Switch to the **Invisible Problems Heatmap** and **Neighbourhood Health** views.
4. **Authority dashboard** (`admin123`) → the issue is near the top of the priority queue → **Assign** a team → **Mark repair work started** → upload an after-photo → **Mark as resolved**.
5. Open the issue → **Before vs After** and the full accountability timeline.
   **My reports** shows the citizen it's fixed, and their **Citizen Impact Score** goes up.
6. **Insights** → neighbourhood health scores, the **Neglected Neighbourhood Detector** (I-10, G-11 and I-9 are flagged because few of their complaints get resolved, not because they have the most complaints), **Predictive maintenance**, and the leaderboard.
7. Bonus: report a pothole again at the spot you just fixed → it's flagged as a **recurring problem**.

## How the AI works

| Task | Implementation |
|---|---|
| Image classification + severity | Claude vision with a strict JSON schema (`lib/ai.ts`); falls back to a keyword heuristic offline |
| Text → structured info | The same call turns the free-text complaint into a title, summary and list of hazards |
| Duplicate detection | `lib/scoring.ts`: a score that combines GPS distance (≤150 m), category agreement and a 64-bit perceptual image hash (dHash, computed in the browser). A score of 0.6 or more merges the report into the existing issue |
| Priority score (0-100) | severity × 15 + citizen corroboration (log₂ of reports) + age + hazard bonus + recurrence bonus |
| City Health Score | 55% open-problem load (weighted by severity, grows with age) + 45% resolution rate |
| Neglect detection | ≥3 complaints, <35% resolved, and below 60% of the city-wide resolution rate |
| Predictive maintenance | ≥3 issues of the same category in one area within 120 days, or issues that came back after a repair |

## Architecture

```
app/                 Next.js 16 App Router (React 19, Tailwind 4)
  page.tsx           City map: issues / heatmap / health layers, priority list, neglect alerts
  report/            Citizen app: photo, GPS or map pin, AI result + duplicate notice
  track/             Citizen's own reports with a progress tracker + impact score
  issues/[id]/       Issue detail: Before vs After, all grouped reports, timeline
  insights/          Health scores, neglect detector, predictive maintenance, leaderboard
  admin/             Authority dashboard: priority queue, assign, start work, resolve with photo
  api/               REST API (route handlers)
lib/
  ai.ts              Claude vision triage + offline fallback
  scoring.ts         Priority, duplicate matching, image-hash distance
  insights.ts        Neighbourhood health, neglect, predictive, citizen impact
  db.ts              SQLite schema, queries, deterministic demo seed
  geo.ts             Islamabad sectors, haversine distance
components/          Leaflet map (OpenStreetMap tiles + leaflet.heat), UI badges
```

### Changes from the proposed stack (to keep the hackathon MVP dependency-free)

| Proposed | MVP | Path to production |
|---|---|---|
| FastAPI backend | Next.js route handlers (one deployable) | The API is plain REST; it can be ported to FastAPI one-for-one |
| PostgreSQL | SQLite (`node:sqlite`) | The schema is portable SQL; switch to Postgres/Supabase and add PostGIS for geo queries |
| Supabase Storage | Local `data/uploads/` | Replace `lib/uploads.ts` with a Supabase Storage upload |
| Supabase Auth | Passcode cookie for admins, anonymous device ID for citizens | Supabase Auth with an official role |
| YOLO | Claude vision | YOLO on-device for instant pre-tagging, with Claude for severity and reasoning |

Videos aren't supported yet. Reports take photos only.
