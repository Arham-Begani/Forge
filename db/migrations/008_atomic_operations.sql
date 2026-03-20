-- 008_atomic_operations.sql
-- RPC functions for atomic operations to fix concurrency issues

-- Atomic increment for integer columns (used for views counters)
CREATE OR REPLACE FUNCTION increment_int_column(
  table_name TEXT,
  id_val UUID,
  col_name TEXT
)
RETURNS VOID AS $$
DECLARE
  query TEXT;
BEGIN
  query := format('UPDATE %I SET %I = %I + 1 WHERE id = %L', table_name, col_name, col_name, id_val);
  EXECUTE query;
END;
$$ LANGUAGE plpgsql;

-- Atomic append to JSONB array (used for stream_output)
CREATE OR REPLACE FUNCTION append_to_jsonb_array(
  table_name TEXT,
  id_val UUID,
  col_name TEXT,
  new_value TEXT
)
RETURNS VOID AS $$
DECLARE
  query TEXT;
BEGIN
  query := format('UPDATE %I SET %I = %I || %L::jsonb WHERE id = %L', 
    table_name, col_name, col_name, to_jsonb(new_value), id_val);
  EXECUTE query;
END;
$$ LANGUAGE plpgsql;

-- Atomic read-modify-write for venture context (prevents race conditions)
CREATE OR REPLACE FUNCTION merge_venture_context(
  venture_id_val UUID,
  context_key TEXT,
  context_value JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE ventures 
  SET context = jsonb_set(context, ARRAY[context_key], context_value),
      updated_at = NOW()
  WHERE id = venture_id_val;
END;
$$ LANGUAGE plpgsql;

-- Atomic cohort variant array update
CREATE OR REPLACE FUNCTION set_cohort_variants(
  cohort_id_val UUID,
  variant_ids_array UUID[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE cohorts 
  SET variant_ids = variant_ids_array,
      updated_at = NOW()
  WHERE id = cohort_id_val;
END;
$$ LANGUAGE plpgsql;
