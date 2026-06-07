INSERT INTO categories (slug, name, type, url_prefix, badge_color, sort_order)
VALUES ('seguranca', 'Segurança', 'tema', '/seguranca', '#2563eb', 20)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  url_prefix = EXCLUDED.url_prefix,
  badge_color = EXCLUDED.badge_color,
  sort_order = EXCLUDED.sort_order;
