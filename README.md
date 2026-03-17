# IRE Conference Planner

Internal conference planning and management app for organizing events with 1,000–2,000 attendees.

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

## Supabase setup

### 1. Google OAuth

In your Supabase dashboard → Authentication → Providers → Google:

- Enable Google provider
- Add your Google OAuth client ID and secret (from Google Cloud Console)
- Set the authorized redirect URI to `https://your-project.supabase.co/auth/v1/callback`

To restrict login to your Google Workspace domain:
- Set `GOOGLE_WORKSPACE_DOMAIN=yourorg.org` in your environment
- The middleware rejects any signed-in user whose email doesn't match

### 2. Database schema

Run the following in the Supabase SQL editor (migrations will be added to `supabase/migrations/` as the schema evolves):

```sql
-- Rooms
create table rooms (
  id integer primary key,
  name text not null,
  sort integer
);

-- Categories
create table categories (
  id integer primary key,
  title text not null,
  type text,
  sort integer
);

create table category_items (
  id integer primary key,
  category_id integer references categories(id),
  name text not null,
  sort integer
);

-- Speakers
create table speakers (
  id text primary key,
  first_name text,
  last_name text,
  full_name text,
  bio text,
  tag_line text,
  profile_picture text,
  links jsonb default '[]',
  question_answers jsonb default '[]'
);

-- Sessions
create table sessions (
  id integer primary key,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  room_id integer references rooms(id),
  status text,
  is_confirmed boolean default false,
  is_plenum_session boolean default false,
  is_service_session boolean default false,
  live_url text,
  recording_url text,
  question_answers jsonb default '[]'
);

-- Session <-> Speaker (many-to-many)
create table session_speakers (
  session_id integer references sessions(id) on delete cascade,
  speaker_id text references speakers(id) on delete cascade,
  primary key (session_id, speaker_id)
);
```

---

## Sessionize sync

Fetch fresh data from Sessionize and upsert into your database:

```bash
curl -X POST https://your-app.vercel.app/api/sessionize/sync \
  -H "Authorization: Bearer YOUR_SYNC_SECRET"
```

To run automatically, add a Vercel Cron Job or a GitHub Actions schedule that calls this endpoint.

---

## Magic links

Unauthenticated share pages live at `/share/[token]`. Anyone with the link can view the page — no sign-in required. Token validation logic lives in [`app/(public)/share/[token]/page.tsx`](app/(public)/share/[token]/page.tsx).

---

## CI

GitHub Actions runs type-check, lint, and build on every push and pull request to `main`. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
