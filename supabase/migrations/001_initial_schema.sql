-- ============================================================
-- 001_initial_schema.sql
-- Run this in the Supabase SQL editor to set up the schema.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Conferences ─────────────────────────────────────────────
create table conferences (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  year                integer,
  location            text,
  starts_at           date,
  ends_at             date,
  is_current          boolean not null default false,
  -- "r332qxb5" style key — used to build the /view/All API URL
  sessionize_api_key  text,
  -- Numeric event ID (e.g. "22653") — used in organizer deep links:
  --   https://sessionize.com/app/organizer/session/{event_id}/{session_id}
  --   https://sessionize.com/app/organizer/speaker/{event_id}/{speaker_id}
  sessionize_event_id text,
  created_at          timestamptz not null default now()
);

-- Only one conference may be marked current at a time.
create unique index conferences_one_current_idx
  on conferences (is_current)
  where is_current = true;

-- ── Rooms ────────────────────────────────────────────────────
create table rooms (
  id            integer  not null,
  conference_id uuid     not null references conferences (id) on delete cascade,
  name          text     not null,
  sort          integer,
  primary key (id, conference_id)
);

-- ── Categories & items ───────────────────────────────────────
create table categories (
  id            integer  not null,
  conference_id uuid     not null references conferences (id) on delete cascade,
  title         text     not null,
  type          text,                -- "session" or "speaker"
  sort          integer,
  primary key (id, conference_id)
);

create table category_items (
  id            integer  not null,
  conference_id uuid     not null references conferences (id) on delete cascade,
  category_id   integer  not null,
  name          text     not null,
  sort          integer,
  primary key (id, conference_id),
  foreign key (category_id, conference_id) references categories (id, conference_id) on delete cascade
);

-- ── Speakers ─────────────────────────────────────────────────
create table speakers (
  id               text    not null,  -- Sessionize UUID
  conference_id    uuid    not null references conferences (id) on delete cascade,
  first_name       text,
  last_name        text,
  full_name        text,
  bio              text,
  tag_line         text,
  profile_picture  text,
  links            jsonb   not null default '[]',
  question_answers jsonb   not null default '[]',
  primary key (id, conference_id)
);

-- ── Sessions ─────────────────────────────────────────────────
create table sessions (
  id                 text     not null,  -- Sessionize ID (integer or UUID depending on event)
  conference_id      uuid     not null references conferences (id) on delete cascade,
  title              text     not null,
  description        text,
  starts_at          timestamptz,
  ends_at            timestamptz,
  room_id            integer,
  status             text,
  is_confirmed       boolean  not null default false,
  is_plenum_session  boolean  not null default false,
  is_service_session boolean  not null default false,
  live_url           text,
  recording_url      text,
  question_answers   jsonb    not null default '[]',
  primary key (id, conference_id),
  foreign key (room_id, conference_id) references rooms (id, conference_id) on delete set null
);

-- ── Session ↔ Speaker ────────────────────────────────────────
create table session_speakers (
  session_id    text     not null,
  speaker_id    text     not null,
  conference_id uuid     not null references conferences (id) on delete cascade,
  primary key (session_id, speaker_id, conference_id),
  foreign key (session_id, conference_id) references sessions (id, conference_id) on delete cascade,
  foreign key (speaker_id, conference_id) references speakers (id, conference_id) on delete cascade
);

-- ── Session ↔ Category item ──────────────────────────────────
create table session_category_items (
  session_id       text     not null,
  category_item_id integer  not null,
  conference_id    uuid     not null references conferences (id) on delete cascade,
  primary key (session_id, category_item_id, conference_id),
  foreign key (session_id, conference_id) references sessions (id, conference_id) on delete cascade,
  foreign key (category_item_id, conference_id) references category_items (id, conference_id) on delete cascade
);
