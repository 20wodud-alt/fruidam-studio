# Vercel deployment

Production: https://fruidam-studio.vercel.app (Vercel login required).

Project: fruidam-studio. Runtime: Node.js 24. Function region: icn1 (Seoul). Latest policy (2026-11-10): Supabase Auth and server-side member approval now protect private APIs and studio access. Use prod_deployment_urls_and_all_previews to keep generated deployment URLs and previews protected, while allowing the production domain to show public basic pages. Do not disable protection for historical deployments.

## Deploy again

Run from this project directory after CLI login:

```powershell
vercel --prod --yes
```

.vercel connection files are ignored by Git. .vercelignore excludes local data, settings and backups from deployment.

## Server environment

Set these variables for Production and Preview. Never commit actual keys:

- FRUIDAM_STORAGE=supabase
- FRUIDAM_ASSET_STORAGE=supabase
- FRUIDAM_SETTINGS_STORAGE=supabase
- SUPABASE_URL and SUPABASE_SECRET_KEY
- GEMINI_API_KEY and GEMINI_MODEL
- NONGSARO_API_KEY is reserved for a future integration; no live lookup exists yet.

Manage environment keys in Vercel. The app cannot replace or remove those keys. Saved preferences exclude keys and use private Storage.

## Persistent storage

Projects and sections use FRUIDAM_projects and FRUIDAM_sections. Images and generation metadata use the private fruidam-assets bucket through the server. Existing /api/uploads URLs remain valid. Photo lists remain scoped to the current project. Local originals and backups are preserved.

Images over 4MB are reduced locally in the browser before upload to respect Vercel request limits. Original input is limited to 8MB. This process uses no AI API.

Smoke checks verified six projects, 100 sections, photo listings, an image checksum and unauthenticated access redirecting to Vercel login. No Gemini generation requests were made for deployment verification.
