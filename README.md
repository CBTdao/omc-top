# AITop — AI Tool Comparisons, One Table at a Time

> Live: https://top.omc.network (after Vercel binding)

AITop is an independent, editorial AI-tool comparison site. One table per question: pricing, models, strengths, weaknesses, and a clear verdict — no 3,000-word fluff.

It is a sister property of [Omniverse Compute (OMC)](https://omc.network) — the decentralized GPU compute network on BNB Chain. Content is independent; OMC appears only in a clearly-labelled site-wide banner.

## Pages

| Type | URL | Topic |
|---|---|---|
| Home | `/` | Category browser + hot comparisons + rankings |
| Comparison | `/vs/chatgpt-vs-claude` | ChatGPT vs Claude vs Gemini |
| Comparison | `/vs/midjourney-vs-stable-diffusion` | Midjourney vs Stable Diffusion |
| Comparison | `/vs/copilot-vs-cursor` | GitHub Copilot vs Cursor |
| Ranking | `/best/ai-chatbots` | Best AI chatbots of 2026 |
| Ranking | `/best/ai-image-generators` | Best AI image generators of 2026 |

## Tech

- Pure static HTML/CSS/JS — no build step, no dependencies
- Data-driven: each comparison/ranking page carries a `VS_DATA` / `BEST_DATA` object; `assets/js/table.js` renders the table/list from it
- Bilingual (EN default, 中文) via `data-i18n` + dictionaries in `assets/js/lang/` — English is the hard default; only an explicit switcher choice is persisted (`aitop_lang`), mirroring the omc.network language policy
- Deploy: Vercel, Root Directory = repo root, `cleanUrls: true`

## Editing content

- **New comparison**: copy any file in `vs/`, edit the `window.VS_DATA` object (both `en` and `zh` fields), update the `<title>`/meta and breadcrumbs.
- **New ranking**: copy any file in `best/`, edit `window.BEST_DATA`.
- **Prices change**: edit the `pricing`/`price` fields and bump the `updated` date. Add new tools to the rankings by appending to `items`.

## License

MIT
