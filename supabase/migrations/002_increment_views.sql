-- Função RPC para incrementar views de forma segura (sem race condition)
CREATE OR REPLACE FUNCTION increment_views(article_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE articles SET views = views + 1 WHERE slug = article_slug AND status = 'published';
$$;

-- Permite chamada anônima (leitores públicos)
GRANT EXECUTE ON FUNCTION increment_views(TEXT) TO anon;
