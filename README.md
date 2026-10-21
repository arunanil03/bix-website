# bix-website

The company website for **Bix Innovations**: a static site (HTML, CSS and vanilla JavaScript) with no build step.

## Structure

```
index.html        Page markup
css/styles.css    All styles
js/main.js        Interactions and animations
assets/           Favicon, logo and images
```

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Hosting

The site is served by GitHub Pages from the `main` branch root. A custom domain is set in **Settings → Pages**, which also commits a `CNAME` file to this repo.
