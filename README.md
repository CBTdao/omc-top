# AITop — AI Tool Comparisons, One Table at a Time

**Live: https://top.omc.network** · Part of the [omc.network](https://omc.network) ecosystem (main site · [DCF forum](https://forum.omc.network))

AITop is an independent, editorial AI-tool comparison site. One table per question: pricing, models, strengths,
weaknesses and a clear verdict — no 3,000-word fluff.

It is a sister property of [Omniverse Compute (OMC)](https://omc.network) — the decentralized GPU compute network on
BNB Chain. Content is independent; OMC appears only in a clearly-labelled site-wide banner.

## Page inventory (37 URLs)

| Type | Count | Path | Notes |
|---|---|---|---|
| Home | 1 | `/` | Category browser, hot comparisons, rankings |
| Ranking | 14 | `/best/<slug>` | "Best AI X of 2026" listicles, `BEST_DATA` object |
| Comparison | 8 | `/vs/<slug>` | "A vs B" head-to-heads, `VS_DATA` object |
| Glossary hub | 1 | `/glossary` | Index linking all terms |
| Glossary term | 9 | `/glossary/<term>` | ai-agent, ai-hallucination, ai-music-license, ai-token, ai-watermark, context-window, rag, stem-separation, voice-cloning |
| Utility | 4 | `/about` `/contact` `/privacy` `/terms` | — |

## Tech

- Pure static HTML/CSS/JS — no build step, no dependencies
- Data-driven: each comparison/ranking page carries a `window.VS_DATA` / `window.BEST_DATA` object;
  `assets/js/table.js` renders the table/list from it
- Bilingual (EN default, 中文) via `data-i18n` + dictionaries in `assets/js/lang/` — English is the hard default;
  only an explicit switcher choice is persisted (`aitop_lang`), mirroring the omc.network language policy
- Deploy: Vercel, Root Directory = repo root

## URL contract (read before touching links)

Canonical form for **every** page is the **extensionless absolute path with no trailing slash**:
`/best/ai-chatbots`, `/glossary`, `/vs/chatgpt-vs-claude`.

- `vercel.json` = `cleanUrls: true` + `"trailingSlash": false`
- The platform 308-redirects `/x.html` and `/x/` to `/x`. **Any internal link written in either old form creates a
  redirect**, wastes crawl budget and shows up in Search Console as "Page with redirect". Both classes of internal
  link were cleaned up on 2026-10-07/08 — do not reintroduce them.
- Canonical, `og:url`, sitemap and `llms.txt` all use the same extensionless form. Keep them in sync.

## Internal link mesh (added 2026-10-08)

All 22 content pages (`best/*`, `vs/*`, `glossary/*`) end with a static `Related` block:

```html
<p class="gl-note"><b>Related:</b> <a href="/best/ai-chatbots">…</a> · <a href="/glossary/rag">…</a></p>
```

Static HTML on purpose — the page body is rendered by JS from the data object, but crawlers should reach sibling
pages without executing scripts.

**When adding a page:** give it a `Related` block (3–4 semantically relevant links) **and** add it as a target from
at least two existing pages, so every content page keeps ≥2 inbound internal links. Pages with 0 inbound links are
effectively invisible to a crawler that starts at the homepage.

## Editing content

- **New comparison**: copy any file in `vs/`, edit the `window.VS_DATA` object (both `en` and `zh` fields), update
  `<title>`/meta, canonical, breadcrumbs, then add a `Related` block.
- **New ranking**: copy any file in `best/`, edit `window.BEST_DATA`.
- **Prices change**: edit the `pricing` / `price` fields and bump the `updated` date.
- **New glossary term**: copy a file in `glossary/`, add it to `/glossary` hub, add its card + `Related` links.

Then: add the URL to `sitemap.xml`, add it to `llms.txt`, and run the regression below.

## Regression test

```
NODE_PATH=<path-to-node_modules-with-jsdom> node verify-top.js
```

Baseline: **576 assertions, 0 failures**. The script serves the folder over a local port, loads every page in jsdom,
and asserts page structure, related-link presence, JSON-LD, canonical form, sitemap/llms coverage and cross-links.
A first-pass failure is automatically re-run once (environment flakes must not raise a red flag).

## License

MIT
