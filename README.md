# Ambient Mixer

Lo-fi / ambient sound mixer: rain, thunder, campfire, café, night forest and train loops with per-sound volume, a focus (Pomodoro) timer, a sleep timer and an animated glass UI. RU / EN.

Design: [project-design.md](project-design.md)

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # static site in dist/
```

## Replace the placeholder sounds

`public/audio/*.wav` are **generated placeholders** (`npm run gen-audio`) so the app works out of the box.
Swap them for real seamless loops (CC0 / CC-BY, e.g. from Freesound or Wikimedia Commons — Freesound needs a login to download):

1. Drop files into `public/audio/` (mp3 ≈ 128 kbps, 20–60 s, loop-friendly).
2. Update `file` and `credit` for each entry in `src/data/sounds.ts`.
3. CC-BY requires attribution — the “Sound credits” block in the UI is built from `credit`.

## Notes

- The `AudioContext` is created on the “Start session” click (browsers block autoplay otherwise).
- Pausing the mix mutes a gain gate instead of suspending the context, so the focus-timer chime still rings.
- The chime is synthesized with Web Audio (no extra asset).
- Settings and volumes are stored in `localStorage`; every session starts with all sounds off.
## Deploy

The app is a static site (`npm run build` → `dist/`). Security (CSP, nosniff, referrer) and cache headers are already configured:
`vercel.json` for Vercel, `public/_headers` for Netlify / Cloudflare Pages. Audio files are cached for one day (their names have no hash, so a longer cache would serve stale sounds after you replace them); hashed `/assets/*` are cached for a year.

### Vercel

1. Push the repo to GitHub:
   ```bash
   git add -A && git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:<you>/ambient-mixer.git
   git push -u origin main
   ```
2. On [vercel.com/new](https://vercel.com/new) import the repository. The Vite preset, `npm run build` and `dist` are picked up from `vercel.json` — just press **Deploy**.
3. Every push to `main` redeploys automatically.

Or from the CLI: `npx vercel` (preview) / `npx vercel --prod`.

### Netlify

Import the repo at [app.netlify.com](https://app.netlify.com), build command `npm run build`, publish directory `dist`; `public/_headers` is applied automatically.

### Before going public

- Replace the placeholder sounds and fill in the credits (see above) — CC-BY requires attribution.
- Check the deployed site on a real iPhone and Android phone: sound starts after “Start session”, sliders work, loops are seamless.
