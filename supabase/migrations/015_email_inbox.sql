-- Migration 015 — Email Inbox Universal
-- Todo email que entra é arquivado aqui antes de qualquer filtro.

CREATE TABLE email_inbox (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id      TEXT UNIQUE,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  from_address    TEXT NOT NULL,
  from_name       TEXT,
  subject         TEXT,

  body_text       TEXT,
  body_html       TEXT,

  attachments     JSONB DEFAULT '[]'::jsonb,
  cloud_links     JSONB DEFAULT '[]'::jsonb,
  source_links    JSONB DEFAULT '[]'::jsonb,

  raw_size_bytes  INT,
  dkim_pass       BOOLEAN,
  spf_pass        BOOLEAN,

  whitelist_match BOOLEAN DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'novo'
                  CHECK (status IN ('novo','processado','ignorado','erro','reprocessar','arquivado')),

  processed_at    TIMESTAMPTZ,
  coda_row_id     TEXT,
  pipeline_error  TEXT,

  notes           TEXT
);

CREATE INDEX idx_email_inbox_received_at ON email_inbox(received_at DESC);
CREATE INDEX idx_email_inbox_status      ON email_inbox(status) WHERE status IN ('novo','reprocessar','erro');
CREATE INDEX idx_email_inbox_from        ON email_inbox(from_address);

ALTER TABLE email_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON email_inbox
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated admin read" ON email_inbox
  FOR SELECT USING (auth.role() = 'authenticated');
