# Deploy Wildlore on Cloudflare Pages (free, functions included)

## 1. Put the code on GitHub
Use the same GitHub repo you made (or create one). Make sure the repo's TOP level contains
`index.html`, the `js/`, `css/`, and **`functions/`** folders (not nested inside another folder).

## 2. Create the Cloudflare Pages project
1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and pick your `wildlore` repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave blank)
   - **Build output directory:** `/`  (just the root)
4. **Save and Deploy.**

Cloudflare auto-detects the `/functions` folder, so `/api/identify` and `/api/illustrate` go live automatically.

## 3. Add environment variables
In your Pages project → **Settings → Environment variables → Production** → add:
- **`GEMINI_API_KEY`** — free key from aistudio.google.com (no credit card). Powers identification for free.
- *(optional)* **`ART_API_KEY`** — your OpenAI key, only if you want the "Draw & place" illustrations.
- *(optional)* **`GOOGLE_VISION_KEY`**, **`GEMINI_MODEL`**, **`ART_MODEL`**.
Then **Retry deployment** (env changes need a fresh deploy).

## 4. Verify
- Visit `https://YOUR-PROJECT.pages.dev/api/identify` → you should see `{"ok":true,...}` (not 404).
- In the app, take a photo → it should read **"Identified by AI vision."**

## Updating later
Push new files to the GitHub repo → Cloudflare auto-deploys. Cloudflare's free tier is far more
generous than Netlify's (no tight per-deploy credit cap), so you can iterate freely.
