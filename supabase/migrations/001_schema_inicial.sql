-- ============================================================
-- Schema inicial — Portal Spasso Cidades
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca full-text

-- ============================================================
-- ORGANIZAÇÕES (multi-tenant básico)
-- ============================================================
CREATE TABLE organizations (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug      TEXT UNIQUE NOT NULL,
  name      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO organizations (slug, name) VALUES ('spasso-cidades', 'Spasso Cidades');

-- ============================================================
-- USUÁRIOS / REDAÇÃO
-- ============================================================
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id       UUID REFERENCES organizations(id) DEFAULT (SELECT id FROM organizations WHERE slug = 'spasso-cidades'),
  name         TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  role         TEXT NOT NULL DEFAULT 'redator' CHECK (role IN ('editor', 'redator', 'diretor')),
  avatar_url   TEXT,
  bio          TEXT,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIAS
-- ============================================================
CREATE TABLE categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('cidade', 'tema', 'opiniao', 'fixa')),
  parent_slug  TEXT REFERENCES categories(slug),
  -- Para cidades: prefixo /sp/[slug] — para temas: /[slug]
  url_prefix   TEXT NOT NULL,
  badge_color  TEXT,            -- hex da cor do badge
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Cidades
INSERT INTO categories (slug, name, type, url_prefix, badge_color, sort_order) VALUES
  ('sumare',              'Sumaré',              'cidade', '/sp/sumare',              '#dd8500', 1),
  ('hortolandia',         'Hortolândia',          'cidade', '/sp/hortolandia',         '#dd8500', 2),
  ('nova-odessa',         'Nova Odessa',          'cidade', '/sp/nova-odessa',         '#dd8500', 3),
  ('campinas',            'Campinas',             'cidade', '/sp/campinas',            '#dd8500', 4),
  ('paulinia',            'Paulínia',             'cidade', '/sp/paulinia',            '#dd8500', 5),
  ('monte-mor',           'Monte Mor',            'cidade', '/sp/monte-mor',           '#dd8500', 6),
  ('santa-barbara-doeste','Santa Bárbara d''Oeste','cidade', '/sp/santa-barbara-doeste','#dd8500', 7),
  ('outras-cidades',      'Outras Cidades',       'cidade', '/sp/outras-cidades',      '#dd8500', 8),
  ('rmc',                 'Região Metropolitana', 'cidade', '/rmc',                    '#4CAF50', 9);

-- Temas
INSERT INTO categories (slug, name, type, url_prefix, badge_color, sort_order) VALUES
  ('brasil',         'Brasil',         'tema', '/brasil',         '#ec3535', 10),
  ('saude',          'Saúde',          'tema', '/saude',          '#2563eb', 11),
  ('politica',       'Política',       'tema', '/politica',       '#2563eb', 12),
  ('educacao',       'Educação',       'tema', '/educacao',       '#2563eb', 13),
  ('economia',       'Economia',       'tema', '/economia',       '#2563eb', 14),
  ('cultura-e-lazer','Cultura e Lazer','tema', '/cultura-e-lazer','#2563eb', 15),
  ('esporte',        'Esporte',        'tema', '/esporte',        '#2563eb', 16),
  ('eventos',        'Eventos',        'tema', '/eventos',        '#2563eb', 17),
  ('meio-ambiente',  'Meio Ambiente',  'tema', '/meio-ambiente',  '#2563eb', 18),
  ('tecnologia',     'Tecnologia',     'tema', '/tecnologia',     '#2563eb', 19),
  ('seguranca',      'Segurança',      'tema', '/seguranca',      '#2563eb', 20),
  ('empregos',       'Empregos',       'tema', '/empregos',       '#2563eb', 21),
  ('estilo-de-vida', 'Estilo de Vida', 'tema', '/estilo-de-vida', '#2563eb', 22),
  ('infraestrutura', 'Infraestrutura', 'tema', '/infraestrutura', '#2563eb', 23);

-- Opinião
INSERT INTO categories (slug, name, type, url_prefix, badge_color, sort_order) VALUES
  ('opiniao', 'Opinião', 'opiniao', '/opiniao', '#7c3aed', 30);

-- ============================================================
-- ARTIGOS
-- ============================================================
CREATE TABLE articles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID REFERENCES organizations(id) DEFAULT (SELECT id FROM organizations WHERE slug = 'spasso-cidades'),

  -- Conteúdo
  title             TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  excerpt           TEXT,
  content           JSONB NOT NULL DEFAULT '{}', -- { rendered: "<html>", tiptap: {} }
  featured_image_url TEXT,

  -- Classificação
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  category_slug     TEXT REFERENCES categories(slug),
  content_type      TEXT NOT NULL DEFAULT 'news' CHECK (content_type IN ('news', 'opinion', 'special', 'advertising', 'press_release', 'aggregated')),
  source_type       TEXT NOT NULL DEFAULT 'original' CHECK (source_type IN ('original', 'collaborator', 'press_release', 'aggregated')),
  origin_badge      TEXT,           -- "Assessoria de Comunicação — Prefeitura de Sumaré"
  is_legacy_blog    BOOLEAN DEFAULT FALSE,

  -- Autoria
  author_id         UUID REFERENCES users(id),

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,
  seo_keywords      TEXT[],
  canonical_url     TEXT,

  -- Datas
  published_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Legado WP
  wp_post_id        INT,            -- ID original no WordPress
  wp_modified_at    TIMESTAMPTZ,

  -- Controle
  views             INT DEFAULT 0,
  reading_time_min  INT,            -- calculado no insert

  -- Busca
  search_vector     TSVECTOR
);

-- Índices
CREATE INDEX articles_slug_idx          ON articles (slug);
CREATE INDEX articles_status_idx        ON articles (status);
CREATE INDEX articles_category_idx      ON articles (category_slug);
CREATE INDEX articles_published_at_idx  ON articles (published_at DESC);
CREATE INDEX articles_search_idx        ON articles USING GIN (search_vector);
CREATE INDEX articles_wp_id_idx         ON articles (wp_post_id);

-- Atualizar search_vector automaticamente
CREATE OR REPLACE FUNCTION articles_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.content->>'rendered', '')), 'C');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_search_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_update();

-- ============================================================
-- VERSÕES DE ARTIGO (histórico)
-- ============================================================
CREATE TABLE article_versions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  content    JSONB NOT NULL,
  title      TEXT NOT NULL,
  saved_by   UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REDIRECTS (mapa URL antiga → nova)
-- ============================================================
CREATE TABLE redirects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      TEXT UNIQUE NOT NULL,  -- /category/sumare/
  destination TEXT NOT NULL,         -- /sp/sumare/
  status_code INT DEFAULT 301,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Redirects de categorias WP → novas URLs
INSERT INTO redirects (source, destination) VALUES
  -- Cidades
  ('/category/sumare/',                             '/sp/sumare/'),
  ('/category/hortolandia/',                        '/sp/hortolandia/'),
  ('/category/nova-odessa/',                        '/sp/nova-odessa/'),
  ('/category/campinas/',                           '/sp/campinas/'),
  ('/category/paulinia/',                           '/sp/paulinia/'),
  ('/category/monte-mor/',                          '/sp/monte-mor/'),
  ('/category/santa-barbara-doeste/',               '/sp/santa-barbara-doeste/'),
  ('/category/americana/',                          '/sp/outras-cidades/'),
  ('/category/indaiatuba/',                         '/sp/outras-cidades/'),
  ('/category/cidades-da-rmc/',                     '/rmc/'),
  ('/category/regiao-metropolitana-de-campinas/',   '/rmc/'),
  -- Temas
  ('/category/saude/',                              '/saude/'),
  ('/category/saude-e-bem-estar/',                  '/saude/'),
  ('/category/saude-mental/',                       '/saude/'),
  ('/category/saude-publica/',                      '/saude/'),
  ('/category/politica/',                           '/politica/'),
  ('/category/politica-e-gestao/',                  '/politica/'),
  ('/category/politicas-publicas/',                 '/politica/'),
  ('/category/eleicoes/',                           '/politica/'),
  ('/category/economia/',                           '/economia/'),
  ('/category/economia-e-negocios/',                '/economia/'),
  ('/category/esporte/',                            '/esporte/'),
  ('/category/esportes/',                           '/esporte/'),
  ('/category/cultura-e-lazer/',                    '/cultura-e-lazer/'),
  ('/category/cultura/',                            '/cultura-e-lazer/'),
  ('/category/gastronomia/',                        '/estilo-de-vida/'),
  ('/category/moda/',                               '/estilo-de-vida/'),
  ('/category/tendencias/',                         '/estilo-de-vida/'),
  ('/category/beleza/',                             '/estilo-de-vida/'),
  ('/category/comportamento/',                      '/estilo-de-vida/'),
  ('/category/turismo/',                            '/estilo-de-vida/'),
  ('/category/pets/',                               '/estilo-de-vida/'),
  ('/category/relacionamentos/',                    '/estilo-de-vida/'),
  ('/category/educacao/',                           '/educacao/'),
  ('/category/tecnologia/',                         '/tecnologia/'),
  ('/category/eventos/',                            '/eventos/'),
  ('/category/meio-ambiente/',                      '/meio-ambiente/'),
  ('/category/seguranca/',                          '/seguranca/'),
  ('/category/emprego/',                            '/empregos/'),
  ('/category/empregos/',                           '/empregos/'),
  ('/category/brasil/',                             '/brasil/'),
  ('/category/politicando/',                        '/opiniao/'),
  -- Legado/interno WP → home
  ('/category/featured/',                           '/'),
  ('/category/destaque/',                           '/'),
  ('/category/blog/',                               '/'),
  ('/category/decoracao/',                          '/estilo-de-vida/'),
  ('/category/casa-e-decoracao/',                   '/estilo-de-vida/'),
  ('/category/jardim/',                             '/estilo-de-vida/'),
  -- Feed
  ('/feed/',                                        '/feed.xml');

-- ============================================================
-- AI JOBS (fila de tarefas IA)
-- ============================================================
CREATE TABLE ai_jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('summarize', 'tags', 'title_suggest', 'translate')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
  result      JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs          ENABLE ROW LEVEL SECURITY;

-- Público: só artigos publicados
CREATE POLICY "leitura_publica_artigos"
  ON articles FOR SELECT
  USING (status = 'published');

-- Público: categorias sempre visíveis
CREATE POLICY "leitura_publica_categorias"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Público: redirects sempre visíveis (necessário no middleware)
CREATE POLICY "leitura_publica_redirects"
  ON redirects FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Editor/redator: acesso total a artigos do próprio org
CREATE POLICY "redacao_artigos"
  ON articles FOR ALL
  TO authenticated
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Editor/redator: acesso ao próprio perfil
CREATE POLICY "usuario_proprio_perfil"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "usuario_atualiza_proprio_perfil"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- VIEW: artigos publicados (atalho para queries públicas)
-- ============================================================
CREATE VIEW artigos_publicados AS
  SELECT
    a.id, a.slug, a.title, a.excerpt, a.featured_image_url,
    a.content_type, a.source_type, a.origin_badge,
    a.category_slug, a.published_at, a.views, a.reading_time_min,
    a.seo_title, a.seo_description,
    c.name AS category_name, c.badge_color, c.url_prefix,
    u.name AS author_name, u.avatar_url AS author_avatar
  FROM articles a
  LEFT JOIN categories c ON c.slug = a.category_slug
  LEFT JOIN users u ON u.id = a.author_id
  WHERE a.status = 'published'
  ORDER BY a.published_at DESC;
