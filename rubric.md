# The Three-Score Rubric — v1 calibration

Every weight below is published with its source. Scores are 0–100 per pillar. When an input is unmeasured (provider failure, missing credential), its weight is redistributed across the measured inputs of the same pillar and the report lists it as **unmeasured** — never silently zero. These are v1 calibration weights; expect them to move as run data accumulates, and expect the changelog to say why.

## SEARCH — classic search health (0–100)

| Weight | Signal | What's measured | Source for the weight |
|---:|---|---|---|
| 25 | Crawl health | Broken links, redirect chains, canonicals, duplicates, non-indexable key pages, sitemap/robots hygiene (DataForSEO OnPage + direct checks) | Google Search Essentials: crawlability precedes everything; crawl defects gate all other signals |
| 15 | Core Web Vitals | Lighthouse performance on key pages (lab) | Google's page-experience documentation; CWV are the published UX signal set |
| 15 | Structured data | JSON-LD validity, deprecation (FAQ/HowTo rich results retired May 2026), honesty (visible-content match) | Google structured-data guidelines: schema must match visible content; deprecations tracked from Search Central changelog |
| 20 | Content structure | Titles/metas/headings, answer-block presence, internal linking on key pages | Google's June 2026 AI guidance: "the same foundations apply — useful content, crawlable pages, clear structure" |
| 15 | Authority | Backlinks summary, referring domains, spam score (DataForSEO Backlinks) | Link signals remain a core ranking input per Google documentation and every large-scale correlation study |
| 10 | Keyword footprint | Ranked keywords count/positions vs apparent category (DataForSEO Labs) | Measures current visibility baseline — a diagnostic, not a target (see honesty rules: no vendor metric is a rankability grade) |

## ANSWERS — AI visibility, measured and readiness (0–100)

| Weight | Signal | What's measured | Source for the weight |
|---:|---|---|---|
| 40 | **Measured citations** | LLM Responses probes across ChatGPT/Perplexity/Gemini: branded vs unbranded mention rates, positions, actual quotes; LLM Mentions target metrics | DataForSEO AI Optimization API (LLM Responses/Mentions) — the only direct measurement in the stack; weighted highest because measurement beats readiness proxies. The branded/unbranded split is the core diagnostic: 100% branded + 0% unbranded means AI knows you exist but never recommends you (observed pattern in production GEO baselines, 2026-03) |
| 25 | Extractability | 40–60-word direct-answer blocks, FAQ coverage, heading hierarchy, comparison tables, key-takeaway lists | Princeton GEO study (KDD 2024): quotation/statistics additions raised visibility up to ~40%; answer-block extraction is how engines lift content |
| 20 | E-E-A-T signals | Author/reviewer attribution, citations to credible sources, editorial/disclaimer pages, dates | Google Search Quality Rater Guidelines; the KDD 2024 finding that cite-sources additions improved GEO visibility ~115% on some query classes |
| 15 | AI keyword demand | AI search volume vs classic volume for the site's terms (DataForSEO ai_keyword_data) | DataForSEO AI keyword docs — demand shifting into AI surfaces is measurable and category-specific |

## AGENTS — agent readiness (0–100)

| Weight | Signal | What's measured | Source for the weight |
|---:|---|---|---|
| 30 | AI-crawler access | robots.txt matrix for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Amazonbot, Applebot-Extended, CCBot; CDN/WAF challenge detection | Each bot's published docs (see references/ai-crawlers.md); blocked access is a hard gate on every downstream AI surface |
| 25 | llms.txt | Presence, llmstxt.org format quality, llms-full.txt | Scored here and **only** here: Google Search ignores it (June 2026 docs), but Perplexity and Claude retrieve it, coding agents (Cursor, Copilot) depend on it, and Chrome Lighthouse 13.3 audits it under "Agentic Browsing" |
| 20 | Structured-data honesty | JSON-LD present AND matching visible content; no invisible FAQ schema; allowed-type discipline | Agents parse JSON-LD as ground truth; dishonest schema poisons agent behavior worse than missing schema (production validate-launch rule set) |
| 15 | Raw-HTML readability | Core content present without JavaScript execution | Most agent fetchers and AI crawlers do not execute JS; server-rendered content is the access floor (crawlability checklist, corroborated by OpenAI/Perplexity crawler docs) |
| 10 | Discovery headers | `Link: rel="llms-txt"`, `X-Llms-Txt`, HTML `<link rel="alternate">` for llms.txt | Emerging convention (llmstxt.org); cheap to ship, only aids discovery — lowest weight |

## Overall

`overall = round(0.4 × ANSWERS + 0.35 × SEARCH + 0.25 × AGENTS)`

ANSWERS carries the largest share because it contains the only *measured* outcomes; AGENTS the smallest because half its signals are emerging conventions. v1 calibration — argue with it via issues, with data.
