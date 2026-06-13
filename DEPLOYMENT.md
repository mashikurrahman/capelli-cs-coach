# Deploying Capelli CS Coach to Vercel

This is a Next.js 14 app with API routes + Prisma + Supabase (pgvector). It needs
a Node runtime and a build step — it is **not** static file hosting.

## 1. Push the repo to GitHub
Make sure `.env` is **not** committed (it's gitignored). Only `.env.example`
(placeholders) should be in the repo.

```bash
git add -A
git commit -m "Prepare for Vercel deployment"
git push
```

## 2. Create the Vercel project
- Go to vercel.com → New Project → import this GitHub repo.
- Framework preset: **Next.js** (auto-detected).
- Build command: leave default (`npm run build` → runs `prisma generate && next build`).
- Output: default.

## 3. Set Environment Variables (Project → Settings → Environment Variables)
Add each of these for the **Production** (and Preview) environment:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase **Session Pooler** connection string |
| `NEXTAUTH_SECRET` | A long random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |
| `AI_CHAT_PROVIDER` | `cloudflare` |
| `CLOUDFLARE_CHAT_MODEL` | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| `AI_EMBEDDING_PROVIDER` | `cloudflare` |
| `AI_EMBEDDING_MODEL` | `@cf/baai/bge-base-en-v1.5` |
| `CLOUDFLARE_ACCOUNT_ID` | your Cloudflare account id |
| `CLOUDFLARE_API_TOKEN` | your Cloudflare Workers AI token |
| `GROQ_API_KEY` | (optional, only if you switch back to Groq) |

> **Rotate** the Groq/Cloudflare keys if they were ever committed.
> After the first deploy, update `NEXTAUTH_URL` to the final domain and redeploy.

## 4. Database
Your Supabase database is already created, seeded, and has the embeddings.
Production points at the **same** `DATABASE_URL` — no migration or re-seed needed.

If you ever set up a **fresh** database, run locally against it:
```bash
npm run db:push          # create tables + pgvector
npm run db:seed          # workflows, users, etc.
npm run seed:templates   # 56 official email templates
npm run kb:reembed       # embed the knowledge base (or npm run kb:ingest)
```

## 5. Deploy
Click **Deploy**. Vercel builds and hosts it. Subsequent `git push` auto-deploys.

## Known limitation: in-app document upload
Uploading new training docs through Admin → Upload writes to the OS temp dir on
Vercel (the only writable path) and is **ephemeral** — fine for a one-off but not
reliable. To add training material in production, run `npm run kb:ingest` locally
against the production `DATABASE_URL`, or ask to wire Supabase Storage.
