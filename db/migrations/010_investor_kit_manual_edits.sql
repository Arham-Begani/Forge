-- 010_investor_kit_manual_edits.sql
-- Add manual edit tracking to investor_kits for AI/manual coexistence

ALTER TABLE investor_kits
  ADD COLUMN IF NOT EXISTS has_manual_edits boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz NULL;
