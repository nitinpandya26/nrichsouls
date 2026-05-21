# Phase 1 Setup Guide — NrichSouls CMS

Follow these steps in order. Takes about 20 minutes total.

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** and sign up (free)
2. Click **New project**, choose a name (e.g. `nrichsouls`), pick a region close to India (Singapore), set a strong DB password, click **Create project**
3. Wait ~2 minutes for the project to provision

---

## Step 2 — Create the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**, paste the SQL below, and click **Run**

```sql
-- Posts table
CREATE TABLE posts (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  excerpt     TEXT        DEFAULT '',
  content     TEXT        DEFAULT '',
  category    TEXT        NOT NULL,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  read_time   TEXT        DEFAULT '',
  cover_image TEXT        DEFAULT '',
  published   BOOLEAN     DEFAULT false,
  status      TEXT        DEFAULT 'draft',
  source      TEXT        DEFAULT 'cms',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on every edit
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX idx_posts_slug      ON posts (slug);
CREATE INDEX idx_posts_category  ON posts (category);
CREATE INDEX idx_posts_published ON posts (published, date DESC);

-- Ideas table (ready for Phase 2)
CREATE TABLE ideas (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_idea            TEXT        NOT NULL,
  generated_blog      TEXT,
  generated_linkedin  TEXT,
  generated_instagram TEXT,
  generated_twitter   TEXT,
  status              TEXT        DEFAULT 'draft',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: public can only read published posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published posts" ON posts
  FOR SELECT USING (published = true);
-- The service_role key used in admin API routes bypasses RLS automatically
```

---

## Step 3 — Get Your Supabase API Keys

1. Go to **Project Settings → API** (gear icon in sidebar)
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret

---

## Step 4 — Set Up Google OAuth

1. Go to **https://console.cloud.google.com**
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → OAuth consent screen**
   - User Type: **External**, fill in App name (`NrichSouls CMS`), your email
   - Add scope: `email`, `profile`
   - Add test user: `nitinpandya26@gmail.com`
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins:
     - `http://localhost:3000`
     - `https://nrichsouls.in`
   - Authorised redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://nrichsouls.in/api/auth/callback/google`
5. Copy **Client ID** → `GOOGLE_CLIENT_ID`
6. Copy **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## Step 5 — Create Your `.env.local` File

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 6 — Run the Migration Script

This imports all 40 existing blog posts from `content/posts/*.md` into Supabase:

```bash
node scripts/migrate-to-supabase.mjs
```

You should see 40 `✓` lines and a summary. Run it safely multiple times — it uses `upsert` so no duplicates are created.

---

## Step 7 — Test Locally

```bash
npm run dev
```

- Blog: http://localhost:3000 — should show all 40 posts from Supabase
- CMS login: http://localhost:3000/admin/login → sign in with Google
- Dashboard: http://localhost:3000/admin → see all posts, toggle publish

---

## Step 8 — Deploy to Vercel

Add these environment variables in your **Vercel project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase |
| `NEXTAUTH_SECRET` | Generated random string |
| `NEXTAUTH_URL` | `https://nrichsouls.in` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `ADMIN_EMAIL` | `nitinpandya26@gmail.com` |

Then push to GitHub — Vercel will redeploy automatically.

---

## What's Next (Phase 2)

- [ ] Post editor (rich text, save as draft, preview before publish)
- [ ] AI content generation (idea → blog + LinkedIn + Instagram + X variants)
- [ ] Image upload to Supabase Storage
- [ ] LinkedIn API direct publish
- [ ] Carousel / image template builder
