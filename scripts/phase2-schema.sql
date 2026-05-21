-- Phase 2 schema additions
-- Run this in Supabase SQL Editor → New query → Run

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS category    TEXT DEFAULT 'ai-tech-automation',
  ADD COLUMN IF NOT EXISTS tone        TEXT DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai',
  ADD COLUMN IF NOT EXISTS post_id     UUID REFERENCES posts(id) ON DELETE SET NULL;

-- Auto-update updated_at on ideas changes (if trigger doesn't exist yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ideas_updated_at'
  ) THEN
    CREATE TRIGGER ideas_updated_at
      BEFORE UPDATE ON ideas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
