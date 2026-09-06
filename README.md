# HELIO website

Live: https://www.helio.lighting/ — static product and rental enquiries, operated by Auravia LTD.

## Hosting

Cloudflare Pages project `helio-lighting` uses Direct Upload on the existing free account. Upload a ZIP containing `index.html`, `style.css`, `privacy.html`, `404.html`, `_headers`, and `assets/helio-logo.svg` at the archive root. Do not upload Git metadata or private operational evidence. Verify the public files against the release hashes after deployment. This project does not automatically deploy Git commits.

External DNS keeps the existing nameservers: `www` points to `helio-lighting.pages.dev`; apex points to the existing Nginx Proxy Manager host, which redirects HTTPS to www while preserving paths and queries. Mail and `update.helio.lighting` are independent and must be preserved.

Legacy GitHub Pages hosting is retired. Do not enable it for this commerce-oriented site.

## Content and transactions

The site has no scripts, tracking, payment processing, or form backend. Enquiry links open a mail client; they do not send automatically. Product availability, configuration, price, and timing require a quote. Enable hosted payments only after verifying fulfillment, seller account, and applicable sale/rental terms. Do not represent unfinished PCB revisions as shipping products.

Preview locally with `python3 -m http.server 8769` and inspect desktop/mobile layouts and links without sending mail.
