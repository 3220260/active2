# Synetelas Offers

Static GitHub Pages site for the Synetelas offers landing page.

## Project Structure

- `index.html` - the page markup and modal content.
- `assets/css/tailwind.input.css` - Tailwind source file.
- `assets/css/tailwind.css` - generated Tailwind CSS committed for GitHub Pages.
- `assets/css/styles.css` - custom animations, modal styling, and responsive polish.
- `assets/js/main.js` - UI behavior, image preview zoom, clipboard actions, chat modal, and cookies.
- `assets/images/` - local image assets.
- `assets/docs/` - downloadable PDF documents.
- `scripts/check-static-assets.mjs` - static validation for broken local references and removed patterns.

## Analytics

Google Analytics loads only after the visitor accepts cookies. The site sends anonymous engagement events for offer opens, offer close/time spent, offer card visibility, document previews, PDF downloads, contact clicks, Viber clicks, and payment-copy clicks. It does not send phone numbers, email addresses, or IBAN values.

## Local Commands

Install dependencies once:

```bash
npm ci
```

Build the production CSS:

```bash
npm run build
```

Run the full static check:

```bash
npm run check
```

## GitHub Pages

This site is ready to publish from the repository root. Commit `index.html`, `assets/`, `scripts/`, `package.json`, `package-lock.json`, `.nojekyll`, and `.github/workflows/static-check.yml`.

Do not commit `node_modules/`; it is intentionally ignored.

In GitHub, enable Pages from the branch that contains `index.html`. The generated `assets/css/tailwind.css` is already included, so the live site does not need a build step to render correctly.
# Site_Syneterismos-ast..._version_1.0-ready-to-publish
