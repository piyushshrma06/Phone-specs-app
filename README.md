# Verdict — AI-Powered Phone Advisor

An autonomous, AI-driven phone advisor that scores any phone 0–10 against a user's persona (Gamer, Content Creator, or Everyday User) and gives a Buy/Pass verdict with reasoning — combining a cache-aside backend architecture, a multi-agent pipeline, and custom persona-weighted scoring logic.

**Live demo:** _(add your deployed link here once deployed)_

---

## The Problem

Phone specs are full of jargon (chipsets, RAM, sensor sizes) that most buyers can't translate into "is this right for me?" Static comparison sites also can't account for the fact that a great phone for a gamer might be the wrong pick for a content creator. Verdict solves both: it fetches live specs, has an AI agent reason over them, and scores the result against exactly what the user cares about.

## Architecture

### Cache-aside pattern

Every phone lookup checks MongoDB first. On a **cache hit** (data younger than 24 hours), the result returns instantly with zero API cost. On a **cache miss**, the agent pipeline runs, and the result is saved back to MongoDB for the next user.

Measured impact on a real request: **11,630ms on a cache miss vs 28ms on a cache hit** — roughly a 400x speedup, and zero repeated LLM cost for a phone that's already been looked up.

### Multi-agent pipeline

Instead of one large prompt, the backend runs three agents with a single responsibility each:

1. **Researcher** (`services/dataSources/specsApi.js`) — fetches raw phone data from a self-hosted GSMArena specs API (browse-by-brand, since the API's own search endpoint doesn't work reliably)
2. **Analyst** (`services/agentPipeline/analyst.js`) — pure JS logic that flattens the messy, HTML-laden raw response into a clean, predictable object (strips embedded `<a>` tags, extracts RAM/battery/price as plain values, flags non-phone devices like iPads/Watches)
3. **Verdict** (`services/agentPipeline/verdict.js`) — the only agent that calls an LLM (Gemini). Takes the cleaned data and produces a structured Buy/Pass call with a summary and pros/cons

Only the Verdict step calls an LLM — Research and Analysis are deterministic, which keeps the pipeline fast, cheap, and easy to debug.

### Persona-based scoring engine

`services/scoringService.js` is pure, deterministic JavaScript — no LLM involved. It extracts numeric values from the cleaned spec text (RAM, battery mAh, camera MP, price), normalizes each to a 0–10 scale, and applies persona-specific weights:

| Persona | RAM | Battery | Camera | Price |
|---|---|---|---|---|
| Gamer | 0.35 | 0.35 | 0.10 | 0.20 |
| Content Creator | 0.15 | 0.15 | 0.50 | 0.20 |
| Everyday User | 0.20 | 0.25 | 0.25 | 0.30 |

The same phone scores differently depending on who's asking — that's the actual point of the engine.

## Tech Stack

- **Frontend:** React (Vite), plain CSS with custom design tokens
- **Backend:** Node.js, Express, Service-Oriented Architecture (routes → controllers → services)
- **Database:** MongoDB Atlas (cache-aside layer)
- **AI:** Google Gemini API (`gemini-2.5-flash`) for the Verdict agent only
- **External data:** a self-hosted, open-source GSMArena specs API (used as a live data source, not scraped directly)

## Project Structure

```
phone-specs-app/
├── backend/
│   ├── config/           # MongoDB connection
│   ├── controllers/      # request handlers
│   ├── routes/           # thin route definitions
│   ├── services/
│   │   ├── agentPipeline/    # analyst.js, verdict.js, pipeline.js
│   │   ├── dataSources/      # specsApi.js
│   │   ├── cacheService.js   # cache-aside logic
│   │   └── scoringService.js # persona-weighted scoring
│   ├── models/            # Mongoose schemas
│   └── server.js
└── frontend/
    └── src/
        ├── components/     # BrandList, PhoneList, PhoneDetail, SignalMeter
        └── api.js
```

## Running Locally

**1. Specs API** (external data source, separate service):
Clone and run [mobile-specs-api](https://github.com/RevengerNick/mobile-specs-api) — a third-party open-source GSMArena scraper API. Runs on `localhost:4000`. This project consumes it over HTTP; its source is not included here.

**2. Backend:**
```
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, GEMINI_API_KEY, SPECS_API_BASE_URL
npm run dev
```
Runs on `localhost:5000`.

**3. Frontend:**
```
cd frontend
npm install
npm run dev
```
Runs on `localhost:5173`.

## Known Limitations

- The specs API's own `/search` endpoint doesn't return results reliably — the app works around this by browsing brand → device list instead of free-text search
- No numeric benchmark data (e.g. AnTuTu) is available from the source, so the scoring engine extracts and normalizes RAM/battery/camera/price from spec text instead
- If the Verdict agent (Gemini) fails or returns unparseable output, the request fails loudly rather than silently caching a broken result — by design, but means a Gemini outage currently blocks new (uncached) lookups
