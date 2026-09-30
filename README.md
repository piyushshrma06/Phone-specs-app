# Verdict — Phone Fit Advisor

A full-stack web app that helps you decide whether a phone suits *you*. Pick a phone, and Verdict shows its cleaned specs, an AI-generated **Buy / Pass verdict** (Google Gemini), and a **0–10 fit score** computed for a persona you choose: **Gamer**, **Content Creator**, or **Everyday User**.

**Live demo:** not deployed yet.

---

## Table of contents

1. [The problem](#the-problem)
2. [How it works](#how-it-works)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Configuration](#configuration)
7. [API reference](#api-reference)
8. [Scoring engine](#scoring-engine)
9. [Data model & caching](#data-model--caching)
10. [Test scripts](#test-scripts)
11. [Known limitations](#known-limitations)
12. [Roadmap](#roadmap)
13. [Credits & data source](#credits--data-source)

---

## The problem

Phone specs are full of jargon (chipsets, RAM, sensor sizes), and most buyers can't translate them into "is this right for me?". Static comparison sites also show the same view to everyone, even though a good phone for a gamer may be a poor pick for a content creator. Verdict fetches specs, cleans them, asks an LLM for a plain-language verdict, and scores the phone against what the chosen persona cares about.

## How it works

### Request pipeline

```
Browser (React + Vite, :5173)
   │  fetch  (frontend/src/api.js)
   ▼
Express API (:5000)  ── cors() ── express.json()
   │
   ├─ GET /health                     → server + MongoDB connection status
   └─ /api/phones
        ├─ GET /brands                → brand list      ─┐
        ├─ GET /brands/:brandSlug     → phones in brand ─┴─► specs API (:4000)
        └─ GET /:slug?persona=…       → the core route
               │
               ├─ cacheService.getPhoneData(slug)
               │     ├─ HIT  (cachedAt < 24h) → return stored { cleaned, verdict }
               │     └─ MISS / stale
               │          1. specsApi.getPhoneDetails   fetch raw specs (HTTP)
               │          2. analyst.analyzePhone       flatten + clean (plain JS)
               │          3. verdict.getVerdict         Gemini call → JSON
               │          └─ upsert into MongoDB with cachedAt = now
               │
               └─ scoringService.scorePhone(cleaned, persona)   (pure math)
                        ▼
              { cleaned, verdict, score, scoreBreakdown, fromCache }
```

### Cache-aside

Every phone lookup checks MongoDB first. If a document exists and is younger than 24 hours, it is returned without touching the specs API or Gemini. Otherwise the pipeline runs and the result is saved back (upsert, one document per phone slug).

In one local run of `backend/scripts/testCache.js`, a cache miss took about 11.6 s and a hit about 28 ms. This is a single manual measurement, not a benchmark; your numbers will vary with network, Atlas region, and API latency. Re-run the script to get your own.

Only the cleaned specs and the verdict are cached. The persona score is **not** cached — it is recomputed on every request because it is cheap and depends on the persona.

### Three-stage pipeline (one LLM call)

| Stage | File | What it does | Uses LLM? |
|---|---|---|---|
| Fetch | `services/dataSources/specsApi.js` | HTTP calls to the external specs API | No |
| Clean | `services/agentPipeline/analyst.js` | Strips embedded HTML, flattens the nested response, extracts RAM, infers a missing brand, sets an `isLikelyPhone` flag | No |
| Verdict | `services/agentPipeline/verdict.js` | Sends the cleaned specs to `gemini-2.5-flash`, expects JSON `{verdict, summary, pros, cons}`, strips markdown fences if present, throws on unparseable output | **Yes** |

This is a fixed sequential pipeline, not an autonomous agent system: there is no planning, looping, or tool selection. Keeping the LLM to a single step keeps the pipeline cheap, fast, and easy to debug. If Gemini's output cannot be parsed as JSON, the request fails and **nothing is written to the cache**.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, plain CSS (custom properties), ESLint 10 |
| Backend | Node.js (18+), Express 5, layered structure: routes → controllers → services |
| Database | MongoDB (Atlas) via Mongoose 9, used as a cache |
| AI | Google Gemini `gemini-2.5-flash` via `@google/genai` |
| External data | [mobile-specs-api](https://github.com/RevengerNick/mobile-specs-api) — a separate, third-party, unofficial GSMArena scraper API (Fastify + TypeScript), run as its own service |
| Other | `cors`, `dotenv`, `nodemon` (dev), native `fetch` |

## Project structure

```
Phone-specs-app/
├── backend/
│   ├── server.js                     # entry point: env, DB connect, middleware, routes
│   ├── config/db.js                  # MongoDB connection (exits process on failure)
│   ├── routes/
│   │   ├── health.routes.js
│   │   └── phone.routes.js           # /brands, /brands/:brandSlug, /:slug
│   ├── controllers/
│   │   ├── health.controller.js
│   │   └── phone.controller.js       # request handling, error → 500
│   ├── services/
│   │   ├── cacheService.js           # cache-aside logic, 24h TTL
│   │   ├── scoringService.js         # persona-weighted scoring
│   │   ├── dataSources/specsApi.js   # wrapper for the external specs API
│   │   └── agentPipeline/
│   │       ├── pipeline.js           # fetch → clean → verdict
│   │       ├── analyst.js
│   │       └── verdict.js
│   ├── models/Phone.js               # Mongoose schema
│   └── scripts/                      # manual test scripts (see below)
└── frontend/
    └── src/
        ├── App.jsx                   # screen state: brands → phones → detail
        ├── api.js                    # all backend calls
        └── components/
            ├── Header.jsx
            ├── BrandList.jsx
            ├── PhoneList.jsx
            ├── PhoneDetail.jsx       # verdict, persona switcher, specs
            └── SignalMeter.jsx       # 10-segment score meter
```

## Getting started

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster (or any MongoDB URI), a Gemini API key, and `pnpm` (or npm) for the specs API.

Start the three services in this order, each in its own terminal.

### 1. Specs API (external, port 4000)

```bash
git clone https://github.com/RevengerNick/mobile-specs-api.git
cd mobile-specs-api
pnpm install
pnpm dev          # serves http://localhost:4000
```

Its source is not part of this repository.

### 2. Backend (port 5000)

```bash
cd backend
npm install
# create backend/.env  (see Configuration below)
npm run dev       # nodemon; use `npm start` for plain node
```

Check it: open `http://localhost:5000/health` — expect `"database": "connected"`. If it says `not connected`, check `MONGO_URI` and your Atlas IP allow-list.

### 3. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Other frontend scripts: `npm run build`, `npm run preview`, `npm run lint`.

> The frontend calls the backend at `http://localhost:5000/api/phones`, hardcoded in `frontend/src/api.js`. Change `API_BASE` there if your backend runs elsewhere.

## Configuration

Create `backend/.env` (it is git-ignored; there is no `.env.example` in the repo):

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
GEMINI_API_KEY=your_gemini_api_key
SPECS_API_BASE_URL=http://127.0.0.1:4000   # optional, this is the default
PORT=5000                                  # optional, this is the default
```

`127.0.0.1` is used instead of `localhost` because on some Windows setups `fetch` resolves `localhost` to IPv6 (`::1`) first and fails even when the server is running.

## API reference

Base URL: `http://localhost:5000`

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{ status, database, timestamp }`. `database` is `connected` or `not connected`. |
| GET | `/api/phones/brands` | All brands, as an object keyed by brand name, e.g. `{ "Apple": { brand_slug, device_count, ... } }`. Proxied from the specs API, not cached. |
| GET | `/api/phones/brands/:brandSlug` | Devices for a brand (array with `name`, `slug`, `imageUrl`), e.g. `apple-phones-48`. Proxied, not cached. |
| GET | `/api/phones/:slug?persona=` | Core route. `persona` is `gamer`, `contentCreator`, or `everyday` (default). |

**Example**

```
GET /api/phones/apple_iphone_17e-14487?persona=gamer
```

```jsonc
{
  "cleaned": {
    "model": "...", "brand": "...", "imageUrl": "...", "releaseDate": "...",
    "chipset": "...", "cpu": "...", "gpu": "...",
    "ram": "8GB RAM", "storageOptions": "...",
    "displayType": "...", "displaySize": "...",
    "mainCamera": "...", "selfieCamera": "...",
    "batteryType": "...", "charging": "...",
    "priceRaw": "...", "isLikelyPhone": true
  },
  "verdict": { "verdict": "Buy", "summary": "...", "pros": ["..."], "cons": ["..."] },
  "score": 6.4,
  "scoreBreakdown": {
    "raw":        { "ram": 8, "battery": 5000, "camera": 50, "price": 799 },
    "normalized": { "ram": 3.3, "battery": 6.7, "camera": 4.2, "price": 5.4 },
    "weights":    { "ram": 0.35, "battery": 0.35, "camera": 0.1, "price": 0.2 }
  },
  "fromCache": true
}
```

(Values above are illustrative.)

**Errors:** every failure currently returns HTTP `500` with `{ "error": "<message>" }` — including an unknown persona, an unknown slug, an upstream failure, or a Gemini failure. Proper 400/404/502 codes are on the roadmap.

## Scoring engine

`services/scoringService.js` is deterministic JavaScript — no LLM. It extracts four numbers from the cleaned text, normalizes each to 0–10 with min–max scaling (clamped to a range), then computes a weighted average.

| Metric | Extracted from | Normalization range | Direction |
|---|---|---|---|
| RAM | `cleaned.ram` (`8GB RAM`) | 4 – 16 GB | higher is better |
| Battery | `cleaned.batteryType` (`… 5000 mAh`) | 3000 – 6000 mAh | higher is better |
| Camera | `cleaned.mainCamera` (first `NN MP`) | 8 – 108 MP | higher is better |
| Price | `cleaned.priceRaw` (`$` amounts only) | $200 – $1500 | **lower is better** (inverted) |

If a value cannot be extracted, that metric gets a neutral **5**.

| Persona | RAM | Battery | Camera | Price |
|---|---|---|---|---|
| `gamer` | 0.35 | 0.35 | 0.10 | 0.20 |
| `contentCreator` | 0.15 | 0.15 | 0.50 | 0.20 |
| `everyday` | 0.20 | 0.25 | 0.25 | 0.30 |

`score = round1( Σ(normalized × weight) / Σ(weights) )`

**Worked example** (hypothetical phone: 8 GB, 5000 mAh, 50 MP, $999, `everyday`):
RAM 3.33, battery 6.67, camera 4.20, price 3.85 →
`3.33×0.20 + 6.67×0.25 + 4.20×0.25 + 3.85×0.30 = 4.54` → **4.5**.

The normalization ranges and weights are hand-picked heuristics, not validated against user data.

## Data model & caching

One MongoDB collection (`phones`, Mongoose model `Phone`):

| Field | Type | Notes |
|---|---|---|
| `slug` | String | required, unique, indexed — the cache key |
| `cleaned` | Mixed | output of `analyst.js` |
| `verdict` | Mixed | output of `verdict.js` |
| `cachedAt` | Date | freshness is checked in application code against a 24-hour TTL |

- Writes use `findOneAndUpdate(..., { upsert: true })`, so a new phone and a stale refresh use the same path.
- A stale entry is refreshed on the next request; if that refresh fails, the request errors (stale data is not served as a fallback).
- There is no MongoDB TTL index; expired documents remain until overwritten.

## Test scripts

Manual scripts in `backend/scripts/` (no automated test framework yet; `npm test` is a placeholder). Run from `backend/`, with the specs API running and `.env` set:

| Script | Purpose | Needs |
|---|---|---|
| `node scripts/testSpecsApi.js` | brands → phones → details chain | specs API |
| `node scripts/testAnalyst.js` | fetch + clean, prints cleaned object | specs API |
| `node scripts/testVerdict.js` | fetch + clean + real Gemini call | specs API, Gemini key |
| `node scripts/testScoring.js` | scores one phone under all three personas | specs API, Gemini key, MongoDB |
| `node scripts/testCache.js` | two calls for the same slug, prints miss/hit timing | specs API, Gemini key, MongoDB |

The scripts use hardcoded slugs (`apple-phones-48` and `apple_iphone_17e-14487`); replace them if those no longer exist upstream.

## Known limitations

**Data and scoring**
- The specs API's `/search` endpoint is unreliable, so the app browses brand → device list instead of offering free-text search. `searchPhones()` exists in `specsApi.js` but is unused.
- No benchmark data (e.g. AnTuTu) is available, so scoring uses only RAM, battery, main-camera MP, and price. Chipset, GPU, and display are **not** scored, even for the Gamer persona.
- Price parsing only recognizes `$`; prices in other currencies are treated as missing (neutral 5).
- The analyst reads main camera from the `Triple` or `Single` keys only, so phones with `Dual` or `Quad` cameras get a missing (neutral 5) camera score.
- RAM is taken from the first `NGB RAM` match, which may not represent every variant.
- `isLikelyPhone` is computed but not used; iPad/Watch filtering happens on the frontend by name pattern.

**AI**
- The Gemini verdict does not receive the persona, so it is the same for all personas while the score changes. The two can disagree.
- The verdict JSON is parsed but its shape is not validated (e.g. missing `pros` would break the UI). Gemini structured-output mode is not used.
- If Gemini is down, uncached phones cannot be looked up. No retry or timeout is implemented.

**API, security, operations**
- No authentication, rate limiting, or input validation; `cors()` is fully open. Since any valid slug can trigger a paid Gemini call, a public deployment would need rate limiting.
- All errors return HTTP 500 with the raw error message.
- The slug is interpolated into the upstream URL without encoding.
- Two simultaneous requests for the same uncached phone both run the full pipeline.
- Brand and device lists are not cached; each browse hits the upstream scraper.
- The frontend refetches the whole phone payload when the persona changes and does not cancel in-flight requests.
- The frontend API URL is hardcoded to `localhost:5000`.
- No automated tests and no deployment configuration.
- The specs API is a separate service that must also be hosted for any deployment.

## Roadmap

- Include the persona in the verdict prompt (or derive the verdict from the score) and validate the response shape, ideally with Gemini structured output
- Input validation with proper status codes (400 / 404 / 502)
- Rate limiting, request timeouts, and retries; restrict CORS
- Cache brand/device lists; add a MongoDB TTL index and request coalescing
- Score chipset/GPU/display when a reliable data source is available; support more currencies and camera layouts
- Move `API_BASE` to a Vite environment variable
- Automated tests (unit tests for `analyst` and `scoringService` first)
- Deploy backend, specs API, and frontend; add a live demo link

## Credits & data source

- Spec data comes from [mobile-specs-api](https://github.com/RevengerNick/mobile-specs-api) by RevengerNick, an unofficial, MIT-licensed scraper of GSMArena.com. Review GSMArena's terms of use before any public or commercial deployment.
- The `SignalMeter` component was adapted from a Lovable design exploration and rewritten in plain JS/CSS.
- Verdict text is generated by Google Gemini and can be wrong; treat it as a starting point, not buying advice.
