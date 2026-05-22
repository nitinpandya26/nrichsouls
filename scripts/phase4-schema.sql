-- Phase 4 schema: content image + Instagram carousel images on ideas table
-- Run this in Supabase SQL Editor → New query → Run

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS content_image   TEXT    DEFAULT '';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS carousel_images JSONB   DEFAULT '[]';
