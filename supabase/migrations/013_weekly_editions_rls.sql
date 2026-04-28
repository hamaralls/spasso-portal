-- Migration 013: RLS policy pública para weekly_editions
-- O Supabase habilita RLS automaticamente no projeto.
-- Sem esta policy, o client anon (home, páginas públicas) não conseguia ler as edições.

CREATE POLICY "Public can read active editions"
  ON weekly_editions
  FOR SELECT
  USING (active = true);
