-- 005_cohorts.sql — Cohort Mode: run multiple venture variants from a single idea

CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Cohort',
  core_idea TEXT NOT NULL,
  variant_ids UUID[] NOT NULL DEFAULT '{}',
  winner_id UUID,
  comparison JSONB DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'running', 'comparing', 'complete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cohorts_user ON cohorts(user_id);
