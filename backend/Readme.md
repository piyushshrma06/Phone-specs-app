# Phone Advisor Backend — Step 1

Backend skeleton with Express + MongoDB, ready for the agent pipeline to be built on top.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your real MongoDB Atlas connection string:
   ```
   cp .env.example .env
   ```

3. Run the server:
   ```
   npm run dev
   ```
   (uses nodemon, auto-restarts on file changes)

4. Test the health check:
   Open `http://localhost:5000/health` in your browser or Postman.
   You should see:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "..."
   }
   ```
   If `database` says "not connected", check your `MONGO_URI` in `.env` — most
   common cause is not whitelisting your IP in MongoDB Atlas network access settings.

## Folder structure

- `server.js` — entry point, wires everything together
- `config/db.js` — MongoDB connection logic
- `routes/` — thin route definitions (URL → controller mapping only)
- `controllers/` — actual request-handling logic
- `services/agentPipeline/` — Researcher, Analyst, Verdict agents (Step 2-4)
- `services/dataSources/` — wrappers around specs API and pricing data
- `models/` — Mongoose schemas for cached phone data (Step 5)

## Next step

This is a separate project from `mobile-specs-api`. Run that repo on its own
port (e.g. 4000) and this backend on its own port (5000) — this backend will
call the specs API over HTTP as an external data source, not import its code.