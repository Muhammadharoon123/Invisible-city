# One Next.js app on Vercel, with Supabase Postgres and Cloudinary

The original idea document proposed a separate Python FastAPI backend. With six days to the 28 November 2026 deadline and a working Next.js app already in place, we keep a single Next.js app whose API routes are the backend, deployed to Vercel. Vercel cannot keep files written to local disk, so the current SQLite file and local `data/uploads` folder are replaced: Supabase Postgres holds the data and Cloudinary holds the photos. An earlier deployment using MongoDB lived outside this repository and is not carried forward.

## Considered Options

- **Python FastAPI + Next.js frontend**: rejected. Two deployments and a second language for no feature gain within the deadline.
- **Keep SQLite**: rejected. Data would not survive on Vercel.
- **MongoDB (used by the earlier deployment)**: rejected. Issues, Reports, Offices and Citizens are relational, and Supabase also offers Google sign-in.
