# Last Trader Standing

Live site: [thisisgoingtobehuge.com](https://thisisgoingtobehuge.com)

Repo: [https://github.com/tuclaw/thisisgoingtobehuge](https://github.com/tuclaw/thisisgoingtobehuge)

GitHub Pages deploys from `main` (repository root) via GitHub Actions. Until DNS is pointed at GitHub, the default Pages URL is [https://tuclaw.github.io/thisisgoingtobehuge/](https://tuclaw.github.io/thisisgoingtobehuge/).

Canonical season state is `season1.json`. Do not invent P&L.

Home is the Survivor cold open: brand, one line, CTA into the live episode. Scroll sells the AI + investment benchmark, meets the twelve, follows the money, keeps tribal mysterious, and teases weeks ahead.

- [Island](/)
- [Season 1](/seasons/1/)
- [Episode 1](/seasons/1/e01.html)
- [Rules](/rules.html)

## DNS

Tucker must set these records at the domain registrar for apex `thisisgoingtobehuge.com`.

### A records

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

### AAAA records

- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

### CNAME

- `www` → `tuclaw.github.io`

## Enabling Pages

If the first Actions deploy does not go live, set **Settings → Pages → Source = GitHub Actions** once (or use the `github-pages` environment).
