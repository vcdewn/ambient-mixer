# Ambient Mixer

Lo-fi / ambient sound mixer: rain, thunder, campfire, highway, night forest, train, beach and blizzard loops with per-sound volume, a focus (Pomodoro) timer, a sleep timer and an animated glass UI. RU / EN.

Design: [project-design.md](project-design.md)

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # static site in dist/
```

## Sounds and licenses

The loops in `public/audio/*.m4a` are recordings from Wikimedia Commons, trimmed to ≤ 75 s, cross-faded into seamless loops, loudness-matched and encoded as AAC. Authors, licenses and source links live in `src/data/sounds.ts` and are shown in the “Sound credits” block of the UI.

| Sound | Source | Author | License |
|---|---|---|---|
| Rain | Rain against the window | cori | Public domain |
| Thunder | rbh-thunder-storm | RHumphries | CC BY 3.0 |
| Campfire | Campfire sound ambience | Glaneur de sons | CC BY 3.0 |
| Highway | Highway from bridge center | stephan | Public domain |
| Night forest | Nature sounds ambience in a Dordogne pond | Glaneur de sons | CC BY 3.0 |
| Train | Стук колёс поезда | Ural-66 | CC0 |
| Beach | Ocean Waves on a Tropical Beach | Jarrod stanley | CC0 |
| Blizzard | IJzige wind met een sneeuwbui | Beeld en Geluid | CC BY-SA 3.0 |

The CC BY recordings (thunder, campfire, night forest) are edited (trimmed, looped, loudness-matched, converted); credit is shown in the app.

To swap a sound, drop a new file into `public/audio/` and update `file` / `credit` in `src/data/sounds.ts` (use a new file name — audio is cached for a day).

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

- Check the deployed site on a real iPhone and Android phone: sound starts after “Start session”, sliders work, loops are seamless.
