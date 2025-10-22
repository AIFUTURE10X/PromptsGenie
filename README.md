# Genie Prompt Generator

[![Deploy to GitHub Pages](https://github.com/aifuture10x/Genie-Prompt-Generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/aifuture10x/Genie-Prompt-Generator/actions/workflows/deploy.yml)

Live site: https://aifuture10x.github.io/Genie-Prompt-Generator/

## Overview
A Vite + React app deployed to GitHub Pages. Production builds use the correct base path (`/Genie-Prompt-Generator/`) and include an SPA fallback for deep-link refreshes.

## Local Development
- `npm install`
- `npm run dev`
- Open the local URL printed by Vite (e.g. `http://localhost:5173/`).

## Deployment
- Push to `main` triggers the "Deploy to GitHub Pages" workflow.
- Manual runs are available in GitHub → Actions → Deploy to GitHub Pages.
- Artifacts are built to `dist/` and published to Pages automatically.

## SPA Deep Links (GitHub Pages)
GitHub Pages doesn’t natively support client-side routing. This repo includes:
- `public/404.html` – redirects unknown paths to `index.html` while preserving the URL.
- `index.html` – a small script restores the original URL via `history.replaceState` before the app loads.

Implementation based on: https://github.com/rafgraph/spa-github-pages

## Troubleshooting
- 404 after refresh: make sure `public/404.html` exists in the deployed site and that `index.html` includes the redirect script.
- Broken assets on Pages: verify `vite.config.ts` sets `base` to `/Genie-Prompt-Generator/` for production builds.
- Cache issues: hard refresh (`Ctrl+Shift+R`) or clear browser cache.

## Notes
- The Pages deployment will auto-update with each push to `main`.
- Use "Unpublish site" in GitHub Pages to temporarily take the site offline; republish by pushing again or re-running the workflow.