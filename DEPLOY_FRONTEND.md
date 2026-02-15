
# github 
- GitHub repo: `https://github.com/Kmzf777/shadowfeed.git`


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

