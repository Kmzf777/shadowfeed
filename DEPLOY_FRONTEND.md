# ShadowFeed Frontend — Deploy on Vercel

## Prerequisites

- GitHub repo: `https://github.com/Kmzf777/shadowfeed.git`
- Backend already deployed and accessible (e.g. `https://api.yourdomain.com`)

---

## Step 1: Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository: `Kmzf777/shadowfeed`
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

---

## Step 2: Environment Variables

In Vercel project settings → **Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rdlmvcvwrofufvlmldlv.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` | Yes |

> **Important**: Replace `https://api.yourdomain.com` with your actual backend URL after deploying the backend.

---

## Step 3: Deploy

Click **Deploy**. Vercel will:
1. Clone the repo
2. Enter the `web/` directory
3. Run `npm install`
4. Run `npm run build` (`next build`)
5. Deploy the output

---

## Step 4: Post-Deploy Verification

1. Open the Vercel URL (e.g. `https://shadowfeed.vercel.app`)
2. Check that the login page loads
3. Log in and verify API calls reach the backend
4. Test creating a post to confirm full connectivity

---

## Redeployment

Vercel auto-deploys on every push to `main`. To manually redeploy:

```bash
# Push changes
cd web/
git add -A
git commit -m "update frontend"
git push origin main
```

Or trigger from Vercel dashboard → Deployments → **Redeploy**.

---

## Custom Domain (Optional)

1. Vercel dashboard → Project Settings → **Domains**
2. Add your domain (e.g. `app.yourdomain.com`)
3. Configure DNS:
   - **CNAME** `app` → `cname.vercel-dns.com`
4. SSL is automatic

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `web/` has all dependencies in `package.json` |
| API calls fail | Verify `NEXT_PUBLIC_API_URL` env var is set correctly |
| Auth not working | Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| CORS errors | Ensure backend allows the Vercel domain in CORS config |
| Page not found | Verify Root Directory is set to `web` in Vercel settings |
