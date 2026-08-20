#!/usr/bin/env node
// emit-report.mjs — findings + report.md + findings.json + fix-pack.md.
// Usage: node scripts/emit-report.mjs <work-dir> [--out out-dir]
//   Expects <work-dir>/site.json, optional <work-dir>/dfs.json, <work-dir>/scores.json.
// Exits non-zero while any fail-severity finding stands (CI-gate behavior).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function load(p) { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }

export function buildFindings(site, dfs, scores) {
  const F = [];
  const push = (severity, category, message, fix, effort, impact, evidence, url) =>
    F.push({ url: url || site?.target || "", severity, category, message, fix, effort, impact, evidence: String(evidence || "").slice(0, 400) });

  if (site) {
    if (site.homepage?.status !== 200) push("fail", "access", `Homepage returned ${site.homepage?.status}`, "Restore a 200 response at the canonical URL", "high", "high", `status ${site.homepage?.status}`);
    if (!site.robots?.present) push("warn", "access", "No robots.txt", "Ship the robots.txt in fix-pack.md (default-open with AI-crawler blocks for transactional paths)", "low", "med", `robots status ${site.robots?.status}`);
    for (const b of site.robots?.aiBots || []) {
      if (!b.allowed && ["OAI-SearchBot", "PerplexityBot", "ChatGPT-User"].includes(b.bot))
        push("fail", "agents", `${b.bot} is blocked — invisible to that answer engine`, `Allow ${b.bot} in robots.txt (see fix-pack robots block)`, "low", "high", `disallows: ${(b.disallows || []).join(",")}`);
      else if (!b.allowed)
        push("warn", "agents", `${b.bot} is blocked (training-bot posture: confirm it is a deliberate business choice)`, "Decide and document the training-bot posture", "low", "low", `source ${b.source}`);
    }
    if (!site.sitemap?.present) push("fail", "crawl", "sitemap.xml missing or unreachable", "Generate and reference a sitemap in robots.txt", "low", "high", `status ${site.sitemap?.status}`);
    if (!site.llmsTxt?.present) push("warn", "agents", "No llms.txt (agents-pillar gap — NOT a search-ranking issue; Google ignores this file, agents read it)", "Ship the generated llms.txt draft from fix-pack.md", "low", "med", "absent");
    else if (site.llmsTxt.quality !== "good") push("warn", "agents", `llms.txt quality is ${site.llmsTxt.quality}`, "Curate real page links with descriptions (llmstxt.org format)", "low", "low", JSON.stringify({ links: site.llmsTxt.linkCount }));
    if (!site.homepage?.discoveryHeaders?.hasLlmsLink && !site.homepage?.llmsAlternateLink)
      push("warn", "agents", "No llms.txt discovery headers or alternate link", "Add Link: rel=\"llms-txt\" header or <link rel=\"alternate\"> tag", "low", "low", "none observed");
    if (!site.homepage?.title) push("fail", "content", "Homepage has no <title>", "Write a question-intent title", "low", "high", "missing");
    if (!site.homepage?.metaDescription) push("warn", "content", "Homepage has no meta description", "Write a 150-char description with the direct answer", "low", "med", "missing");
    if ((site.homepage?.noJsTextLength || 0) < 800 && (site.homepage?.scriptTagCount || 0) >= 3) push("fail", "agents", "Core content not readable without JavaScript — most AI crawlers and agent fetchers will see an empty page", "Server-render or pre-render key content", "high", "high", `${site.homepage?.noJsTextLength} chars no-JS, ${site.homepage?.scriptTagCount} script tags`);
    else if ((site.homepage?.noJsTextLength || 0) < 800) push("warn", "extractability", "Homepage content is thin (little extractable text)", "Add a direct-answer block and key-takeaways content", "med", "med", `${site.homepage?.noJsTextLength} chars no-JS`);
    const types = (site.homepage?.jsonLd || []).flatMap((x) => x.types || []);
    const invalid = (site.homepage?.jsonLd || []).filter((x) => !x.valid).length;
    if (invalid) push("fail", "schema", `${invalid} invalid JSON-LD block(s)`, "Fix JSON syntax; validate with Rich Results Test", "low", "med", "parse errors");
    if (types.includes("FAQPage") && !site.homepage?.hasFaqMarkup) push("fail", "schema", "FAQPage schema with no visible FAQ content — dishonest schema poisons agent trust", "Remove the schema or publish the FAQs visibly", "low", "high", "invisible FAQ schema");
    if (!types.includes("Organization")) push("warn", "schema", "No Organization schema", "Add the organization.json snippet from fix-pack", "low", "med", `types: ${types.join(",") || "none"}`);
    if (!site.homepage?.hasFaqMarkup && !site.homepage?.tableCount) push("warn", "extractability", "No FAQ or comparison-table extraction primitives found on the homepage", "Add a key-takeaways block, FAQ section, or comparison table (40-60 word direct answers)", "med", "high", "none detected");
  }
  if (dfs) {
    const rates = scores?.mentionRates;
    if (rates && rates.measuredCells > 0) {
      if (rates.unbranded.measured >= 3 && rates.unbranded.rate === 0)
        push("fail", "ai-visibility", `Zero unbranded AI mentions (${rates.unbranded.measured} probes measured) — AI never recommends this site to buyers who don't already know it`, "Build citable category content (see report roadmap): comparison pages, direct-answer blocks, off-site co-occurrence", "high", "high", `branded rate ${(rates.branded.rate * 100).toFixed(0)}%`);
      else if (rates.unbranded.measured >= 3 && rates.unbranded.rate < 0.3)
        push("warn", "ai-visibility", `Low unbranded AI mention rate (${(rates.unbranded.rate * 100).toFixed(0)}%)`, "Target the unbranded probe questions with citation-ready pages", "high", "high", `${rates.unbranded.mentioned}/${rates.unbranded.measured} mentioned`);
      if (rates.unmeasuredCells > 0)
        push("warn", "ai-visibility", `${rates.unmeasuredCells} probe cell(s) unmeasured (provider failures) — treated as unmeasured, never as "not mentioned"`, "Re-run probes or accept the reduced sample", "low", "low", "honesty rule applied");
    }
    const lh = dfs.lighthouse;
    const perf = lh?.ok ? (lh.data?.[0]?.categories?.performance?.score ?? lh.data?.[0]?.lighthouse?.categories?.performance?.score) : null;
    if (perf != null && perf < 0.5) push("fail", "speed", `Lighthouse mobile performance ${(perf * 100).toFixed(0)}/100`, "Address the top Lighthouse opportunities (lab data; field data may differ)", "med", "high", "lab measurement");
    else if (perf != null && perf < 0.8) push("warn", "speed", `Lighthouse mobile performance ${(perf * 100).toFixed(0)}/100`, "Optimize images/JS on key templates", "med", "med", "lab measurement");
    const bl = dfs.backlinks?.ok ? dfs.backlinks.data?.[0] : null;
    if (bl && (bl.backlinks_spam_score ?? 0) > 30) push("warn", "authority", `Backlink spam score ${bl.backlinks_spam_score}`, "Review and disavow toxic links", "med", "med", `${bl.referring_domains} referring domains`);
  }
  return F;
}

const IMPACT_RANK = { high: 3, med: 2, low: 1 };
export function roadmap(findings) {
  return [...findings]
    .sort((a, b) => (IMPACT_RANK[b.impact] / IMPACT_RANK[b.effort]) - (IMPACT_RANK[a.impact] / IMPACT_RANK[a.effort]) || (b.severity === "fail") - (a.severity === "fail"))
    .slice(0, 10);
}

export function generateLlmsTxt(site) {
  const name = (site?.homepage?.title || site?.target || "This site").split(/[|–-]/)[0].trim();
  const desc = site?.homepage?.metaDescription || "REPLACE: one-line summary of what this site offers and for whom.";
  return `# ${name}\n\n> ${desc}\n\nREPLACE: 2-3 sentences of context an AI assistant needs — what you sell/do, who it is for, what makes you credible.\n\n## Key pages\n\n- [Home](${site?.target || "https://example.com"}/): ${desc.slice(0, 100)}\n- [REPLACE Page Title](${site?.target || "https://example.com"}/REPLACE): one-line description\n- [REPLACE Page Title](${site?.target || "https://example.com"}/REPLACE): one-line description\n\n## Optional\n\n- [llms-full.txt](${site?.target || "https://example.com"}/llms-full.txt): full-content version for deep ingestion\n`;
}

function fixPack(site, findings, templates) {
  const agentPrompt = `You are fixing a website based on an answer-engine audit. Apply these findings in order (fail first). For each: make the change, verify it, move on. findings.json (same directory) is the machine-readable list.\n\n${findings.map((f, i) => `${i + 1}. [${f.severity}/${f.category}] ${f.message}\n   FIX: ${f.fix}`).join("\n")}`;
  return `# Fix pack\n\nGenerated ${new Date().toISOString()} for ${site?.target}.\n\n## Give this to your agent\n\n\`\`\`\n${agentPrompt}\n\`\`\`\n\n## Generated llms.txt draft (edit REPLACE lines, then ship at /llms.txt)\n\n\`\`\`\n${generateLlmsTxt(site)}\`\`\`\n\n## robots.txt AI-crawler block (append to your robots.txt)\n\nSee \`templates/robots-ai.txt\` in the skill for the full block with per-bot transactional-path exclusions.\n\n## JSON-LD snippets\n\nSee \`templates/jsonld/\` — Organization, WebSite, BreadcrumbList are safe site-wide; FAQPage ONLY when the FAQs are visible on the page. Never ship schema describing content that is not on the page.\n`;
}

export function renderReport(site, dfs, scores, findings, top) {
  const s = scores || {};
  const fmt = (x) => (x == null ? "unmeasured" : `${x}/100`);
  const fails = findings.filter((f) => f.severity === "fail");
  const headline = fails[0]?.message || (s.overall >= 80 ? "Strong answer-engine posture — protect it" : "Visibility gaps found across the three surfaces");
  const rates = s.mentionRates;
  const lines = [];
  lines.push(`# Answer Engine Audit — ${site?.target || ""}`, "");
  lines.push(`**${headline}**`, "");
  lines.push(`| SEARCH | ANSWERS | AGENTS | OVERALL |`, `|---|---|---|---|`, `| ${fmt(s.search?.score)} | ${fmt(s.answers?.score)} | ${fmt(s.agents?.score)} | ${fmt(s.overall)} |`, "");
  if (rates && rates.measuredCells > 0) {
    lines.push(`## What AI says about you today`, "");
    lines.push(`Branded mention rate: **${(rates.branded.rate * 100).toFixed(0)}%** (${rates.branded.measured} measured probes). Unbranded: **${(rates.unbranded.rate * 100).toFixed(0)}%** (${rates.unbranded.measured} measured).${rates.unmeasuredCells ? ` ${rates.unmeasuredCells} probe cells were unmeasured (provider failures) and are excluded — an unmeasured probe is never counted as "not mentioned".` : ""}`, "");
    if (rates.branded.rate > 0.5 && rates.unbranded.rate === 0) lines.push(`This is the classic pattern: AI knows the brand exists but never *recommends* it. The roadmap below targets exactly that gap.`, "");
    for (const p of (dfs?.llmProbes || []).slice(0, 6)) {
      const cells = p.results.map((r) => `${r.model}: ${r.status !== "ok" ? "unmeasured" : r.mentioned ? "✅ mentioned" : "— not mentioned"}`).join(" · ");
      lines.push(`- *"${p.prompt}"* (${p.cohort}) — ${cells}`);
    }
    lines.push("");
  }
  lines.push(`## Findings (${fails.length} fail, ${findings.length - fails.length} warn)`, "");
  for (const f of findings) lines.push(`- **[${f.severity}] ${f.category}** — ${f.message}\n  - Fix: ${f.fix} _(effort ${f.effort}, impact ${f.impact})_\n  - Evidence: ${f.evidence}`);
  lines.push("", `## Roadmap — top ${top.length} by impact over effort`, "");
  top.forEach((f, i) => lines.push(`${i + 1}. ${f.fix} — _${f.message}_`));
  lines.push("", `## Unmeasured signals`, "");
  for (const pillarName of ["search", "answers", "agents"]) {
    const un = s[pillarName]?.unmeasured || [];
    if (un.length) lines.push(`- ${pillarName.toUpperCase()}: ${un.join(", ")} (weight redistributed; see rubric.md)`);
  }
  lines.push("", `## Appendix — method`, "", `Scored with the public rubric (rubric.md, v1) of the answer-engine-audit skill. Data: direct site checks${dfs ? " + DataForSEO (OnPage, Lighthouse, Labs, Backlinks, SERP, AI Optimization)" : " only (no paid checks run)"}. Spend: ${dfs?.spend ? `$${dfs.spend.spentUsd} of $${dfs.spend.budgetUsd} cap` : "$0"}. Every engine label names the system that actually produced the evidence.`);
  return lines.join("\n") + "\n";
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log("Usage: node scripts/emit-report.mjs <work-dir> [--out out-dir]\n  Reads site.json, dfs.json (optional), scores.json from <work-dir>. Exits 1 if any fail finding.");
    process.exit(args.includes("--help") ? 0 : 1);
  }
  const work = args[0];
  const outIdx = args.indexOf("--out");
  const outDir = outIdx > -1 ? args[outIdx + 1] : work;
  const site = load(join(work, "site.json"));
  const dfs = load(join(work, "dfs.json"));
  const scores = load(join(work, "scores.json"));
  if (!site) { console.error(`no site.json in ${work} — run site-checks.mjs first`); process.exit(1); }
  const findings = buildFindings(site, dfs, scores);
  const top = roadmap(findings);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "findings.json"), JSON.stringify({ target: site.target, generatedAt: new Date().toISOString(), findings }, null, 2));
  writeFileSync(join(outDir, "report.md"), renderReport(site, dfs, scores, findings, top));
  writeFileSync(join(outDir, "fix-pack.md"), fixPack(site, findings));
  const fails = findings.filter((f) => f.severity === "fail").length;
  console.log(`wrote ${outDir}/report.md, findings.json (${findings.length} findings, ${fails} fail), fix-pack.md`);
  process.exit(fails ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
