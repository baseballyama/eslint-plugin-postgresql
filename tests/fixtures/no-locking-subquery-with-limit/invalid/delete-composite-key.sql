DELETE FROM llm_usage_logs
WHERE (id, created_at) IN (
  SELECT id, created_at
  FROM llm_usage_logs
  WHERE created_at < now() - interval '30 days'
  LIMIT 1000
  FOR NO KEY UPDATE SKIP LOCKED
);
