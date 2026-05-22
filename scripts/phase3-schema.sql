-- Phase 3 schema: add cover_image to ideas table
-- Run this in Supabase SQL Editor → New query → Run

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
