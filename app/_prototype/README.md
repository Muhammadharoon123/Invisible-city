# Role prototype (fake data)

A clickable mock of the role screens from `docs/PRD.md` section 5. It has no database, API or sign-in: every Issue lives in browser memory and **Reset data** puts the seed back. It lives in `app/_prototype`, and the leading `_` stops Next.js from turning it into a page. To view it, rename the folder back to `app/prototype` and open `/prototype`.

The team wants to **keep** this prototype as a reference instead of deleting it once the real screens exist. It was first committed as `95295c2` on branch `claude/quizzical-chaplygin-8c1b53`, so it can always be recovered from git.

## What is in here

| File | What it holds |
|---|---|
| `page.tsx` | The page for the route (`/prototype` when the folder is named `prototype`). It only renders `Prototype`. |
| `Prototype.tsx` | The role picker, the shared state (`useReducer`) and the toast. |
| `data.ts` | Types, the Category → Department table, seed Offices, Issues and Access requests, the priority and distance formulas, and the reducer with every action. |
| `bits.tsx` | Small shared pieces: status pill, Category chip, photo placeholder, photo picker, status stepper, timeline, toast. |
| `CitizenView.tsx` | Phone frame: Profile setup, Report a problem, My reports with confirm and reject. |
| `AuthorityView.tsx` | Priority queue with filters, Issue review (Reports, Spam flag, nearest Offices, Assign), Offices & staff. |
| `OfficeView.tsx` | My jobs: Start work, Send back with a reason, Mark fixed with an after-photo. |
| `SuperAdminView.tsx` | Access requests (approve or decline) and the public Request Authority access form. |

## What it borrows from the app

Moving the folder breaks these imports, so check them first:

- `@/components/ui`: `Card`, `btn`, `field`, `Segmented`, `PriorityMeter`, `SeverityBadge`.
- `@/components/CityMap`: the Leaflet map with a movable pin, used on the Report screen. It pulls in `components/MapInner.tsx`, which imports `lib/geo`, `lib/insights` and `lib/types`. Those files are being rebuilt, so this is the import most likely to break.
- `app/globals.css`: the colour tokens (`bg-canvas`, `text-brand`, `bg-accent-50` and others). Without them the classes do nothing.
- npm packages: `lucide-react`, `leaflet` and `react-leaflet`.
- The root layout's `Nav` and `<main>` wrapper sit around the page.

## Moving it somewhere else

- **Same app, not a public route:** rename the folder to `app/_prototype` (Next.js skips folders that start with `_`), or move it to a top-level `prototype/` folder. Nothing else needs to change while the imports above still exist.
- **Same app, still viewable:** leave it where it is. It does not touch real data.
- **A separate project:** copy this folder, `components/ui.tsx` and the `@theme` block from `app/globals.css`. Swap `CityMap` for a plain box, or copy `MapInner.tsx` and give it fake data in place of the `lib/*` imports.

## Room for UI work

This prototype settles which screens exist and what is on them. It does not settle the look. Spacing, typography, colours, empty states, loading states and the phone frame are first drafts and can change freely. To restyle one screen, change its `*View.tsx` file. Changes to the shared pieces in `bits.tsx` show up on every screen. Text is written straight into the screens; the real screens go through the translation file.

## Ideas noted while reviewing

- **Office capacity (later):** each Office has a number of workers and a limit on active jobs. When an Authority assigns an Issue, the Office list shows each Office's load (for example "6 of 8 jobs, 3 workers"), warns when an Office is at its limit, and blocks or asks for a reason before overloading it. This stops Authorities from piling Issues onto an Office whose staff are already busy. The Office track record could also show how often an Office was assigned work while full.
