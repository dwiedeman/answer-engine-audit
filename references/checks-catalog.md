# Checks catalog — every check, its category, severity guidance, and cost

Finding categories: `access | crawl | speed | schema | content | extractability | ai-visibility | agents | authority | compliance`.
Severity: `fail` = blocks an outcome (unreachable, blocked, dishonest, broken); `warn` = costs performance or opportunity.

## Free direct checks (site-checks.mjs)

| Check | Category | fail when | warn when |
|---|---|---|---|
| HTTPS + apex/www behavior | access | site unreachable, cert invalid, redirect loop | mixed redirects |
| robots.txt present + parseable | access | 5xx or blocks `*` entirely | missing (defaults open but unmanaged) |
| AI-crawler matrix (9 bots) | agents | a search-relevant bot (OAI-SearchBot, PerplexityBot) blocked unintentionally | training bots unaddressed (business choice not made) |
| CDN/WAF challenge heuristic | agents | AI bots receive 403/challenge | unknown (report unmeasured) |
| llms.txt presence + quality | agents | — (absence is warn, not fail) | missing, malformed, or sitemap-dump |
| Discovery headers / link rel | agents | — | missing |
| sitemap.xml reachable + canonical URLs | crawl | 404/5xx or empty | non-canonical entries |
| Homepage raw-HTML readability | agents | core content absent without JS | thin no-JS content |
| JSON-LD extraction + parse | schema | invalid JSON-LD | none present |
| Schema honesty (FAQ visible-match, allowed types) | schema | invisible FAQ schema, prohibited types | missing recommended types |
| Meta/title/heading hygiene (key pages) | content | missing titles | duplicates, weak descriptions |
| Answer-block extractability | extractability | — | no direct-answer blocks, no FAQ, no tables on key pages |

## Paid checks (dfs.mjs — DataForSEO, prices verified 2026-08-20)

| Check | Endpoint | Price | Category |
|---|---|---|---|
| Key-page on-page audit | OnPage Instant Pages | $0.00015/page | crawl, content |
| Performance (lab CWV) | OnPage Lighthouse live | $0.005/page | speed |
| Ranked keyword footprint | Labs ranked_keywords | $0.012 + $0.00012/row | authority, content |
| SERP presence + AI Overview presence | SERP organic advanced live | ~$0.002/query | ai-visibility, authority |
| Backlink profile | Backlinks summary | $0.024/request | authority |
| Tech stack | Domain Analytics technologies | ~$0.01/request | crawl |
| AI keyword demand | ai_keyword_data search_volume | $0.01 + $0.0001/kw | ai-visibility |
| Measured citations (probes) | ai_optimization LLM Responses live | $0.0006 + LLM token cost (~$0.001–0.01/prompt) | ai-visibility |
| Brand mention metrics | LLM Mentions target_metrics_lite | $0.1/request + $0.001/row | ai-visibility |

Depth presets: lean ≈ $0.30–0.50 · typical ≈ $2–3 · deep ≈ $7–10 per audit. Minimum account top-up $50; credits never expire; sandbox is free.

## Severity discipline

- A **fail** must name the blocked outcome ("PerplexityBot receives 403 → invisible to Perplexity's index") — not just the config state.
- Never grade unmeasured as failed: a probe that errored is `unmeasured` and excluded from scoring (weight redistributes; report lists it).
- Every finding carries `fix` (the concrete action), `effort` (low/med/high), `impact` (low/med/high), and `evidence` (the observed value or quote). The roadmap is the top 10 by impact-over-effort.

## Compliance notes

`compliance` findings are reserved for regulated-category content risks (medical/financial claims without support, missing disclaimers). The audit flags them; it never writes regulatory copy.
