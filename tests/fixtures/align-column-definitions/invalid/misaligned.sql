CREATE TABLE document_ingest_stage_executions (
  document_ingest_stage_execution_id ulid PRIMARY KEY,
  tenant_id ulid NOT NULL,
  agent_id ulid NOT NULL,
  status flygate_document_ingest_status NOT NULL
);
