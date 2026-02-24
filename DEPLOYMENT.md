# Fixing 404 and homepage on Vercel (madeleinelee.vercel.app)

If **https://madeleinelee.vercel.app/prototypes/personality-test-2** shows 404 or the homepage only shows one prototype, Vercel is likely **not** deploying the latest code from this repo.

## 1. Check which repo is connected

- Go to [Vercel Dashboard](https://vercel.com/dashboard) → your project (**madeleinelee**).
- **Settings** → **Git**.
- Confirm **Connected Git Repository** is the repo that contains this code (e.g. `magicraisin/cursor` or your fork). If it’s a different repo or none, connect the correct one.

## 2. Check branch and root

- **Settings** → **Git**:
  - **Production Branch** should be `main` (or the branch you push to).
- **Settings** → **General**:
  - **Root Directory** should be empty or `.` (so the whole repo is the app). Do **not** set it to a subfolder unless you intend to deploy only that folder.

## 3. Trigger a fresh deploy

- Open the **Deployments** tab.
- Click the **⋯** on the latest deployment → **Redeploy**.
- Leave **Use existing Build Cache** unchecked so the build is clean.
- After the deploy finishes, check:
  - **https://madeleinelee.vercel.app/** — should list both “10 questions” and “original, 11 questions”.
  - **https://madeleinelee.vercel.app/prototypes/personality-test-2** — should load the new test.

## 4. If you deploy from a different repo

Push this code to the repo that’s connected to Vercel, then redeploy. The project needs:

- `app/page.tsx` (homepage with both prototypes)
- `app/prototypes/personality-test-2/page.tsx` and `styles.module.css`
- `public/images/agent-cards/` and `public/images/agents/` (new assets)

## Alternate URLs (after a correct deploy)

- **https://madeleinelee.vercel.app/personality-test-2** → redirects to the new test
- **https://madeleinelee.vercel.app/pt2** → redirects to the new test
