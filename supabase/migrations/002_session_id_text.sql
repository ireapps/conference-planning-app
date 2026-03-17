-- ============================================================
-- 002_session_id_text.sql
-- Sessionize uses integer session IDs for some events and UUIDs
-- for others. Change the session id columns to text to handle both.
--
-- Run this if you already ran 001. If you haven't run 001 yet,
-- the updated version there already uses text — skip this file.
-- ============================================================

-- Drop FK constraints that reference sessions.id before altering the type.
alter table session_speakers
  drop constraint session_speakers_session_id_conference_id_fkey;

alter table session_category_items
  drop constraint session_category_items_session_id_conference_id_fkey;

-- Widen the columns.
alter table sessions
  alter column id type text using id::text;

alter table session_speakers
  alter column session_id type text;

alter table session_category_items
  alter column session_id type text;

-- Re-add the FK constraints.
alter table session_speakers
  add constraint session_speakers_session_id_conference_id_fkey
  foreign key (session_id, conference_id)
  references sessions (id, conference_id)
  on delete cascade;

alter table session_category_items
  add constraint session_category_items_session_id_conference_id_fkey
  foreign key (session_id, conference_id)
  references sessions (id, conference_id)
  on delete cascade;
