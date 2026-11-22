# Talk to Supabase Postgres with plain SQL, not the Supabase REST client

The app reads and writes Supabase's Postgres through a standard Postgres driver and plain SQL, using Supabase's connection pooler from Vercel. It does not use the Supabase JavaScript client for data. This lets every query run unchanged against PGlite (Postgres inside Node) in tests, so the API can be tested end to end without Docker, which this machine cannot run. Supabase is still used for Google sign-in (ADR 0002). Role and privacy checks therefore live in the API code, not in Supabase row-level security.
