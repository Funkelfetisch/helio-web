# HELIO website

Live: https://www.helio.lighting/ — static product and rental enquiries, operated by Auravia LTD.

## Hosting

Cloudflare Pages project `helio-lighting` uses Direct Upload on the existing free account. Upload a ZIP containing `index.html`, `style.css`, `privacy.html`, `404.html`, `_headers`, and `assets/helio-logo.svg` at the archive root. Do not upload Git metadata or private operational evidence. Verify the public files against the release hashes after deployment. This project does not automatically deploy Git commits.

External DNS keeps the existing nameservers: `www` points to `helio-lighting.pages.dev`; apex points to the existing Nginx Proxy Manager host, which redirects HTTPS to www while preserving paths and queries. Mail and `update.helio.lighting` are independent and must be preserved.

Legacy GitHub Pages hosting is retired. Do not enable it for this commerce-oriented site.

## Content and transactions

The current live site has no scripts, tracking, payment processing, or form backend. Enquiry links open a mail client; they do not send automatically. Product availability, configuration, price, and timing require a quote. Enable hosted payments only after verifying fulfillment, seller account, and applicable sale/rental terms. Do not represent unfinished PCB revisions as shipping products.

Preview locally with `python3 -m http.server 8769` and inspect desktop/mobile layouts and links without sending mail.

## Durable enquiry preview

The durable-enquiry preview adds a Pages Function backed by a D1 binding named `HELIO_ENQUIRIES`. It stores only submitted enquiry fields, returns a server-issued reference, keeps the email fallback, rate-limits by a salted one-way connection fingerprint and removes ordinary enquiry rows older than 180 days during subsequent form processing. There is no public read endpoint; owner review uses authenticated D1 administration.

Production requires a separately created D1 database and `RATE_LIMIT_SALT` secret, followed by an isolated preview deployment and an accepted test submission before any live promotion.

Run the isolated local preview without contacting Cloudflare:

```sh
npm install
npm run db:local
npm run preview
```

Wrangler persists the local D1 state under `.wrangler/`. Inspect desktop/mobile layouts, submit one synthetic enquiry, confirm exactly one stored row and its returned reference, then test validation, spam and rate limits. Do not use a real customer's data in preview.
