-- Run this once in the Supabase SQL Editor
-- Stores OAuth tokens and other key-value settings for the admin CMS

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- No public RLS needed — this table is only accessed via supabaseAdmin (service_role)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
