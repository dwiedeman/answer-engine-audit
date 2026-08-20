---
name: answer-engine-audit
description: Run a three-score SEO / GEO / AEO website audit (SEARCH, ANSWERS, AGENTS) with measured AI visibility via DataForSEO, and emit a human report plus an agent-executable fix pack. Use when asked for an SEO audit, GEO audit, AEO audit, AI visibility audit, answer engine audit, "audit my website", "can AI find us", or to fix a site's AI/search visibility. Requires DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in the environment.
---

# Answer Engine Audit

You are running a paid, evidence-driven audit that ends in autonomous deliverables. Follow the steps in order. The discovery gate exists to stop the most expensive failure in this workflow: spending API budget auditing the wrong property or the wrong market.

Base directory for relative paths below: this skill's directory (`SKILL_DIR`).

## Non-negotiable rules

1. **DataForSEO is mandatory.** Credentials come from the environment only — `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`. Never read them from a file path, never echo their values, never proceed to paid steps without them. If absent, stop and tell the user how to get them (dataforseo.com, $50 minimum top-up, free sandbox) — the keyless direct checks in step 5 may still run as a courtesy preview, clearly labeled incomplete.
2. **Spend cap.** Default $5 per audit. The user may change it ("--budget 10" or "spend up to $X"). `scripts/dfs.mjs` enforces it; you must also state the cap and the estimated cost (lean ~$0.30–0.50 / typical ~$2–3 / deep ~$7–10) BEFORE the first paid call and get a go-ahead unless the user already gave one.
3. **Honesty rules — verbatim, they survive every rephrase:**
   - Never count a failed provider call as "not mentioned." Failed calls are `unmeasured` and the report says so.
   - Never relabel synthesized or web-grounded evidence as a model's answer. Name the system that actually produced every piece of evidence.
   - Never imply Maps rank is organic rank.
   - Never present `onpage_score` or any single vendor metric as a rankability grade.
   - llms.txt is scored under AGENTS, never SEARCH. State the caveat: Google Search ignores llms.txt (their June 2026 docs); Perplexity, Claude, Cursor, and agentic browsers read it; Lighthouse 13.3 audits it under "Agentic Browsing."
4. **Fail closed on report defects.** The defect list in `references/report-contract.md` (placeholders, empty tables, mislabeled engines, appendix-first structure, unsupported claims) blocks delivery. Fix and re-emit; never hand-edit an artifact into compliance.

## Workflow

### 1. Preflight
Run `scripts/preflight.sh`. It checks node ≥ 20 and credential *presence* (never values). A configured key may still fail live auth — treat preflight as configuration-presence only.

### 2. Mode detection
- **Repo mode**: you are inside a git repository that builds a website (look for framework configs, `src/pages`, `app/`, content collections, `public/`). Findings will map to files and fixes become diffs.
- **URL mode**: you have a URL and no site repo. Fixes become generated files + instructions.
Confirm the production URL either way — in repo mode, find it in the repo config; never assume localhost.

### 3. Discovery gate (BEFORE any paid call)
Follow `references/discovery-gate.md`. Produce two short artifacts in the working notes:
- **Property map**: canonical brand name, apex/www behavior, redirects, indexability, sitemap reality, key pages, related domains — each classified `primary / supporting / third_party / stale / broken / parked / blocked / contradictory`.
- **Seed brief**: 8–15 representative unbranded concepts across category synonyms, verified offerings, high-intent actions, comparison language, plus any exact queries the user supplied. Mark unsupported or regulated concepts `excluded` or `verify_before_use`.
Do not let defaults define provider scope. Gate decision: primary property verified, seed set balanced, planned provider inputs enumerable. Only then spend.

### 4. State the plan and the cap
One short message: target property, mode, planned checks, estimated cost, spend cap. If the user already said "go" / gave a budget, proceed without waiting.

### 5. Collect — direct checks (free)
`node scripts/site-checks.mjs <url> --out audit-work/site.json`
Robots.txt with the AI-crawler matrix, llms.txt presence + quality, sitemap, `Link: rel="llms-txt"` / `X-Llms-Txt` headers, homepage raw HTML + JSON-LD extraction, SSRF-guarded, size-capped.

### 6. Collect — DataForSEO (paid, cap-enforced)
`node scripts/dfs.mjs collect <url> --budget <cap> --out audit-work/dfs.json`
Instant Pages on key pages, Lighthouse live, ranked keywords, SERP checks, backlinks summary, domain technologies, AI keyword volume, LLM Responses probes (branded AND unbranded — build both sets from the seed brief; the branded-vs-unbranded mention split is the core ANSWERS diagnostic), LLM Mentions target metrics. Every call is optional: a dead endpoint yields `{ok:false}` and the audit continues. Cost is captured from every charged response, including errors.

### 7. Score
`node scripts/score.mjs audit-work/site.json audit-work/dfs.json --out audit-work/scores.json`
Pure function implementing `rubric.md`. Unmeasured inputs redistribute their weight and are listed as unmeasured — never scored as zero silently.

### 8. Findings + fix pack
`node scripts/emit-report.mjs audit-work --out audit-out`
Emits `report.md`, `findings.json` (schema: `{url, severity: fail|warn, category: access|crawl|speed|schema|content|extractability|ai-visibility|agents|authority|compliance, message, fix, effort, impact, evidence}`), and `fix-pack.md` (generated llms.txt draft, robots AI block, JSON-LD snippets from `templates/`, plus a paste-ready agent prompt). Exits non-zero while any `fail` finding stands — usable as a CI gate.

### 9. Repo mode: apply fixes
Map each finding to its file (templates → `public/llms.txt`, `public/robots.txt`, layout head for JSON-LD, page frontmatter for metas). Propose the diffs; apply them if the user asked you to fix. Re-run steps 5 → 8 afterward to show the score delta.

### 10. Validate before delivery
Check `report.md` against `references/report-contract.md`: finding-led headline, executive metrics above the fold, evidence behind the story, sequenced roadmap, honest engine labels, no placeholders/NaN/empty sections, AI coverage totals matching the answer rows. Fix at the source and re-emit on any defect.

### 11. Deliver
Lead with the three scores and the single strongest finding. Then: what's working, the primary constraint, the roadmap, and where the fix pack lives. Keep raw evidence in the appendix of `report.md`, not the chat.

### 12. Record
Append a one-line run record (date, target, cost actually spent from dfs.mjs's total, scores) to `audit-work/runs.log` so repeat audits can show deltas.

## Cost table (state this when asked, verified 2026-08-20)

| Depth | Est. API cost |
|---|---|
| Lean | ~$0.30–0.50 |
| Typical (default) | ~$2–3 |
| Deep GEO | ~$7–10 |

DataForSEO: pay-as-you-go, $50 minimum top-up, credits never expire, free sandbox. The full endpoint-level price list is in `references/checks-catalog.md`.

## References

Read before first use, then as needed: `references/discovery-gate.md` (the pre-spend gate), `references/report-contract.md` (delivery quality bar), `references/geo-knowledge.md` (how AI engines decide what to cite), `references/ai-crawlers.md` (bot registry + llms.txt truth), `references/checks-catalog.md` (every check, category, severity).
