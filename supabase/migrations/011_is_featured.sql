-- Migration 011: is_featured — curadoria manual de manchetes
-- Permite marcar artigos para o hero da home, com pinagem prioritária.
-- Regra de negócio: máx 5 artigos featured ativos; não pinados são rotacionados
-- automaticamente por published_at DESC (mais novo entra, mais antigo sai).

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS articles_featured_idx
  ON articles (is_featured_pinned DESC, published_at DESC)
  WHERE is_featured = true AND status = 'published';

-- Recria view incluindo is_featured e is_featured_pinned
DROP VIEW IF EXISTS artigos_publicados;

CREATE VIEW artigos_publicados AS
 SELECT a.id,
    a.slug,
    a.title,
    a.excerpt,
    a.featured_image_url,
    a.content_type,
    a.source_type,
    a.origin_badge,
    a.category_slug,
    a.theme_slug,
    a.is_featured,
    a.is_featured_pinned,
    a.published_at,
    a.views,
    a.reading_time_min,
    a.seo_title,
    a.seo_description,
    c.name AS category_name,
    c.badge_color,
    c.url_prefix,
    COALESCE(col.name, u.name) AS author_name,
    COALESCE(col.avatar_url, u.avatar_url) AS author_avatar,
    col.type AS columnist_type,
    col.id AS columnist_id,
    col.slug AS columnist_slug,
    col.subtitle AS columnist_subtitle
   FROM articles a
     LEFT JOIN categories c ON c.slug = a.category_slug
     LEFT JOIN users u ON u.id = a.author_id
     LEFT JOIN columnists col ON col.id = a.columnist_id
  WHERE a.status = 'published'::text AND a.published_at <= now()
  ORDER BY a.published_at DESC;
