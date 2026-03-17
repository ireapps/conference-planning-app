# Deployment Guide

This guide walks through deploying the app from scratch. No accounts are assumed. The entire stack — GitHub, Supabase, Google Cloud, and Vercel — has a free tier that comfortably covers this use case.

**Services you'll set up:**

| Service | Purpose | Cost |
|---|---|---|
| [GitHub](https://github.com) | Version control + CI | Free |
| [Supabase](https://supabase.com) | PostgreSQL database + Google auth | Free tier |
| [Google Cloud Console](https://console.cloud.google.com) | Google OAuth credentials | Free |
| [Vercel](https://vercel.com) | Hosting + deploys | Free hobby tier |

Estimated time: 45–60 minutes.

---

## 1. GitHub

### 1.1 Create an account

Go to [github.com](https://github.com) and create an account if you don't have one.

### 1.2 Create a repository

1. Click **+** → **New repository**
2. Name it `conference-planning-app` (or anything you like)
3. Set it to **Private**
4. Do **not** initialize with a README — you already have one
5. Click **Create repository**

### 1.3 Push the code

In your project directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/conference-planning-app.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 2. Supabase

### 2.1 Create an account and project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New project**
3. Choose an organization (create one if prompted — use your org's name)
4. Fill in:
   - **Name:** `conference-planning-app`
   - **Database password:** generate a strong one and save it somewhere safe
   - **Region:** choose the one geographically closest to your team
5. Click **Create new project** — provisioning takes ~2 minutes

### 2.2 Note your API credentials

Once the project is ready:

1. Go to **Project Settings** (gear icon, bottom of sidebar) → **API**
2. Copy and save these two values — you'll need them later:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon / public** key — a long JWT string under "Project API keys"

> Do not use the `service_role` key in your app. The anon key is correct here.

### 2.3 Note the OAuth callback URL

1. Go to **Authentication** → **Providers** → **Google**
2. You'll see a **Callback URL (for OAuth)** field at the top — copy it. It looks like:
   ```
   https://abcdefghijkl.supabase.co/auth/v1/callback
   ```
3. Keep this tab open — you'll come back to paste in Google credentials in step 4.

---

## 3. Google Cloud Console

You need a Google account to access the Cloud Console. If your organization uses Google Workspace, sign in with your Workspace account so the OAuth app lives under your org's umbrella.

### 3.1 Create a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project selector at the top → **New Project**
3. **Project name:** `Conference Planner` (or similar)
4. Click **Create**
5. Make sure the new project is selected in the dropdown before continuing

### 3.2 Enable the required API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search for **"Google People API"**
3. Click it → **Enable**

### 3.3 Configure the OAuth consent screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. For **User Type**, select **Internal**
   - This automatically restricts sign-in to users within your Google Workspace — no further domain checking needed at the OAuth level.
   - If your Google account is a personal Gmail (not Workspace), choose **External** instead, then add your domain under "Test users" for now.
3. Click **Create**
4. Fill in:
   - **App name:** `Conference Planner`
   - **User support email:** your email
   - **Developer contact email:** your email
5. Click **Save and Continue** through the Scopes and Test users screens (no changes needed)
6. Click **Back to Dashboard**

### 3.4 Create OAuth credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. **Application type:** Web application
4. **Name:** `Conference Planner Web`
5. Under **Authorized redirect URIs**, click **+ Add URI** and paste the Supabase callback URL you copied in step 2.3:
   ```
   https://abcdefghijkl.supabase.co/auth/v1/callback
   ```
6. Click **Create**
7. A dialog shows your **Client ID** and **Client Secret** — copy both and save them

---

## 4. Back to Supabase: finish auth setup

### 4.1 Enable Google provider

1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable Sign in with Google** to on
3. Paste in your **Client ID** and **Client Secret** from step 3.4
4. Click **Save**

### 4.2 Add allowed redirect URLs

This tells Supabase which URLs are allowed after a successful login.

1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. Click **Save** — you'll add the production Vercel URL after deployment (step 6.3)

### 4.3 Run the database migration

1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) from this repo and paste its entire contents into the editor
4. Click **Run** — you should see "Success. No rows returned"

### 4.4 Disable Row Level Security on app tables

The app enforces authentication at the routing layer (all dashboard routes require a signed-in user). For simplicity, disable RLS on the tables that the app reads and writes. Run this in a new SQL editor query:

```sql
alter table conferences           disable row level security;
alter table rooms                 disable row level security;
alter table categories            disable row level security;
alter table category_items        disable row level security;
alter table speakers              disable row level security;
alter table sessions              disable row level security;
alter table session_speakers      disable row level security;
alter table session_category_items disable row level security;
```

> If you later want fine-grained per-row access control (e.g. multi-org support), you can re-enable RLS and write policies at that point.

### 4.5 Add your first conference

In a new SQL editor query, insert a row for your first conference. Replace the placeholder values:

```sql
insert into conferences (
  name,
  year,
  location,
  starts_at,
  ends_at,
  is_current,
  sessionize_api_key,
  sessionize_event_id
) values (
  'IRE 2026',             -- full conference name
  2026,
  'Oxon Hill, MD',        -- city/venue
  '2026-06-18',           -- start date
  '2026-06-21',           -- end date
  true,                   -- marks this as the current conference
  'r332qxb5',             -- the short key from your Sessionize /view/All URL
  '22653'                 -- the numeric ID from Sessionize organizer URLs
);
```

**Finding your Sessionize IDs:**
- **`sessionize_api_key`** — visible in your Sessionize API URL: `https://sessionize.com/api/v2/`**`r332qxb5`**`/view/All`
- **`sessionize_event_id`** — visible in Sessionize organizer links: `https://sessionize.com/app/organizer/session/`**`22653`**`/...`

After running, copy the `id` value from the result (a UUID). You'll need it in step 6.4 to run the first sync.

---

## 5. Vercel

### 5.1 Create an account

Go to [vercel.com](https://vercel.com) and sign up — use "Continue with GitHub" for the easiest setup.

### 5.2 Import the repository

1. On the Vercel dashboard, click **Add New** → **Project**
2. Find your `conference-planning-app` repository and click **Import**
3. Vercel should auto-detect it as a Next.js project — no framework settings changes needed

### 5.3 Set environment variables

Before clicking Deploy, expand the **Environment Variables** section and add each of the following:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (e.g. `https://abcdefghijkl.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_WORKSPACE_DOMAIN` | Your org's email domain (e.g. `yourorg.org`) |
| `GOOGLE_WORKSPACE_DOMAIN` | Same domain — this is the server-side hard check |
| `SYNC_SECRET` | A random secret — generate one with `openssl rand -base64 32` |

> `SYNC_SECRET` protects the `/api/sessionize/sync` endpoint. Keep it out of version control — only set it here in Vercel and nowhere else.

### 5.4 Deploy

Click **Deploy**. Vercel will build and deploy the app. The first deploy takes ~1–2 minutes.

Once it completes, copy your production URL — it looks like `https://conference-planning-app.vercel.app` or a custom domain if you've set one.

---

## 6. Post-deployment wiring

### 6.1 Add production URL to Supabase

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add your production callback URL:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
3. Click **Save**

### 6.2 Add production URL to Google Cloud Console

1. Go back to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your OAuth client
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
4. Click **Save**

### 6.3 Test login

Open your production URL and click **Sign in with Google**. You should be redirected to Google, prompted to sign in with your org account, and land on the conferences list.

If you see "Access is restricted to organization accounts only," your email domain doesn't match `GOOGLE_WORKSPACE_DOMAIN`. Double-check the value in Vercel's environment variables.

### 6.4 Run the first Sessionize sync

Use the UUID of the conference you inserted in step 4.5. Replace `YOUR_CONFERENCE_UUID` and `YOUR_SYNC_SECRET` with the real values:

```bash
curl -X POST https://your-app.vercel.app/api/sessionize/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SYNC_SECRET" \
  -d '{"conferenceId": "YOUR_CONFERENCE_UUID"}'
```

A successful response looks like:

```json
{
  "ok": true,
  "conference": "IRE 2025",
  "synced": {
    "rooms": 15,
    "categories": 4,
    "speakers": 247,
    "sessions": 183
  }
}
```

Navigate to your conference's sessions and speakers pages — data should now appear.

---

## 7. Local development setup

```bash
# Install dependencies
npm install

# Copy the env template
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values from steps 2.2 and 5.3. Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The `http://localhost:3000/api/auth/callback` redirect URL you added to Supabase in step 4.2 allows Google login to work locally.

To sync data locally:

```bash
curl -X POST http://localhost:3000/api/sessionize/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SYNC_SECRET" \
  -d '{"conferenceId": "YOUR_CONFERENCE_UUID"}'
```

---

## 8. Adding a new conference

When you're starting to plan a new conference:

1. In Supabase SQL Editor, insert a new row — set `is_current = false` initially if the previous conference is still active:

   ```sql
   insert into conferences (name, year, location, starts_at, ends_at, is_current, sessionize_api_key, sessionize_event_id)
   values ('IRE 2026', 2026, 'City, ST', '2026-06-18', '2026-06-21', false, 'NEW_API_KEY', 'NEW_EVENT_ID');
   ```

2. Copy the new conference's UUID from the result.

3. Run the sync for it:

   ```bash
   curl -X POST https://your-app.vercel.app/api/sessionize/sync \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SYNC_SECRET" \
     -d '{"conferenceId": "NEW_CONFERENCE_UUID"}'
   ```

4. When ready to make it the current conference, update both rows in one transaction:

   ```sql
   begin;
     update conferences set is_current = false where is_current = true;
     update conferences set is_current = true  where id = 'NEW_CONFERENCE_UUID';
   commit;
   ```

The app will automatically redirect the root URL to the new current conference's sessions.

---

## 9. Continuous deployment

Vercel watches your `main` branch. Every `git push origin main` triggers a new production deploy automatically — no action required.

GitHub Actions runs type-check, lint, and build on every push and pull request to `main`. Check the **Actions** tab on your GitHub repo to see CI status.

---

## Troubleshooting

**Login redirects back to `/login` immediately**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in Vercel
- Confirm the production callback URL was added to both Supabase (step 6.1) and Google Cloud Console (step 6.2)

**"Access is restricted to organization accounts only"**
- `GOOGLE_WORKSPACE_DOMAIN` in Vercel doesn't match the email domain of the account you signed in with
- Check for typos (e.g. `yourorg.org` vs `yourorg.com`)

**Sync returns 401**
- The `Authorization: Bearer` value doesn't match `SYNC_SECRET` in Vercel

**Sync returns 404**
- The `conferenceId` UUID in the request body doesn't match any row in the `conferences` table
- Confirm the UUID by running `select id, name from conferences;` in the Supabase SQL editor

**Sessions/speakers pages show "No data yet"**
- Run the sync (step 6.4) and check the response for any errors
- If the sync succeeds but pages are still empty, confirm RLS was disabled (step 4.4)
