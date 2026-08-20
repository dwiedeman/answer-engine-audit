# How AI engines decide what to cite — the knowledge base behind the ANSWERS score

## The citation pipeline (three layers)

1. **Retrieval** — the engine searches its live index (Bing, Google, or an internal browser) for relevant documents.
2. **Trust filter (E-E-A-T)** — retrieved documents are scanned for Experience, Expertise, Authoritativeness, Trustworthiness signals. Strictest in YMYL categories (health, money).
3. **Synthesis** — the engine summarizes, preferring sources that are concise and structured (bullets, tables, direct answers), corroborated (facts backed by external trusted entities), and unique.

**Information gain is the load-bearing idea:** if your page says what Wikipedia says, the AI cites Wikipedia. Proprietary data, specific numbers, named sources, and honest nuance are what earn the citation.

Worked example — user asks "Is stevia safe for gut health?":
- Generic brand page: "Yes, it is safe." → ignored.
- Citable page: "A 2024 Journal of Nutrition study found stevia does not negatively impact the microbiome — though blends containing maltodextrin might. Ours is 100% pure extract." → cited, because it is specific (names a source), nuanced (acknowledges the exception — expertise), and connects the fact to a differentiator.

## The eight signals, in priority order

1. Topical authority — depth + breadth on the entity/category
2. E-E-A-T — expert review, author bios, editorial policy
3. Citations to credible sources (primary literature, regulators, standards bodies)
4. Structured data — Organization, Article, FAQ, Product, Breadcrumb
5. Content extractability — tables, bullets, definitions, key-takeaway blocks
6. Off-site brand reputation — press, forums, Reddit, expert references
7. User-satisfaction proxies — engagement, brand searches
8. Safety/compliance posture — no over-claims, clear disclaimers

## The AI trust hierarchy (where recommendations actually come from)

Ranked by observed influence on AI product/service recommendations:

| Rank | Source | Influence | Note |
|---|---|---|---|
| 1 | Reddit | 10/10 | The "human experience" layer; licensing deals put threads into AI Overviews within minutes; Perplexity leans on it for subjective queries |
| 2 | Niche authority sites | 9/10 | The "expert" layer (category-leading editorial sites) |
| 3 | "Best X" roundup articles | 9/10 | The #1 direct source for product recommendation lists |
| 4 | YouTube transcripts | 8/10 | Indexed text; spoken brand mentions count |
| 5 | Amazon reviews | 7/10 | Recurring phrases become AI talking points |
| 6 | **Your own site** | 7/10 | Cited for "what is X" and brand-specific queries — note it is NOT rank 1 |
| 7 | Wikipedia | 6/10 | Defines what the entity IS; rarely drives "best of" |
| 8 | Quora | 5/10 | Declining, still indexed |
| 9 | TikTok | 5/10 | Indexed by Perplexity; rising |
| 10 | Podcasts | 4/10 | Transcripts indexed |
| 11 | Review sites | 4/10 | Sentiment pulled, rarely cited |
| 12 | Pinterest | 3/10 | Niche use cases only |

**Consequence:** a single mention on your own site means little. The same brand mentioned on Reddit + a roundup + YouTube + your site = a recommendation. Recommendations are formed by **co-occurrence across independent sources**. (Ethics note: earn these mentions; astroturfing violates platform TOS and, once detected, poisons the well.)

## Content architecture that wins citations

**Hub and spoke:** one canonical entity hub per core entity (product, service, ingredient, drug, tool), with comparison / usage / sourcing / science spokes linking back. Generalizes across verticals — the hub is whatever your customer asks the assistant about.

**The 10-part citation-ready page structure:**
1. One-paragraph definition (the first thing AI reads)
2. Key takeaways (≤5 bullets)
3. Evidence summary (with strength ratings)
4. Practical specifics (dosage/pricing/timelines — numbers)
5. Safety/caveats (who it's not for)
6. Options & how to choose (comparison table)
7. Quality/standards (your proprietary data — information gain)
8. FAQ (8–15 short, direct answers)
9. References (primary sources)
10. Last-reviewed date + reviewer credentials

Keep promotional content physically separate. AI cites educational sections, not "Buy now."

**Content types ranked by citation likelihood:** entity monographs > practical guides with ranges > safety pages > comparisons > "best for" decision guides > glossaries > testing/transparency pages > FAQ pages.

## AEO content principles (answer-block discipline)

- Lead with the direct answer — engines extract the first 1–2 sentences (40–60 words is the extraction sweet spot).
- One question, one answer, one fact cluster per block.
- Quantify everything; vague claims are unextractable.
- Use the buyer's words, not the org chart's.

## Measurement

Track monthly: citation presence per engine (probe set of unbranded + branded questions), pages cited at least once, share of citations vs top competitors, AI-surface keyword demand, backlinks to hubs. The branded/unbranded mention split is the single most diagnostic number — see rubric.md.
