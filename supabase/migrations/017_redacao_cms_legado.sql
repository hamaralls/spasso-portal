-- ============================================================
-- Redacao assume CMS legado do portal
-- Data: 2026-06-05
-- ============================================================

-- Campos que a Redacao agora edita diretamente no artigo.
alter table if exists articles add column if not exists theme_slug text;
alter table if exists articles add column if not exists content_type text default 'news';
alter table if exists articles add column if not exists source_type text default 'original';
alter table if exists articles add column if not exists origin_badge text;
alter table if exists articles add column if not exists columnist_id uuid;
alter table if exists articles add column if not exists featured_image_alt text;
alter table if exists articles add column if not exists featured_image_caption text;
alter table if exists articles add column if not exists is_featured boolean default false;
alter table if exists articles add column if not exists is_featured_pinned boolean default false;
alter table if exists articles add column if not exists for_print boolean default false;
alter table if exists articles add column if not exists only_print boolean default false;

create index if not exists idx_articles_columnist_id
  on articles (columnist_id) where columnist_id is not null;
create index if not exists idx_articles_featured_pinned
  on articles (is_featured_pinned, published_at desc)
  where is_featured = true and status = 'published';

-- Colunistas usados pelo portal publico e pela Redacao.
create table if not exists columnists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  bio text,
  subtitle text,
  avatar_url text,
  type text not null default 'person' check (type in ('person','editorial')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table columnists enable row level security;

drop policy if exists columnists_public_read on columnists;
create policy columnists_public_read on columnists
  for select to anon, authenticated
  using (active = true);

drop policy if exists columnists_redacao_write on columnists;
create policy columnists_redacao_write on columnists
  for all to authenticated
  using (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  )
  with check (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  );

grant select on columnists to anon, authenticated;
grant insert, update, delete on columnists to authenticated;

-- Gestao simples da home publica.
create table if not exists home_sections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  href text,
  color text,
  category_slugs text[],
  article_count int not null default 4,
  layout text not null default 'cards',
  show_banner boolean default false,
  banner_slot text,
  active boolean default true,
  position int not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_home_sections_public
  on home_sections (active, position)
  where active = true;

alter table home_sections enable row level security;

drop policy if exists home_sections_public_read on home_sections;
create policy home_sections_public_read on home_sections
  for select to anon, authenticated
  using (active = true);

drop policy if exists home_sections_redacao_write on home_sections;
create policy home_sections_redacao_write on home_sections
  for all to authenticated
  using (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  )
  with check (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  );

grant select on home_sections to anon, authenticated;
grant insert, update, delete on home_sections to authenticated;

insert into home_sections
  (slug, title, href, color, category_slugs, article_count, layout, show_banner, banner_slot, active, position)
values
  ('colunistas', 'Colunistas', '/colunistas', '#f5821f', array['colunistas'], 3, 'columnists', true, 'home-leaderboard', true, 10),
  ('rmc', 'Região Metropolitana de Campinas', '/rmc', '#8dc63f',
    array['sumare','hortolandia','nova-odessa','campinas','paulinia','monte-mor','santa-barbara-doeste','outras-cidades','rmc'],
    8, 'metropoles', true, 'post-rmc-leaderboard', true, 20),
  ('brasil', 'Brasil', '/brasil', '#ec3535', array['brasil'], 6, 'metropoles', false, null, true, 30),
  ('cultura-e-lazer', 'Cultura e Lazer', '/cultura-e-lazer', '#2563eb',
    array['cultura-e-lazer','estilo-de-vida','eventos'], 3, 'metropoles-sidebar', true, 'cultura-sidebar', true, 40),
  ('saude', 'Saúde', '/saude', '#0891b2', array['saude'], 3, 'metropoles', true, 'post-saude-leaderboard', true, 50),
  ('politica', 'Política', '/politica', '#7c3aed', array['politica'], 2, 'two-up', false, null, true, 60),
  ('economia', 'Economia', '/economia', '#16a34a', array['economia'], 3, 'metropoles-sidebar', false, 'economia-sidebar', true, 70),
  ('ultimas', 'Últimas Notícias', '/ultimas-noticias', '#f5821f', null, 8, 'cards', false, null, true, 80)
on conflict (slug) do update set
  title = excluded.title,
  href = excluded.href,
  color = excluded.color,
  category_slugs = excluded.category_slugs,
  article_count = excluded.article_count,
  layout = excluded.layout,
  show_banner = excluded.show_banner,
  banner_slot = excluded.banner_slot,
  active = excluded.active,
  position = excluded.position,
  updated_at = now();

-- Compatibilidade com o CMS antigo de edicoes semanais.
alter table if exists weekly_editions add column if not exists edition_number int;
alter table if exists weekly_editions add column if not exists published_date date;
alter table if exists weekly_editions add column if not exists title text;
alter table if exists weekly_editions add column if not exists pdf_url text;
alter table if exists weekly_editions add column if not exists cover_url text;
alter table if exists weekly_editions add column if not exists description text;
alter table if exists weekly_editions add column if not exists active boolean default true;

-- Garante leitura publica somente de configuracoes publicas ativas.
alter table if exists weekly_editions enable row level security;
drop policy if exists weekly_editions_public_read on weekly_editions;
create policy weekly_editions_public_read on weekly_editions
  for select to anon, authenticated
  using (active = true);

drop policy if exists weekly_editions_redacao_write on weekly_editions;
create policy weekly_editions_redacao_write on weekly_editions
  for all to authenticated
  using (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  )
  with check (
    exists (
      select 1
      from users u
      where u.id = auth.uid()
        and u.active = true
        and u.role in ('admin', 'diretor', 'editor', 'redator')
    )
  );

grant select on weekly_editions to anon, authenticated;
grant insert, update, delete on weekly_editions to authenticated;
