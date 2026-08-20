# Answer Engine Audit — https://elevatez.ai

**Visibility gaps found across the three surfaces**

| SEARCH | ANSWERS | AGENTS | OVERALL |
|---|---|---|---|
| 68/100 | 35/100 | 54/100 | 51/100 |

## What AI says about you today

Branded mention rate: **100%** (9 measured probes). Unbranded: **unmeasured** (no probes ran for this cohort — not a 0%).

This is the classic pattern: AI knows the brand exists but never *recommends* it. The roadmap below targets exactly that gap.

- *"what is elevatez.ai"* (branded) — chatgpt: ✅ mentioned · perplexity: ✅ mentioned · gemini: ✅ mentioned
- *"is elevatez.ai legit and reputable"* (branded) — chatgpt: ✅ mentioned · perplexity: ✅ mentioned · gemini: ✅ mentioned
- *"elevatez.ai reviews"* (branded) — chatgpt: ✅ mentioned · perplexity: ✅ mentioned · gemini: ✅ mentioned

## Findings (0 fail, 5 warn)

- **[warn] agents** — No llms.txt (agents-pillar gap — NOT a search-ranking issue; Google ignores this file, agents read it)
  - Fix: Ship the generated llms.txt draft from fix-pack.md _(effort low, impact med)_
  - Evidence: absent
- **[warn] agents** — No llms.txt discovery headers or alternate link
  - Fix: Add Link: rel="llms-txt" header or <link rel="alternate"> tag _(effort low, impact low)_
  - Evidence: none observed
- **[warn] schema** — No Organization schema
  - Fix: Add the organization.json snippet from fix-pack _(effort low, impact med)_
  - Evidence: types: none
- **[warn] extractability** — No FAQ or comparison-table extraction primitives found on the homepage
  - Fix: Add a key-takeaways block, FAQ section, or comparison table (40-60 word direct answers) _(effort med, impact high)_
  - Evidence: none detected
- **[warn] authority** — Backlink spam score 42
  - Fix: Review and disavow toxic links _(effort med, impact med)_
  - Evidence: 7 referring domains

## Roadmap — top 5 by impact over effort

1. Ship the generated llms.txt draft from fix-pack.md — _No llms.txt (agents-pillar gap — NOT a search-ranking issue; Google ignores this file, agents read it)_
2. Add the organization.json snippet from fix-pack — _No Organization schema_
3. Add a key-takeaways block, FAQ section, or comparison table (40-60 word direct answers) — _No FAQ or comparison-table extraction primitives found on the homepage_
4. Add Link: rel="llms-txt" header or <link rel="alternate"> tag — _No llms.txt discovery headers or alternate link_
5. Review and disavow toxic links — _Backlink spam score 42_

## Unmeasured signals

- ANSWERS: aiDemand (weight redistributed; see rubric.md)

## Appendix — method

Scored with the public rubric (rubric.md, v1) of the answer-engine-audit skill. Data: direct site checks + DataForSEO (OnPage, Lighthouse, Labs, Backlinks, SERP, AI Optimization). Spend: $0.6297 of $3 cap. Every engine label names the system that actually produced the evidence.
