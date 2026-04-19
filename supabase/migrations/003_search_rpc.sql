-- Função de busca full-text que usa o GIN index em articles.search_vector
-- e retorna os mesmos campos da view artigos_publicados
CREATE OR REPLACE FUNCTION search_artigos(
  query       TEXT,
  page_from   INTEGER DEFAULT 0,
  page_to     INTEGER DEFAULT 11
)
RETURNS TABLE (
  id                UUID,
  slug              TEXT,
  title             TEXT,
  excerpt           TEXT,
  featured_image_url TEXT,
  content_type      TEXT,
  source_type       TEXT,
  origin_badge      TEXT,
  category_slug     TEXT,
  published_at      TIMESTAMPTZ,
  views             INTEGER,
  reading_time_min  INTEGER,
  seo_title         TEXT,
  seo_description   TEXT,
  category_name     TEXT,
  badge_color       TEXT,
  url_prefix        TEXT,
  author_name       TEXT,
  author_avatar     TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id, a.slug, a.title, a.excerpt, a.featured_image_url,
    a.content_type::TEXT, a.source_type::TEXT, a.origin_badge,
    a.category_slug, a.published_at, a.views, a.reading_time_min,
    a.seo_title, a.seo_description,
    c.name AS category_name, c.badge_color, c.url_prefix,
    u.name AS author_name, u.avatar_url AS author_avatar
  FROM articles a
  LEFT JOIN categories c ON c.slug = a.category_slug
  LEFT JOIN users u ON u.id = a.author_id
  WHERE a.status = 'published'
    AND a.search_vector @@ websearch_to_tsquery('portuguese', query)
  ORDER BY ts_rank(a.search_vector, websearch_to_tsquery('portuguese', query)) DESC,
           a.published_at DESC
  LIMIT (page_to - page_from + 1)
  OFFSET page_from;
$$;

GRANT EXECUTE ON FUNCTION search_artigos(TEXT, INTEGER, INTEGER) TO anon;
