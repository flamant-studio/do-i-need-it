# Claude Code — Do I Need It? Setup Prompt

## Context

I've built a React app called "Do I Need It?" — an anti-impulse shopping tool. The full app is a single self-contained React component at `[YOUR PATH]/do-i-need-it.jsx`. I need you to help me scaffold it into a deployable project, push it to GitHub, and deploy it to Vercel.

## What exists

- `do-i-need-it.jsx` — the complete app, single React component, no external dependencies beyond React and Google Fonts
- `README.md` — project documentation
- `DESIGN.md` — design system spec from Google Stitch

## What I need

### 1. Scaffold a Vite + React project

```bash
npm create vite@latest do-i-need-it -- --template react
cd do-i-need-it
npm install
```

Then:
- Replace `src/App.jsx` with the contents of `do-i-need-it.jsx`
- Replace `src/main.jsx` with a clean entry point
- Update `index.html` with correct title and meta tags (see below)
- Copy `README.md` and `DESIGN.md` into the project root
- Remove default Vite boilerplate (App.css, index.css, assets/react.svg etc.)

### 2. index.html meta tags

```html
<title>Do I Need It? — An Impulse Check</title>
<meta name="description" content="Five questions between you and your wallet. Takes 30 seconds." />
<meta property="og:title" content="Do I Need It?" />
<meta property="og:description" content="An anti-impulse shopping tool. Paste a URL. Get a verdict." />
<meta name="theme-color" content="#0c0c08" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 3. Push to GitHub

- Create a new public repo called `do-i-need-it`
- Initial commit with message: `init: Do I Need It? v1`
- Push to main branch

### 4. Deploy to Vercel

- Connect the GitHub repo to Vercel
- Framework preset: Vite
- No environment variables needed
- Assign domain: `doineedit.[TBD]` once I confirm the domain

### 5. Verify

- App runs locally with `npm run dev`
- Build succeeds with `npm run build`
- Deployed URL is accessible and renders correctly on mobile

## Notes

- The app has no backend, no API calls, no environment variables
- All product identification is done via local URL parsing in the browser
- The only external requests are Google Fonts (loaded in the component via @import)
- Should be a trivially simple Vercel deploy

## Done when

- [ ] Vite project scaffolded and running locally
- [ ] GitHub repo created and pushed
- [ ] Vercel deployment live
- [ ] Mobile render verified
