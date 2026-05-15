# Cloudflare Worker — getnestdaily.xyz

## Overview

> ### 🚨 PERMANENT LOCK — Google Analytics ID
> **`G-8H8J4V3ZWY` in `src/layouts/BaseLayout.astro` must NEVER be changed.** No agent or automated process may modify it without explicit owner permission (Kaushik Jagani).

The `worker.js` file in the project root is a **Cloudflare Worker** script that handles HTTP-level redirects for `getnestdaily.xyz`. It must be deployed via the Cloudflare dashboard or CLI, **not** automatically bundled by Astro.

## What the Worker Does

| Rule | From | To | Status Code |
|------|------|----|-------------|
| www → non-www | `www.getnestdaily.xyz/*` | `getnestdaily.xyz/*` | 301 |
| /index.html | `getnestdaily.xyz/index.html` | `getnestdaily.xyz/` | 301 |
| HTTP → HTTPS | `http://getnestdaily.xyz/*` | `https://getnestdaily.xyz/*` | 301 |
| Normal request | All others | Pass-through | — |

## File Location

```
worker.js   ← project root (deploy this to Cloudflare Workers)
```

## How to Deploy

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages → Create Worker**
3. Paste the contents of `worker.js` into the editor (or use Wrangler CLI)
4. Assign the worker to the `getnestdaily.xyz` route via **Workers Routes** in the domain's DNS settings

## ⚠️ STRICT RULES — READ BEFORE MAKING ANY CHANGES

> **NEVER update `wrangler.json`, `wrangler.toml`, or any other Cloudflare configuration file without explicit approval from the project owner.**

- `wrangler.json` controls the deployment environment, bindings, and routing — incorrect changes can take the site offline
- Any Cloudflare config change (routes, KV, R2, environment variables) must be reviewed and approved before applying
- If you need a config change, document what you want changed and **wait for approval** before touching any Cloudflare config file

---

*Last updated: May 2026*
