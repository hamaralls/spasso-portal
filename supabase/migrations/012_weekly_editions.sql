-- Migration 012: weekly_editions — Edição de Sexta
-- Tabela para as edições semanais do jornal impresso (PDF + capa).

CREATE TABLE IF NOT EXISTS weekly_editions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edition_number INT,
  published_date DATE NOT NULL,
  title          TEXT,
  pdf_url        TEXT NOT NULL,
  cover_url      TEXT,
  description    TEXT,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS weekly_editions_date_idx
  ON weekly_editions (published_date DESC)
  WHERE active = true;
