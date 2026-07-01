# Deploying Wildlore + automatic updates
The app auto-updates: each open it checks the server and reloads to the newest version.
## Publish
1. Netlify: app.netlify.com -> your wildlore site -> Deploys tab -> drag this folder (or the zip).
2. Bump the version in service-worker.js before deploying to force installed apps to update.
## Install
iPhone Safari: Share -> Add to Home Screen. Android Chrome: Install app. Desktop: install icon in the address bar.
## Optional
Cloud sync: run supabase/schema.sql, add keys to js/config.js. Photo AI works on-device by default (no key).
