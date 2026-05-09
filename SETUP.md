# ArtMind AI – Phase 1 Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase project (free at supabase.com)
- A Vercel account (free at vercel.com)

---

## Step 1 – Supabase database

1. Go to **supabase.com** → your project → **SQL Editor**
2. Open the file `supabase/schema.sql` from this folder
3. Paste the entire contents into the SQL editor and click **Run**
4. You should see: `profiles`, `credits`, `generations` tables created

---

## Step 2 – Enable Google OAuth (optional but recommended)

1. Supabase dashboard → **Authentication** → **Providers** → **Google**
2. Enable it and follow the Google Cloud Console instructions
3. Set redirect URL to: `https://your-domain.com/dashboard`

---

## Step 3 – Local setup

```bash
# 1. Copy this folder somewhere on your machine
cd artmind-saas

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
```

Edit `.env` and fill in your Supabase values:
- **VITE_SUPABASE_URL** → Supabase dashboard → Settings → API → Project URL
- **VITE_SUPABASE_ANON_KEY** → Supabase dashboard → Settings → API → anon public key

```bash
# 4. Start dev server
npm run dev
# → Opens at http://localhost:5173
```

---

## Step 4 – Test auth flow

1. Visit `http://localhost:5173`
2. Click **Get 10 Free Images**
3. Sign up with email — check your inbox for confirmation
4. After confirming, sign in
5. You should see **10 credits** in the navbar ✓
6. Visit `/profile` to see your account details ✓

---

## Step 5 – Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel
```

During setup, add environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Also add these for Phase 2 (API proxy) — keep them secret:**
- `OPENAI_API_KEY` = your OpenAI key
- `STABILITY_API_KEY` = your Stability AI key

---

## What's built in Phase 1

| Feature                        | Status |
|-------------------------------|--------|
| Email sign up / sign in        | ✅     |
| Google OAuth                   | ✅     |
| Auto 10 credits on signup      | ✅     |
| Credit balance in navbar       | ✅     |
| Protected dashboard route      | ✅     |
| User profile page              | ✅     |
| Pricing page                   | ✅     |
| Supabase RLS security          | ✅     |

---

## Next phases

| Phase | What gets built                          |
|-------|------------------------------------------|
| 2     | Vercel API proxy (keys stay server-side) |
| 3     | Credit deduction on generation           |
| 4     | Stripe payments (buy credit packs)       |
| 5     | User gallery + image history             |
| 6     | Admin dashboard + launch                 |

---

## Folder structure

```
artmind-saas/
├── supabase/
│   └── schema.sql          ← Run this in Supabase SQL Editor
├── src/
│   ├── lib/
│   │   └── supabase.ts     ← Supabase client + types
│   ├── contexts/
│   │   └── AuthContext.tsx ← Auth state, user, credits
│   ├── components/
│   │   ├── Navbar.tsx      ← Nav with credits badge
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── AuthPage.tsx    ← Sign in / Sign up
│   │   ├── Dashboard.tsx   ← Generate images
│   │   ├── ProfilePage.tsx ← User account
│   │   └── PricingPage.tsx ← Buy credits
│   ├── App.tsx             ← Router
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── vite.config.ts
└── index.html
```
