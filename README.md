# IRE Conference Planner

Conference planning and management app, built with Claude.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (auth + PostgreSQL) · Vercel

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- Google OAuth configured in your Supabase project (see below)

### Local development

```bash
# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.local.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

See [`.env.local.example`](.env.local.example) for all required variables with descriptions.

---

## CI

GitHub Actions runs type-check, lint, and build on every push and pull request to `main`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
