# Accurate photo ID with iNaturalist (permanent setup)

The app already calls the included serverless function (/.netlify/functions/identify), which
sends your photo to iNaturalist's Computer Vision API and compares it to their species photos.
You just give it credentials once. (No credentials = it quietly uses the on-device model.)

## Permanent setup (does not expire) — recommended
1. Make a free account at https://www.inaturalist.org
2. Register an application: https://www.inaturalist.org/oauth/applications/new
   - Name: Wildlore (anything)
   - Redirect URI: your site URL, e.g. https://wildlore.netlify.app
   - Save. Copy the "Application ID" (this is your client id) and the "Secret".
3. In Netlify -> your site -> Site configuration -> Environment variables, add FOUR variables:
   - INAT_CLIENT_ID      = the Application ID
   - INAT_CLIENT_SECRET  = the Secret
   - INAT_USERNAME       = your iNaturalist username
   - INAT_PASSWORD       = your iNaturalist password
4. Re-deploy (Deploys tab -> Trigger deploy -> Deploy site, or drag the folder again).

Done — the function now mints its own tokens and never expires. The Photo tab will say
"Compared against iNaturalist species photos" when it is using it.

## Quick test alternative (expires in ~24h)
Instead of the four variables above, set ONE variable INAT_API_TOKEN to the value from
https://www.inaturalist.org/users/api_token  (good for trying it today; it stops working tomorrow).

## Tips
- Allow location in the app: iNaturalist uses where you are to rank local species first, which
  makes results much more accurate.
- The "What do you think it is?" field in the Photo tab seeds the AI with your guess for the
  best results when you already have an idea.
- iNaturalist's free vision access is rate-limited (about 200 requests/month) - fine for personal use.

---

## Per-species AI illustrations (optional, premium-grade)

Wildlore ships with hand-crafted vector art for every species. You can *also* enable a per-species
AI illustration pass: when you open a species you've discovered, the app requests a unique, painterly
field-guide illustration in one consistent house style, caches it (per device, and shared across users
via Netlify Blobs), and shows it as the entry's hero. No key = the polished vector art is used instead.

**Setup (Netlify → Site configuration → Environment variables):**

- `ART_API_KEY` — your OpenAI API key (required)
- `ART_MODEL` — optional; defaults to `gpt-image-1`. `dall-e-3` also works.

Then redeploy. Open a discovered species — you'll see "Painting a field illustration…" briefly, then
the artwork. Each species is generated once and reused.

**Cost control:** illustrations are generated only for species you actually open, only once each
(then cached forever). Locked/undiscovered species are never generated, so they stay mysteries.

---

## Sharper photo ID with Google Vision (optional "reverse image search")

There is no free official Google Lens API, but **Google Cloud Vision "Web Detection"** is the same
idea: it identifies the subject from the whole web and returns visually-similar photos. Wildlore can
use it alongside iNaturalist — iNaturalist is best for organisms; Web Detection is a strong general
fallback and gives you real web photos to compare against in the match screen.

**Setup:** create a Google Cloud project, enable the **Cloud Vision API**, make an API key, then in
Netlify add:

- `GOOGLE_VISION_KEY` — your Cloud Vision API key

Redeploy. With it set, the identify function blends iNaturalist + Web Detection results and shows a
"Similar photos from the web" strip when you compare a match. (Cloud Vision is ~$1.50 per 1,000 images.)

---

## Photo identification engines (priority order)

Wildlore now tries, in order, whichever you've enabled — each result is labeled so users know what identified it:

1. **iNaturalist computer vision** — best for organisms, location-aware. Needs the `INAT_*` vars above. (Access is gated by iNaturalist.)
2. **AI vision (GPT-4o)** — strong generalist, **no access gate**, reuses your OpenAI key. Set **`OPENAI_API_KEY`** (or it falls back to `ART_API_KEY`). Optional `IDENT_MODEL` (default `gpt-4o-mini`; use `gpt-4o` for max accuracy). This is the recommended path to a launchable identifier without waiting on iNaturalist approval.
3. **Google Vision Web Detection** — `GOOGLE_VISION_KEY` (also adds "similar photos from the web").
4. **On-device MobileNet** — automatic offline fallback, no key (generic, least accurate).

**Recommended minimum for launch:** set `OPENAI_API_KEY`. That single key powers both the per-species illustrations *and* the AI identifier. Add iNaturalist later for specialist accuracy.
