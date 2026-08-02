# Render Cloud Deployment Guide

This application is optimized for deployment as a **Node.js Web Service** on Render.

## Build & Start Commands

```bash
# Build Command
npm install && npm run build

# Start Command
npm run start
```

## Required Environment Variables

Add the following environment variables under **Render Dashboard → Your Web Service → Environment**:

| Variable Name | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret key (Server-only) |
| `AUTH_SECRET` | Secret string for session token hashing |
| `NEXT_PUBLIC_APP_URL` | Your public Render service URL (e.g. `https://apl-auction.onrender.com`) |

## Redeployment

After pushing updates to your GitHub repository:
1. Navigate to your Render service.
2. Select **Manual Deploy → Deploy latest commit**.
3. Render will build and deploy the Next.js production bundle seamlessly.
