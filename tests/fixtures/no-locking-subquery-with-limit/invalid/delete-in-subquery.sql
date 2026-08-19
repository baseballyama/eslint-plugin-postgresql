DELETE FROM ledger_entries
WHERE id IN (
  SELECT id
  FROM ledger_entries
  WHERE settled_at IS NULL
  LIMIT 100
  FOR NO KEY UPDATE SKIP LOCKED
);
