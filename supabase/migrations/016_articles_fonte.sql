-- migration 016: coluna fonte em articles
-- Spec: spasso-vault/produto/CURADOR-MIDIA-PLANO.md §22, §27 (Fase 1.5B)
-- Permite que o WF1 grave a `Fonte` (assessoria) de cada matéria publicada.
-- Em ~3 meses, vira a base própria da whitelist (substitui o dump do Coda).
-- Reversível: DROP COLUMN articles.fonte;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS fonte text;

-- Índice opcional para SELECT DISTINCT fonte rápido (whitelist building)
CREATE INDEX IF NOT EXISTS articles_fonte_idx ON articles (fonte) WHERE fonte IS NOT NULL;
