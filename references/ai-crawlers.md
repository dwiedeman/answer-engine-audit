# AI crawler registry + the llms.txt truth

## The bot registry (check robots.txt against ALL of these)

| Bot | Operator | Purpose | Notes |
|---|---|---|---|
| `GPTBot` | OpenAI | Model training | Allowing it is a business choice, distinct from search visibility |
| `OAI-SearchBot` | OpenAI | ChatGPT search inclusion | The one that matters for being FOUND in ChatGPT search |
| `ChatGPT-User` | OpenAI | User-triggered fetches | Fires when a user asks ChatGPT to read a page; not a bulk crawler |
| `ClaudeBot` | Anthropic | Crawling/training | Also retrieves llms.txt |
| `PerplexityBot` | Perplexity | Answer-engine index | Perplexity states it respects robots.txt |
| `Google-Extended` | Google | Gemini/AI training opt-out control | Blocking it does NOT affect Google Search or AI Overviews |
| `Amazonbot` | Amazon | Alexa/answers | |
| `Applebot-Extended` | Apple | Apple Intelligence training control | |
| `CCBot` | Common Crawl | Open web corpus | Feeds many models' training sets |

**Crawl vs user-fetch distinction:** blocking `GPTBot` (training) while allowing `OAI-SearchBot` (search) and `ChatGPT-User` (user fetches) is a coherent, common posture. An audit must report the three separately — "blocked in ChatGPT" is three different findings, not one.

**Also check:** CDN/WAF bot challenges (Cloudflare/Akamai settings that 403 these bots even when robots.txt allows them). A robots.txt Allow with a WAF block is still a block — test with real user-agent fetches when possible.

## Recommended robots posture

Default-open with commerce/account paths excluded per bot (see `templates/robots-ai.txt`). Per-bot Disallow blocks for `/cart`, `/checkout`, `/account`, `/admin` keep transactional surfaces out of corpora while leaving content crawlable.

## The llms.txt truth (say all three parts, always)

1. **Google Search ignores llms.txt.** Google's June 2026 AI guidance states directly that no machine-readable AI files are needed to appear in Search including its generative features, and Gary Illyes confirmed no support and no plans. Adoption studies show ~10% of large domain samples ship one and ~97% of files are never fetched by anything.
2. **But real consumers exist:** Perplexity and Anthropic's Claude retrieve llms.txt; coding agents (Cursor, GitHub Copilot) depend on it; agentic browsers read it; Chrome Lighthouse 13.3 added an llms.txt audit under a new **"Agentic Browsing"** category.
3. **Therefore:** llms.txt is an **AGENTS-pillar** deliverable — agent readiness, not search ranking. Ship it because it is cheap and the agent web is arriving; never sell it as an SEO fix. Scoring it under SEARCH is the signature error of hype-driven audits.

## llms.txt quality bar (when present)

llmstxt.org format: `# Site Name` title → `>` one-line summary blockquote → short context paragraph → sections of `- [Page Title](url): description` links → optional `## Optional` section pointing at `llms-full.txt`. Quality checks: real curated links (not a sitemap dump), accurate descriptions, absolute URLs, a maintained llms-full.txt if referenced.

## Discovery headers

Emerging convention, cheap to ship:

```
Link: </llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"
X-Llms-Txt: /llms.txt
```

plus the HTML equivalent: `<link rel="alternate" type="text/plain" title="LLMs.txt" href="/llms.txt">`.

## Raw-HTML readability

Most AI crawlers and agent fetchers do not execute JavaScript. The access floor is: core content present in the served HTML. The audit checks the homepage's text content with JS stripped; a JS-only site fails the AGENTS pillar's readability signal regardless of how good the rendered page looks.
