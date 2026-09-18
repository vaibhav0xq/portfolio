# Vaibhav Gangani, portfolio

Source of my personal site: the community work I did at Talus Labs, the products I have built and how to reach me. One page, static, built with React and Vite.

Live: [portfolio-zeta-liart-mxmb0dinaf.vercel.app](https://portfolio-zeta-liart-mxmb0dinaf.vercel.app)

## What is on the page

- Work: the Discord moderation role at Talus Labs with a board of screenshots from the community.
- Projects: Kyro, LumenMarc, Suho and Turnstile, each with a screenshot, the stack and links.
- About: the tools I use and the product or job each one came from.
- Why hire me: plain reasons, written in first person.
- Contact: email, GitHub and X, plus the resume as a PDF.

## Stack

- React 19 and TypeScript
- Vite 7
- Tailwind CSS 4
- GSAP (ScrollTrigger, MotionPathPlugin) and Lenis for scroll and motion
- three.js with React Three Fiber for the three paper prints in the hero
- Fraunces, Caveat and Courier Prime through Fontsource

## Notes on the implementation

- The preloader strokes my name as SVG paths generated from the Caveat font (`scripts/gen-name-path.mjs`).
- The hero prints are painted on a canvas (`src/scene/faces.ts`) and used both as WebGL textures and as a plain DOM fallback. Phones and browsers without WebGL get the DOM version.
- The projects shelf is pinned and scrolls sideways on wide screens. Below 900px or with reduced motion the cards stack vertically.
- Every raster image goes through `src/components/Img.tsx`, which retries failed loads and draws a placeholder at the right aspect ratio if a file never arrives.
- The phone menu and the lightbox trap focus, close on Escape and return focus to the element that opened them. Scrolling is locked with a counted lock so one overlay closing under another cannot unfreeze the page.
- Copy lives in `src/content/`, not in components. `scripts/check-copy.mjs` enforces the house style: no em or en dashes, no comma before and/or, no emojis and no filler words.

## Development

Requires Node.js 22.12 or newer and pnpm 10.

```sh
pnpm install
pnpm dev          # serves the site on http://localhost:5173
pnpm build        # writes the production build to dist/public
pnpm preview      # serves the production build
pnpm typecheck
pnpm check:copy
```

`PORT` changes the dev and preview port. `BASE_PATH` sets the public base path when the site is served under a prefix.

Two optional checks drive a headless Chromium (the first `chromium` on PATH or the binary named in `CHROME`) against a running dev server: `pnpm snap` takes screenshots with software WebGL and `pnpm audit:clicks` hit tests every link and button at each section.

## Layout

```
index.html
public/           screenshots, doodles, social card, resume
src/
  components/     page sections and shared pieces
  content/        profile facts, site copy and the name path for the preloader
  lib/            GSAP and Lenis wiring, scroll lock, focus trap
  scene/          the WebGL prints and the canvas painter for their faces
  index.css       theme tokens and component classes
scripts/          copy check, screenshot and click audit helpers, name path generator
```

## Deployment

The build is static. `vercel.json` selects the Vite preset, points at `dist/public` and sets long lived caching for hashed assets, so importing the repository on Vercel needs no further settings. Every push to `main` deploys. The site URL is written into `index.html` (canonical link, `og:url` and the social card image), so a change of domain means updating those three lines.

## Contact

- Email: vaibhavgangani12345@gmail.com
- GitHub: [vaibhav0xq](https://github.com/vaibhav0xq)
- X: [vaibhav_0xq](https://x.com/vaibhav_0xq)
