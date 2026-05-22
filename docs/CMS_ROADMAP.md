# NrichSouls CMS — Full Project Roadmap

> Last updated: May 2026
> Stack: Next.js · Supabase · NextAuth · OpenAI / Anthropic · Railway

---

## Overview

A fully custom CMS + AI content factory embedded inside nrichsouls.in:

1. Supabase as the content source of truth (Notion fully removed)
2. Write one raw idea → AI generates Blog, LinkedIn, X/Twitter, and Instagram content simultaneously
3. Preview, edit, and publish everything from a single admin panel at `/admin`
4. Social API publishing, image generation, and a carousel builder

---

## Architecture

```
nrichsouls.in (Railway — persistent Node.js, no serverless timeout)
├── Public site          → reads posts from Supabase
├── /admin               → protected by Google OAuth (NextAuth)
│   ├── Dashboard        → manage all posts (publish/unpublish/delete/search)
│   ├── Posts / New      → TipTap rich-text editor, create from scratch
│   ├── Posts / Edit     → edit any existing post + cover image picker
│   ├── Ideas            → idea list + AI generator
│   ├── Ideas / New      → drop idea → generate 4 platform variants
│   ├── Ideas / [id]     → view saved idea, publish blog, copy per platform
│   ├── Carousel / New   → slide designer → export 1080×1080 PNG ZIP
│   └── Settings         → LinkedIn OAuth connect, hashtag group manager
│
├── Supabase
│   ├── posts            → 292 posts (87 published + 205 drafts from Notion)
│   ├── ideas            → AI-generated content drafts
│   └── settings         → LinkedIn tokens, hashtag groups (key-value)
│
└── AI APIs
    ├── OpenAI GPT-4o    → content generation + DALL-E 3 image generation
    └── Anthropic Claude → content generation (switchable per idea)
```

---

## ✅ Phase 1 — Foundation (COMPLETE)

| Area | Detail |
|---|---|
| **Database** | Supabase `posts` + `ideas` + `settings` tables with Row Level Security |
| **Auth** | NextAuth.js with Google OAuth — only `nitinpandya26@gmail.com` can access `/admin` |
| **Middleware** | `middleware.js` protects `/admin` and all `/admin/*` routes (except `/admin/login`) |
| **Blog migration** | 40 WordPress `.md` posts migrated via `scripts/migrate-to-supabase.mjs` |
| **Notion migration** | 87 published Notion posts migrated via `scripts/migrate-notion-to-supabase.mjs` |
| **Notion drafts** | 205 unpublished Notion posts migrated via `scripts/migrate-notion-drafts.mjs` |
| **Public site** | All pages read from Supabase — Notion dependency fully removed |
| **Admin dashboard** | `/admin` — stats, publish toggle, delete, search + filter |

### Database schema — posts

```sql
CREATE TABLE posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  excerpt     TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  category    TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time   TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  published   BOOLEAN DEFAULT false,
  status      TEXT DEFAULT 'draft',
  source      TEXT DEFAULT 'cms',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Phase 2 — AI Content Generator (COMPLETE)

| Area | Detail |
|---|---|
| **AI generation** | Raw idea → Blog HTML + LinkedIn + X thread + Instagram caption in one call |
| **Dual LLM** | OpenAI GPT-4o, GPT-4o Mini, Claude Sonnet 4.6, Claude Opus 4.7 — switchable per idea |
| **4-platform previews** | Blog article HTML · LinkedIn mockup · X tweet cards · Instagram caption block |
| **Inline editing** | Toggle edit mode on any tab |
| **Publish blog** | One click → live post + auto-revalidates `/`, `/blog`, category pages |
| **Save draft** | Saves idea + all generated content to `ideas` table |

### AI model dropdown — how to add models

Edit the `PROVIDERS` array in [app/admin/ideas/new/page.js](../app/admin/ideas/new/page.js):

```js
const PROVIDERS = [
  { value: 'openai',                        label: 'GPT-4o (OpenAI)' },
  { value: 'openai:gpt-4o-mini',            label: 'GPT-4o Mini · faster' },
  { value: 'anthropic',                     label: 'Claude Sonnet 4.6' },
  { value: 'anthropic:claude-opus-4-7',     label: 'Claude Opus 4.7 · best' },
];
```

---

## ✅ Phase 3 — Post Editor (COMPLETE)

| Area | Detail |
|---|---|
| **New post** | `/admin/posts/new` — create from scratch with full editor |
| **Edit post** | `/admin/posts/[id]/edit` — loads existing post, saves via PATCH |
| **Rich editor** | TipTap v3 — headings, bold, italic, underline, lists, links, images, text-align |
| **HTML toggle** | Switch between visual editor and raw HTML textarea |
| **Live preview** | Renders article exactly as it appears on the public blog |
| **Dashboard** | Edit button per row links directly to the editor |

---

## ✅ Phase 4 — Image Generation + Upload (COMPLETE)

| Area | Detail |
|---|---|
| **DALL-E 3** | `/api/admin/generate-image` — generates image, re-uploads to Supabase Storage for permanent URL |
| **Manual upload** | `/api/admin/upload` — drag & drop or file picker, validates type + size (10MB max) |
| **ImagePicker** | 3-tab UI (Upload / AI Generate / URL) embedded in PostForm |
| **Carousel Builder** | `/admin/carousel/new` — 3 branded templates, up to 9 content slides, exports 1080×1080 PNG ZIP |

### Carousel templates

| Key | Name | Style |
|---|---|---|
| `dark` | Dark Indigo | Dark `#1e1b4b` bg, white text, indigo accents |
| `light` | Clean Light | White bg, slate text, indigo accents |
| `gradient` | Gradient | Indigo→purple gradient, white text, amber accents |

---

## ✅ Phase 5 — LinkedIn Direct Publish (COMPLETE)

| Area | Detail |
|---|---|
| **OAuth flow** | `/api/admin/linkedin/auth` → `/api/admin/linkedin/callback` — CSRF-safe state cookie |
| **Token storage** | Access token + person URN stored in `settings` table, expires in 60 days |
| **Publish** | `/api/admin/linkedin/post` — posts via LinkedIn Posts API (version 202304) |
| **Settings page** | `/admin/settings` — connect/disconnect button, connection status badge |
| **Person URN** | Retrieved from `/v2/userinfo` OpenID Connect endpoint (`sub` field) |

> **Note:** LinkedIn tokens expire after 60 days — reconnect at `/admin/settings`.

---

## ✅ Phase 6 — X/Twitter + Instagram Helpers (COMPLETE)

| Area | Detail |
|---|---|
| **Twitter CharBar** | Visual progress bar per tweet — green ≤93%, amber 93–100%, red overflow (280 char max) |
| **Twitter copy** | Per-tweet copy + "Copy all N tweets" button |
| **Instagram CharBar** | Caption length bar (2200 char max) + hashtag count badge |
| **Hashtag groups** | Save/load named hashtag sets per category — "Append & Copy" merges caption + tags |
| **Hashtag API** | `/api/admin/hashtags` GET + POST — stored as JSON in `settings` table |

---

## ✅ Phase 7 — Deployment (COMPLETE — Railway)

Deployed to **Railway** (not Vercel) — persistent Node.js server, no 10s serverless timeout.

### Domain

- `nrichsouls.in` → CNAME → Railway service
- Custom domain verified and active in Railway

### Environment variables (Railway)

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |
| `NEXTAUTH_SECRET` | ✅ Set |
| `NEXTAUTH_URL` | ✅ `https://nrichsouls.in` |
| `GOOGLE_CLIENT_ID` | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | ✅ Set |
| `ADMIN_EMAIL` | ✅ Set |
| `OPENAI_API_KEY` | ✅ Set |
| `ANTHROPIC_API_KEY` | ⚠️ Not set — Claude generation unavailable |
| `REVALIDATE_SECRET` | ✅ Set |
| `LINKEDIN_CLIENT_ID` | ✅ Set |
| `LINKEDIN_CLIENT_SECRET` | ✅ Set |
| `LINKEDIN_REDIRECT_URI` | ✅ `https://nrichsouls.in/api/admin/linkedin/callback` |
| `MAILCHIMP_API_KEY` | ✅ Set |

---

## Current Database State

| Table | Rows | Notes |
|---|---|---|
| `posts` | 292 | 87 published · 205 drafts (from Notion) |
| `ideas` | — | Ready to use |
| `settings` | — | LinkedIn tokens + hashtag groups stored here |

Run these SQL files in Supabase SQL Editor if not already done:

```
scripts/phase2-schema.sql     — adds columns to ideas table
scripts/settings-schema.sql   — creates settings table
```

---

## Admin URLs — Full Reference

| URL | What it does |
|---|---|
| `/admin/login` | Google sign-in |
| `/admin` | Posts dashboard |
| `/admin/posts/new` | Create new post (TipTap editor) |
| `/admin/posts/[id]/edit` | Edit existing post |
| `/admin/ideas` | All saved ideas |
| `/admin/ideas/new` | Generate content from an idea |
| `/admin/ideas/[id]` | View idea, publish blog, copy per platform |
| `/admin/carousel/new` | Carousel slide designer + PNG ZIP export |
| `/admin/settings` | LinkedIn OAuth + hashtag group manager |

---

## What's Not Built (Future Ideas)

| Feature | Notes |
|---|---|
| **X/Twitter API publish** | Requires paid API ($100/month Basic tier) — copy-paste workflow is the current approach |
| **Instagram API publish** | Restricted to approved business accounts — copy-paste workflow used instead |
| **Auto-save drafts** | Editor currently saves on explicit button click only |
| **Post scheduling** | Publish at a future date/time |
| **Image gallery** | Browse previously uploaded Supabase Storage images |
| **Analytics** | Page views, top posts |
