-- Creates a lightweight view for health checks.
-- This is safe to run multiple times.

CREATE OR REPLACE VIEW _health AS
SELECT true as ok;
