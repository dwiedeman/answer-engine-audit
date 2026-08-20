# Client-facing report contract

The report must answer, in order: what is happening, why it matters, what evidence supports it, and what the client should do next. Raw evidence belongs behind that story, never in front of it.

## Required experience

- Open with a finding-led headline, not only the business name or "visibility assessment."
- Show three or four defensible executive metrics above the fold (the three scores qualify).
- Explain the strongest current surface, the primary growth constraint, and the next decision.
- Group search demand by service or product line and explain deduplication or sampling limits.
- Separate Google organic, local finder, and Maps results; never imply that Maps rank is organic rank.
- Show unbranded AI questions, actual engine provenance, mention status, and returned providers.
- Summarize competitors by service line rather than dumping every observation.
- Translate technical and page findings into business priorities.
- End with a sequenced 30/60/90-day plan or equivalent owner-ready roadmap.
- Keep sources, methodology, safeguards, and limitations in one deduplicated appendix.

## Fail closed for these defects

- Appendix-first output, repeated evidence stacks, or source links repeated below every table.
- Duplicate source destinations or misleading generic source labels.
- Internal paths, artifact identifiers, raw engine keys, fixtures, or implementation notes.
- Empty evidence tables, blank sections, placeholder copy, `undefined`, `NaN`, or `TBD`.
- AI coverage totals that differ from the displayed answer rows.
- Failed AI calls counted as "not mentioned."
- Negative phrases such as "the business was not included" counted as positive mentions.
- Engine labels that do not describe the system that actually produced the answer.
- Unsupported rankings, benchmark percentiles, revenue claims, or quality judgments.

## AI prompt selection

Keep prompts unbranded and phrase them like likely buyers. Cover the major service or product lines and add high-intent variants such as "best," "near me," "for companies," "cost," "same day," or regulated-use wording when relevant. Review the prompt set before live calls; do not rely only on templated substitution.

If API credentials fail, preserve the failure in diagnostics as `unmeasured`. If evidence was collected by another system (e.g., an agent's own web search), name that system honestly — never relabel it as OpenAI, Gemini, Perplexity, or another provider.

## Review checklist before delivery

- Headline is readable and finding-led.
- First section reads like an executive brief, not a data export.
- Tables are legible and fit the medium.
- Counts and conclusions agree across metric cards, narrative, and tables.
- Source appendix is compact, deduplicated, and subordinate to the recommendations.
- No raw identifiers, internal paths, misleading links, blank sections, or orphan headings.
- Roadmap is specific enough for the owner to act on this week.

If any item fails, correct the generator and re-emit. Do not hand-edit the artifact into compliance.
