# CLAUDE.md — spasso-portal
> Contexto técnico do repositório Next.js do Portal Spasso Cidades.
> Para contexto de negócio, editorial e sprint: ver `spasso-vault/CLAUDE.md`.

## Stack

| Camada | Escolha |
|--------|---------|
| Framework | Next.js 15 App Router + TypeScript |
| Hosting | Cloudflare Pages (`@cloudflare/next-on-pages`) |
| Banco | Supabase `vrholrhnvmighgmswmiu` (projeto `spasso-cidades`) |
| Storage mídia | Cloudflare R2 `spasso-media` |
| UI | Tailwind CSS 4 + shadcn/ui |
| Editor | TipTap 3 |
| Auth | Supabase Auth |

## Regras críticas

- **Toda page pública precisa de `export const runtime = 'edge'`** — Cloudflare Pages exige
- **Mídia vai para R2, NUNCA Supabase Storage**
- Commits em PT-BR

## Estrutura

```
src/
├── app/
│   ├── (public)/          ← portal público (edge runtime)
│   │   ├── [slug]/        ← artigo (ISR 60s)
│   │   ├── sp/[cidade]/   ← listagem cidade
│   │   ├── [tema]/        ← listagem tema
│   │   ├── rmc/
│   │   ├── brasil/
│   │   ├── opiniao/
│   │   └── ...páginas fixas
│   ├── (backoffice)/      ← admin CMS (autenticado)
│   │   ├── login/
│   │   └── admin/artigos/
│   └── api/
│       └── revalidate/    ← ISR on-demand
├── components/
│   ├── portal/            ← Header, Footer, ArticleCard, etc
│   ├── admin/             ← Editor, Dashboard
│   └── ui/                ← shadcn/ui
├── lib/
│   ├── supabase/          ← client.ts, server.ts
│   └── r2/                ← upload helper
└── types/                 ← tipos base (Article, Category, etc)

supabase/migrations/       ← SQL migrations versionadas
scripts/                   ← migração WP→Supabase
```

## Banco — IDs de referência

- **Supabase project:** `vrholrhnvmighgmswmiu`
- **URL:** `https://vrholrhnvmighgmswmiu.supabase.co`

## Variáveis de ambiente necessárias

Ver `.env.example` na raiz.
