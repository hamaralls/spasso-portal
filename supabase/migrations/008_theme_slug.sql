-- Migration 008: theme_slug — classificação temática independente da geo
-- Permite que artigos de cidades tenham tema (saude, politica, etc.)
-- sem mudar o category_slug geográfico.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS theme_slug text REFERENCES categories(slug);
CREATE INDEX IF NOT EXISTS articles_theme_slug_idx ON articles(theme_slug) WHERE theme_slug IS NOT NULL;

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
    col.type AS columnist_type
   FROM articles a
     LEFT JOIN categories c ON c.slug = a.category_slug
     LEFT JOIN users u ON u.id = a.author_id
     LEFT JOIN columnists col ON col.id = a.columnist_id
  WHERE a.status = 'published'::text AND a.published_at <= now()
  ORDER BY a.published_at DESC;
