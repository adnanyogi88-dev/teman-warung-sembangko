# Teman Warung Sembako — Redesign Brief (Anti-Slop)

## Non-negotiable product rules
- Build a real multi-page website. Do not turn the site into a single-page landing page with hash-only navigation.
- Each primary destination must have its own URL and its own page document:
  - Home: /
  - About: /about/
  - Contact: /contact/
  - Products: /products/
  - Blog: /blog/
- Navigation links must open the corresponding page URL. Do not use #about, #contact, or #products as substitutes for pages.
- Keep the existing blog article URLs stable unless a redirect plan is explicitly approved.
- Preserve working account, catalog, affiliate, cart, and dashboard flows; do not silently remove features.

## Image direction — real photography only
- Never use cartoon illustrations, vector people, emoji-as-people, clip-art, synthetic 3D characters, or generic AI-looking human illustrations.
- Use authentic photographic images of real people in relevant Indonesian small-business contexts: shop owners, customers, stock arrangement, cashier interactions, and daily shop operations.
- Prefer original/licensed photography with clear usage rights. Do not hotlink images from unrelated websites.
- Product imagery must remain actual product photography, not illustrated substitutes.
- Use meaningful alt text; decorative images get empty alt text.
- Do not claim a photograph depicts a real Teman Warung member unless that is verified and consented.

## Anti-Slop visual and content standard
- Avoid generic SaaS gradients, excessive rounded cards, glassmorphism, floating decorative blobs, meaningless icon grids, fake metrics, fake testimonials, and filler copy.
- Use a clear visual hierarchy, purposeful whitespace, readable typography, restrained colors, and consistent spacing.
- Design around the actual needs of Indonesian warung owners and UMKM. Use specific, useful Indonesian copy rather than generic marketing slogans.
- Every section must have a clear user purpose and meaningful content.
- Responsive, accessible, keyboard-usable navigation and forms are required.
- Keep page titles, meta descriptions, canonical URLs, Open Graph metadata, and structured data accurate per page.

## Required project architecture
Separate concerns by module. Suggested target structure (adapt to the existing static Vercel deployment without breaking routes):
```
/
  index.html
  about/index.html
  contact/index.html
  products/index.html
  blog/index.html
  blog/<existing-slug>/index.html
  dashboard/index.html
  assets/
    images/
  frontend/
    css/
      tokens.css
      base.css
      layout.css
      components/
    js/
      pages/
        home.js
        products.js
        about.js
        contact.js
      modules/
        navigation.js
        search.js
        cart.js
        favorites.js
        auth-ui.js
  backend/
    supabase/
      schema.sql
      migrations/
  shared/
    config/
    utils/
```
- Keep browser-only code in `frontend/`; keep database schema/migrations and server-side or privileged logic in `backend/`.
- Never expose service-role keys or secrets in frontend files. Browser clients may use only public/anon keys with database RLS policies correctly enforced.
- Shared contracts/configuration must be explicit. Avoid duplicated inline scripts and styles across pages.
- If Vercel is serving a static site, do not introduce server-only code that cannot run in that deployment. Explain any backend hosting requirement before adding one.

## Page requirements
- Home: concise overview, clear value proposition, links to each main page, and a real-photo hero.
- About: purpose, who the platform serves, what it actually provides, and transparent organization/contact information.
- Contact: working contact methods and an accessible contact form only if a real submission endpoint exists; otherwise clearly label WhatsApp/email contact.
- Products: dedicated catalog, search, category filters, product details, and existing cart/favorite behavior if supported.
- Blog: article listing with links to the existing article pages; preserve internal links and sitemap coverage.

## Acceptance checklist
- All five primary pages load directly by URL and refresh without 404s on Vercel.
- Main navigation works from every page and uses real page URLs.
- No cartoon or vector-human imagery remains in page content.
- Existing product data and account flows are not lost.
- Frontend modules are separated from backend/database files.
- Mobile layout, keyboard navigation, form labels, contrast, and image alt text are checked.
- Sitemap and robots.txt reflect the actual public pages; private dashboard/auth pages are not indexed.
- No fake reviews, fake user counts, fake partner claims, or unsupported price/stock claims.
