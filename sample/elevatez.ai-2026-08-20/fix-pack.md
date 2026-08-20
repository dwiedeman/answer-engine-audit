# Fix pack

Generated 2026-08-20T20:55:50.841Z for https://elevatez.ai.

## Give this to your agent

```
You are fixing a website based on an answer-engine audit. Apply these findings in order (fail first). For each: make the change, verify it, move on. findings.json (same directory) is the machine-readable list.

1. [warn/agents] No llms.txt (agents-pillar gap — NOT a search-ranking issue; Google ignores this file, agents read it)
   FIX: Ship the generated llms.txt draft from fix-pack.md
2. [warn/agents] No llms.txt discovery headers or alternate link
   FIX: Add Link: rel="llms-txt" header or <link rel="alternate"> tag
3. [warn/schema] No Organization schema
   FIX: Add the organization.json snippet from fix-pack
4. [warn/extractability] No FAQ or comparison-table extraction primitives found on the homepage
   FIX: Add a key-takeaways block, FAQ section, or comparison table (40-60 word direct answers)
5. [warn/authority] Backlink spam score 42
   FIX: Review and disavow toxic links
```

## Generated llms.txt draft (edit REPLACE lines, then ship at /llms.txt)

```
# ElevateZ.AI

> AI operations assessment, implementation, and fractional leadership for growing businesses with repeatable workflows. Built by an operator who runs AI agents in production daily.

REPLACE: 2-3 sentences of context an AI assistant needs — what you sell/do, who it is for, what makes you credible.

## Key pages

- [Home](https://elevatez.ai/): AI operations assessment, implementation, and fractional leadership for growing businesses with repe
- [REPLACE Page Title](https://elevatez.ai/REPLACE): one-line description
- [REPLACE Page Title](https://elevatez.ai/REPLACE): one-line description

## Optional

- [llms-full.txt](https://elevatez.ai/llms-full.txt): full-content version for deep ingestion
```

## robots.txt AI-crawler block (append to your robots.txt)

See `templates/robots-ai.txt` in the skill for the full block with per-bot transactional-path exclusions.

## JSON-LD snippets

See `templates/jsonld/` — Organization, WebSite, BreadcrumbList are safe site-wide; FAQPage ONLY when the FAQs are visible on the page. Never ship schema describing content that is not on the page.
