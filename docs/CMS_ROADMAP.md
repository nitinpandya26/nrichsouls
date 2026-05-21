# NrichSouls CMS — Full Project Roadmap

> Last updated: May 2026  
> Stack: Next.js 16 · Supabase · NextAuth · OpenAI / Anthropic · Vercel

---

## Overview

We are building a **fully custom CMS + AI content factory** embedded inside nrichsouls.in. The goal is to:

1. Replace Notion as the content source of truth
2. Write one raw idea → AI generates content for Blog, LinkedIn, X/Twitter, and Instagram simultaneously
3. Preview, edit, and publish everything from a single admin panel at `/admin`
4. Progressively add social API publishing, image generation, and a carousel builder

---

## Architecture

```
nrichsouls.in
├── Public site          → reads posts from Supabase
├── /admin               → protected by Google OAuth (NextAuth)
│   ├── Dashboard        → manage all 87 posts
│   ├── Ideas            → idea list + AI generator
│   └── Ideas / New      → drop idea → generate 4 platform variants
│
├── Supabase
│   ├── posts            → 87 posts (40 from WordPress .md + 47 from Notion)
│   └── ideas            → AI-generated content drafts
│
└── AI APIs
    ├── OpenAI GPT-4o    → content generation
    └── Anthropic Claude → content generation (switchable per idea)
```

---

## ✅ Phase 1 — Foundation (COMPLETE)

### What was built

| Area | Detail |
|---|---|
| **Database** | Supabase project created, `posts` and `ideas` tables with Row Level Security |
| **Auth** | NextAuth.js with Google OAuth — only `nitinpandya26@gmail.com` can access `/admin` |
| **Blog migration** | All 40 WordPress `.md` posts migrated to Supabase via `scripts/migrate-to-supabase.mjs` |
| **Notion migration** | All 87 published Notion posts migrated via `scripts/migrate-notion-to-supabase.mjs` — 47 new posts inserted, 40 duplicates skipped |
| **Public site** | All pages (`/`, `/blog`, `/blog/[slug]`, 3 category pages, RSS feed) now read from Supabase — Notion dependency fully removed |
| **Admin dashboard** | `/admin` — shows all posts, publish/unpublish toggle, delete with confirmation, search + filter |
| **Admin shell** | Sticky top nav, Google sign-out, "View site" link, no public Navbar on admin routes |

### Files created

```
lib/supabase.js                        — Supabase public + admin clients
lib/auth.js                            — NextAuth config, Google provider, email allowlist
lib/db-posts.js                        — Async post queries (getAllPosts, getPostBySlug, etc.)
middleware.js                          — Protects all /admin/* routes
app/api/auth/[...nextauth]/route.js    — NextAuth handler
app/api/admin/posts/route.js           — GET all posts + POST create
app/api/admin/posts/[id]/route.js      — PATCH update + DELETE (auto-revalidates pages)
app/components/ConditionalShell.js     — Hides public Navbar/Footer on /admin
app/admin/layout.js                    — Admin shell layout
app/admin/components/AuthProvider.js   — NextAuth SessionProvider wrapper
app/admin/components/AdminNav.js       — Top nav with sign-out, site link, nav links
app/admin/login/page.js                — Google sign-in page
app/admin/page.js                      — Posts dashboard (stats, table, toggle, delete)
scripts/migrate-to-supabase.mjs        — One-time .md → Supabase migration
scripts/migrate-notion-to-supabase.mjs — One-time Notion → Supabase migration
.env.local.example                     — Template for all required env vars
SETUP.md                               — Step-by-step setup guide
```

### Files modified

```
app/layout.js                          — Replaced Navbar/Footer with ConditionalShell
app/page.js                            — Removed Notion, uses db-posts
app/blog/page.js                       — Removed Notion, uses db-posts
app/blog/[slug]/page.js                — Removed Notion, uses db-posts
app/ai-tech-automation/page.js         — Removed Notion, uses db-posts
app/career-growth-remote-work/page.js  — Removed Notion, uses db-posts
app/health-wellness/page.js            — Removed Notion, uses db-posts
app/feed.xml/route.js                  — Removed Notion, uses db-posts
```

### Database schema — posts table

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
  status      TEXT DEFAULT 'draft',   -- draft | published | archived
  source      TEXT DEFAULT 'cms',     -- cms | migrated | notion
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Phase 2 — AI Content Generator (COMPLETE)

### What was built

| Area | Detail |
|---|---|
| **AI generation** | Drop a raw idea → single API call generates Blog (HTML) + LinkedIn + X thread + Instagram caption simultaneously |
| **Dual LLM support** | Switchable per idea: OpenAI GPT-4o, GPT-4o Mini, Anthropic Claude Sonnet 4.6, Claude Opus 4.7 |
| **4-platform previews** | Blog renders as article HTML · LinkedIn shows post mockup · X shows tweet-per-card thread · Instagram shows caption + hashtag block |
| **Inline editing** | Toggle edit mode on any platform tab — raw textarea to tweak content before saving |
| **Copy helpers** | Per-platform copy buttons for LinkedIn, X, Instagram |
| **Publish blog** | One click → creates live post on the site, auto-revalidates `/`, `/blog`, and the new post page |
| **Save draft** | Saves idea + all generated content to Supabase `ideas` table |
| **Ideas list** | `/admin/ideas` — table with status, category, AI model, delete |
| **Idea detail** | `/admin/ideas/[id]` — view saved idea, publish blog, copy per platform |
| **Model switcher** | Format `provider:model-id` in the PROVIDERS array — easily add any new model |

### Files created

```
app/api/admin/generate/route.js              — AI generation (OpenAI + Anthropic, model-switchable)
app/api/admin/ideas/route.js                 — GET list + POST create ideas
app/api/admin/ideas/[id]/route.js            — GET / PATCH / DELETE single idea
app/api/admin/ideas/[id]/publish/route.js    — POST: publish idea's blog as live post
app/admin/ideas/page.js                      — Ideas list page
app/admin/ideas/new/page.js                  — Generation page (input form + 4 platform previews)
app/admin/ideas/[id]/page.js                 — Saved idea viewer + publish
scripts/phase2-schema.sql                    — SQL to add title/category/tone/ai_provider/post_id to ideas
```

### Database schema — ideas table (after phase2-schema.sql)

```sql
CREATE TABLE ideas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_idea            TEXT NOT NULL,
  title               TEXT,
  category            TEXT DEFAULT 'ai-tech-automation',
  tone                TEXT DEFAULT 'professional',
  ai_provider         TEXT DEFAULT 'openai',
  generated_blog      TEXT,
  generated_linkedin  TEXT,
  generated_twitter   TEXT,
  generated_instagram TEXT,
  status              TEXT DEFAULT 'draft',   -- draft | published
  post_id             UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### AI model dropdown — how to add models

Edit the `PROVIDERS` array in [app/admin/ideas/new/page.js](app/admin/ideas/new/page.js) (line ~21):

```js
const PROVIDERS = [
  { value: 'openai',                        label: 'GPT-4o (OpenAI)' },
  { value: 'openai:gpt-4o-mini',            label: 'GPT-4o Mini · faster' },
  { value: 'anthropic',                     label: 'Claude Sonnet 4.6' },
  { value: 'anthropic:claude-opus-4-7',     label: 'Claude Opus 4.7 · best' },
  // add any new model as: { value: 'provider:exact-model-id', label: '...' }
];
```

---

## 🔲 Phase 3 — Post Editor (NOT STARTED)

> **Goal:** Edit any existing post (title, excerpt, content, date, cover image) from the admin without touching code or Supabase directly.

### What to build

- `/admin/posts/[id]/edit` — full post edit page
- Rich text editor (recommended: **TipTap** — headings, bold, italic, lists, links, images)
- OR simple HTML textarea for power users who prefer raw HTML
- Live preview panel (renders the article-content CSS exactly as it appears on the blog)
- Slug change with redirect handling
- Category / date / readTime / cover image fields
- Auto-save draft every 30 seconds
- "Publish" and "Unpublish" from the same page

### Files to create

```
app/admin/posts/[id]/edit/page.js      — Post editor page (client component)
app/admin/posts/new/page.js            — Create post from scratch (same editor)
```

### Files to update

```
app/api/admin/posts/[id]/route.js      — Already handles PATCH, just needs full content update
app/admin/page.js                      — Add "Edit" link per row in the posts table
```

### Recommended packages

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

---

## 🔲 Phase 4 — Image Generation + Upload (NOT STARTED)

> **Goal:** Add a 5th tab "Image" on the ideas generation page with three options: AI generate, manual upload, or open carousel builder.

### What to build

#### 4a — AI Image Generation (DALL-E 3)
- New tab "🖼 Image" on `/admin/ideas/new`
- Auto-prompt built from the generated blog title + excerpt
- Returns 1–3 image variations (standard: 1792×1024 landscape for blog/LinkedIn, 1024×1024 square for Instagram)
- Saves chosen image to Supabase Storage
- Attaches as `cover_image` on the published post

#### 4b — Manual Upload
- Upload UI on the same Image tab
- Stores in Supabase Storage bucket `post-images`
- Returns a public URL for the `cover_image` field

#### 4c — Carousel Builder (most complex)
- `/admin/carousel/new` — separate page
- Pick a slide template (3 branded templates: dark indigo, light, gradient)
- Type title + 5 bullet points
- Preview renders as HTML slides using brand tokens
- Export as PNG slides using `html2canvas`
- Download ZIP of all slides for Instagram / LinkedIn carousel

### Files to create

```
app/api/admin/generate-image/route.js  — DALL-E 3 generation API
app/api/admin/upload-image/route.js    — Supabase Storage upload handler
app/admin/carousel/new/page.js         — Carousel builder
```

### Env vars to add

```
# Already there — used by generate route too
OPENAI_API_KEY=sk-...
```

### Supabase Storage setup (run once)

```sql
-- In Supabase dashboard → Storage → New bucket
-- Name: post-images
-- Public: yes
```

### Recommended packages

```bash
npm install html2canvas jszip
```

### Cost

- DALL-E 3 standard (1792×1024): ~$0.04/image
- DALL-E 3 HD: ~$0.08/image
- Manual upload + carousel: free

---

## 🔲 Phase 5 — LinkedIn Direct Publish (NOT STARTED)

> **Goal:** One-click publish to LinkedIn from the ideas page — no copy-paste needed.

### How LinkedIn API works

- LinkedIn uses OAuth 2.0 — you authorise your LinkedIn account once
- Posts via the **UGC Posts API** (`https://api.linkedin.com/v2/ugcPosts`)
- Can attach images (uploaded separately to LinkedIn's image API first)
- Free for personal use with a LinkedIn Developer app

### What to build

- LinkedIn OAuth flow: `/admin/connect/linkedin` → redirect → callback saves access token to Supabase
- "Publish to LinkedIn" button on the idea result page
- Support text-only posts and text + image posts
- Show publish status (pending / published / failed) per idea

### Files to create

```
app/api/admin/linkedin/auth/route.js       — Start OAuth flow
app/api/admin/linkedin/callback/route.js   — Save token to Supabase
app/api/admin/linkedin/publish/route.js    — POST text (+ optional image) to LinkedIn
```

### Database — add to ideas table

```sql
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS linkedin_post_id    TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_published_at TIMESTAMPTZ;

-- Store LinkedIn token securely
CREATE TABLE social_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL,           -- 'linkedin'
  access_token TEXT NOT NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Env vars to add

```
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=https://nrichsouls.in/api/admin/linkedin/callback
```

---

## 🔲 Phase 6 — X/Twitter + Instagram Helpers (NOT STARTED)

> **Goal:** X requires a paid API ($100/month) so the approach is enhanced copy-paste helpers. Instagram API is restricted — same approach.

### What to build

#### X/Twitter helper
- The thread is already generated as separate tweet cards (Phase 2 done)
- Add: "Copy tweet 1", "Copy tweet 2" etc. per-card buttons
- Add: Character counter per tweet (highlight if >280 chars)
- Add: "Copy full thread as numbered text" button

#### Instagram helper
- The caption + hashtags are already generated (Phase 2 done)
- Add: Branded image frame generator (put the post title over a gradient background)
- Add: Download caption as `.txt` file
- Add: Hashtag group manager (save sets of hashtags by category, mix in)

### Files to create / update

```
app/admin/ideas/new/page.js            — Enhance Twitter/Instagram preview components
app/api/admin/hashtags/route.js        — Save/load hashtag groups per category
```

---

## 🔲 Phase 7 — Vercel Deployment (PENDING — user to do)

> Steps are documented in [SETUP.md](SETUP.md) — Step 8.

### Checklist

```
□ Add all env vars to Vercel project settings (Settings → Environment Variables)
□ Set NEXTAUTH_URL = https://nrichsouls.in
□ Add https://nrichsouls.in/api/auth/callback/google to Google OAuth redirect URIs
□ Push to GitHub → Vercel auto-deploys
□ Test /admin login on production
□ Run scripts/phase2-schema.sql in Supabase if not done yet
```

### Required env vars for Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL                    ← must be https://nrichsouls.in
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
ADMIN_EMAIL
OPENAI_API_KEY
ANTHROPIC_API_KEY               ← add when you get it
REVALIDATE_SECRET
```

> **Note on function timeout:** The AI generation route (`/api/admin/generate`) has `maxDuration = 60`. This requires Vercel **Pro plan**. On the free plan, functions time out at 10 seconds which may cut off blog generation. Options: upgrade to Pro, or split generation into separate calls per platform.

---

## Current State of the Database

| Table | Rows | Source |
|---|---|---|
| `posts` | 87 | 40 from WordPress .md files + 47 from Notion |
| `ideas` | 0 | Ready to use from Phase 2 |

---

## Env Vars — Full Reference

| Variable | Used In | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All DB queries | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public reads | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API routes | ✅ Set |
| `NEXTAUTH_SECRET` | Session signing | ✅ Set |
| `NEXTAUTH_URL` | OAuth redirect | ✅ Set (localhost — update for prod) |
| `GOOGLE_CLIENT_ID` | Admin login | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | Admin login | ✅ Set |
| `ADMIN_EMAIL` | Login allowlist | ✅ Set |
| `OPENAI_API_KEY` | AI generation | ⚠️ Needs real key |
| `ANTHROPIC_API_KEY` | AI generation | ⚠️ Add when available |
| `REVALIDATE_SECRET` | ISR revalidation | ✅ Set |
| `NOTION_API_KEY` | Migration only | Can remove after migration |
| `NOTION_DATABASE_ID` | Migration only | Can remove after migration |
| `LINKEDIN_CLIENT_ID` | Phase 5 | Not yet |
| `LINKEDIN_CLIENT_SECRET` | Phase 5 | Not yet |

---

## Quick Reference — Admin URLs

| URL | What it does |
|---|---|
| `/admin/login` | Google sign-in |
| `/admin` | Posts dashboard — all 87 posts, publish toggle, delete |
| `/admin/ideas` | All saved ideas |
| `/admin/ideas/new` | **Drop idea → AI generates 4 platform variants** |
| `/admin/ideas/[id]` | View saved idea, publish blog, copy per platform |
| `/api/admin/posts` | REST API for posts (GET/POST) |
| `/api/admin/posts/[id]` | REST API per post (PATCH/DELETE) |
| `/api/admin/generate` | AI generation endpoint (POST) |
| `/api/admin/ideas` | REST API for ideas (GET/POST) |
| `/api/admin/ideas/[id]/publish` | Publish idea's blog to live site (POST) |

---

## Phase Priority Recommendation

| Priority | Phase | Why |
|---|---|---|
| 1 | **Phase 7 — Deploy to Vercel** | Get the CMS live so you can use it for real |
| 2 | **Phase 3 — Post Editor** | Edit existing 87 posts without touching code |
| 3 | **Phase 4 — Image Generation** | Cover images make posts 3× more shareable |
| 4 | **Phase 5 — LinkedIn Publish** | Biggest distribution win, free API |
| 5 | **Phase 6 — X + Instagram Helpers** | Polish the social workflow |
