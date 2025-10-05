# Markkët Space

### Storefront Template

#### Ready to Sell

# Markkët Space — Storefront starter (Astro)

A small, content-first storefront template built with Astro and Strapi

It's designed as an example you can copy from, or fork the repo you, customize and deploy

This repo contains a minimal set of pages and components you can reuse:

- /blog — article index and list
- /about — pages and nested pages
- / — home page showing store info and product listing
- /receipt — buyer confirmation page (renders session or payload)
- /newsletter — newsletter landing and subscribe form

The checkout flow in this template is intentionally minimal:

- the product UI opens a checkout modal (client side) that redirects to a payment link
- The receipt page decodes a receipt payload or resolves a Stripe session via your backend

## Quick start

Prerequisites: Node.js (16+), npm or pnpm

1. Fork or clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables (example in `.env` or your hosting configuration):

```env
PUBLIC_STRAPI_URL=https://api.markket.place   # Markket - strapi API
PUBLIC_STORE_SLUG=sell                        # slug identifier from markket
PUBLIC_POSTHOG_KEY=                           # Optional analytics key
PUBLIC_URL= # deployment url for canonical and sitemap
```

4. Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 and browse the routes above.

## Routes & responsibilities

- / (home)
	- Shows store metadata and product listings. Product cards provide a checkout modal or direct-to-payment link.

- /blog
	- Content-driven article index and single article pages powered by Astro content collections.

- /about
	- Simple content pages, supports nested pages.

- /receipt
	- Buyer confirmation page. The client script will either:
		- Parse a receipt payload from the URL (?receipt= encoded JSON or ?payload= base64), or
		- Resolve a Stripe session by POSTing { action: 'stripe.receipt', session_id } to your backend (configured via PUBLIC_STRAPI_URL or markket.config).
	- The page renders amounts, customer info, shipping (if present), and items.

- /newsletter
	- Newsletter landing and a SubscribeForm component (React) that posts to `/api/subscribers`.

## Checkout & Receipt notes

- Checkout modal: the front-end reads a product's metadata and redirects the buyer to a payment link

- Receipt resolving: After checkout, markket redirects back to `/receipt?session_id=...`

## Contributing

We welcome contributions. A few tips:

- Keep changes small and focused
- Update README and comment code where behaviors are non-obvious
- Implement additional Markket features
- Abstract components

## License

TSL
