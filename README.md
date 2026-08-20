# answer-engine-audit

**Give your coding agent this skill plus a DataForSEO key. Get a three-score audit of your website — and a fix pack your agent can execute.**

> Google sends you traffic. AI sends you customers. Agents send you orders. **We score all three.**

| Score | What it measures |
|---|---|
| **SEARCH** | Classic SEO health: crawl, Core Web Vitals, schema, content, keywords, backlinks |
| **ANSWERS** | AI visibility, **measured** — is your brand actually cited by ChatGPT, Perplexity, and Gemini? Branded vs unbranded mention rates, plus answer-extraction readiness |
| **AGENTS** | Agent readiness: AI-crawler access, llms.txt, structured-data honesty, raw-HTML readability, discovery headers |

Why it matters: Ahrefs reported (July 2026) that AI search was **0.5% of their visits but drove 12.1% of their sign-ups**. Most audit tools score *readiness* and guess. This skill **measures actual AI visibility** with DataForSEO's AI Optimization API — real ChatGPT/Perplexity/Gemini responses, real mention data — then hands your agent the fixes.

## Quickstart

```bash
# 1. Install the skill (any of these)
git clone https://github.com/dwiedeman/answer-engine-audit ~/.claude/skills/answer-engine-audit

# 2. Set your DataForSEO credentials (mandatory — see Cost below)
export DATAFORSEO_LOGIN="you@example.com"
export DATAFORSEO_PASSWORD="your-api-password"

# 3. Ask your agent
#    "Run an answer engine audit on https://example.com"
#    or, inside your website's repo: "Audit this site and fix what you find"
```

Works with Claude Code and any agent runtime that reads `SKILL.md` skills.

## Two modes

- **URL mode** — audit any live site. Data comes from DataForSEO plus direct fetches (robots.txt, llms.txt, sitemap, headers, homepage HTML).
- **Repo mode** — run it *inside your website's repository*. Findings map to actual files, and the skill generates the fixes: an `llms.txt` draft, an AI-crawler `robots.txt` block, honest JSON-LD snippets, meta tags, and answer-block rewrites your agent can apply as diffs. Not just findings — files.

## Output

Every audit emits three artifacts:

| File | Audience | Contents |
|---|---|---|
| `report.md` | Humans | Three scores, findings with evidence, impact×effort top-10 roadmap |
| `findings.json` | Agents/CI | `{url, severity, category, message, fix, effort, impact, evidence}` — exits non-zero if any `fail` remains |
| `fix-pack.md` | Your agent | A paste-ready prompt plus the generated files (llms.txt, robots block, JSON-LD) |

## Cost (DataForSEO is required)

This skill will not run paid checks without `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` in the environment. Pay-as-you-go, **$50 minimum top-up**, credits never expire, free sandbox for development. Verified 2026-08-20:

| Depth | Scope | Est. API cost per audit |
|---|---|---|
| Lean | 100-page crawl, 5 Lighthouse, 1 keyword pull, 10 SERPs, backlinks summary, light AI checks | **~$0.30–0.50** |
| Typical (default) | JS-rendered crawl, 10 Lighthouse, keyword + competitor pulls, 15 SERPs, backlinks, tech stack, AI keyword volume, ~20 LLM probes, mention data | **~$2–3** |
| Deep GEO | Full browser rendering, 20 Lighthouse, deep keywords/backlinks, 40 probes × 4 models, 1k mention rows | **~$7–10** |

A $50 top-up funds roughly 20–150 audits. The skill enforces a **spend cap** (default $5 per audit, `--budget` to change) behind a discovery gate: no paid call before the target property is confirmed.

## The rubric is public

Every weight in the three scores is published in [`rubric.md`](rubric.md) with a source. If you disagree with a weight, you can see exactly what you're disagreeing with — no black-box scoring.

## Sample output

A real audit of [elevatez.ai](https://elevatez.ai), run 2026-08-20 with this exact skill: [`sample/elevatez.ai-2026-08-20/`](sample/elevatez.ai-2026-08-20/) — report.md, findings.json, and fix-pack.md. Scores came back **SEARCH 68 / ANSWERS 35 / AGENTS 54**, the branded-vs-unbranded mention split surfaced the classic "AI knows the brand but never recommends it" pattern, and the measured DataForSEO spend was **$0.63** (small site; thin keyword footprint keeps SERP checks cheap).

## Honesty rules

This skill inherits the delivery discipline of a production audit pipeline:

- A failed provider call is **never** counted as "not mentioned."
- Evidence is always labeled with the system that actually produced it.
- Maps rank is never presented as organic rank.
- No single vendor metric is presented as a "rankability grade."
- llms.txt is scored under **AGENTS**, not SEARCH — Google's own docs say Search ignores it; Perplexity, Claude, and coding agents read it. The report says so.

## License

[MIT](LICENSE).

---

Built by the team behind **[audit.elevatez.ai](https://audit.elevatez.ai)** — want it done for you? The first 100 audits there are free.
