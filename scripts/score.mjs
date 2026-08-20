#!/usr/bin/env node
// score.mjs — three-score computation (SEARCH / ANSWERS / AGENTS) implementing rubric.md.
// Pure function over collected JSON; no network. Unmeasured signals redistribute their
// weight within the pillar and are listed — never silently scored zero.
// Usage: node scripts/score.mjs <site.json> <dfs.json|-> [--out scores.json]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }

// Each signal returns {score: 0-100, measured: boolean, evidence: string}
export function computeScores(site, dfs) {
  const S = {}; // signal registry per pillar

  // ---------- SEARCH ----------
  S.search = {
    crawl: (() => {
      if (!site) return { measured: false };
      let score = 100; const ev = [];
      if (!site.robots?.present) { score -= 20; ev.push("no robots.txt"); }
      if (!site.sitemap?.present) { score -= 30; ev.push("no sitemap"); }
      else if (!site.sitemap.urlCount) { score -= 15; ev.push("empty sitemap"); }
      if (site.homepage?.status !== 200) { score -= 40; ev.push(`homepage status ${site.homepage?.status}`); }
      const ip = dfs?.instantPages;
      if (ip?.ok) {
        const item = ip.data?.[0]?.items?.[0];
        const checks = item?.checks || {};
        if (checks.canonical === false) { score -= 10; ev.push("no canonical"); }
        if (item?.meta?.internal_links_count === 0) { score -= 10; ev.push("no internal links on key page"); }
      }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") || "crawl basics healthy" };
    })(),
    cwv: (() => {
      const lh = dfs?.lighthouse;
      if (!lh?.ok) return { measured: false };
      const perf = lh.data?.[0]?.categories?.performance?.score ?? lh.data?.[0]?.lighthouse?.categories?.performance?.score;
      if (perf == null) return { measured: false };
      return { score: clamp(Math.round(perf * 100)), measured: true, evidence: `Lighthouse performance ${(perf * 100).toFixed(0)}/100 (mobile, lab)` };
    })(),
    schema: (() => {
      if (!site?.homepage) return { measured: false };
      const ld = site.homepage.jsonLd || [];
      const invalid = ld.filter((x) => !x.valid).length;
      const types = ld.flatMap((x) => x.types || []);
      let score = 40; const ev = [];
      if (ld.length) { score = 70; ev.push(`JSON-LD types: ${[...new Set(types)].join(", ") || "unknown"}`); }
      else ev.push("no JSON-LD on homepage");
      if (types.includes("Organization")) score += 10;
      if (types.includes("WebSite")) score += 10;
      if (invalid) { score -= 30; ev.push(`${invalid} invalid JSON-LD block(s)`); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") };
    })(),
    content: (() => {
      if (!site?.homepage) return { measured: false };
      let score = 100; const ev = [];
      if (!site.homepage.title) { score -= 30; ev.push("missing title"); }
      if (!site.homepage.metaDescription) { score -= 20; ev.push("missing meta description"); }
      if (site.homepage.h1Count === 0) { score -= 20; ev.push("no h1"); }
      if (site.homepage.h1Count > 1) { score -= 10; ev.push(`${site.homepage.h1Count} h1s`); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") || "titles/metas/headings present" };
    })(),
    authority: (() => {
      const bl = dfs?.backlinks;
      if (!bl?.ok) return { measured: false };
      const d = bl.data?.[0] || {};
      const rd = d.referring_domains ?? 0; const spam = d.backlinks_spam_score ?? null;
      let score = clamp(Math.round(20 * Math.log10(1 + rd) * 2));
      const ev = [`${rd} referring domains`, `${d.backlinks ?? "?"} backlinks`];
      if (spam != null && spam > 30) { score -= 20; ev.push(`spam score ${spam}`); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") };
    })(),
    keywords: (() => {
      const rk = dfs?.rankedKeywords;
      if (!rk?.ok) return { measured: false };
      const total = rk.data?.[0]?.total_count ?? 0;
      const score = clamp(Math.round(25 * Math.log10(1 + total)));
      return { score, measured: true, evidence: `${total} ranked keywords (diagnostic baseline, not a grade)` };
    })(),
  };
  const SEARCH_W = { crawl: 25, cwv: 15, schema: 15, content: 20, authority: 15, keywords: 10 };

  // ---------- ANSWERS ----------
  const probes = dfs?.llmProbes || [];
  const rates = mentionRates(probes);
  S.answers = {
    citations: (() => {
      if (!probes.length || rates.measuredCells === 0) return { measured: false };
      // Unbranded mentions are worth far more than branded ones.
      const score = clamp(Math.round(rates.unbranded.rate * 80 + rates.branded.rate * 20));
      return {
        score, measured: true,
        evidence: `branded mention rate ${(rates.branded.rate * 100).toFixed(0)}% (${rates.branded.measured} probes), unbranded ${(rates.unbranded.rate * 100).toFixed(0)}% (${rates.unbranded.measured} probes), ${rates.unmeasuredCells} cells unmeasured`,
      };
    })(),
    extractability: (() => {
      if (!site?.homepage) return { measured: false };
      let score = 30; const ev = [];
      if (site.homepage.hasFaqMarkup) { score += 25; ev.push("FAQ content present"); }
      if (site.homepage.tableCount > 0) { score += 20; ev.push(`${site.homepage.tableCount} table(s)`); }
      if (site.homepage.noJsTextLength > 1500) { score += 25; ev.push("substantial extractable text"); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") || "few extraction primitives on homepage" };
    })(),
    eeat: (() => {
      if (!site?.homepage) return { measured: false };
      const types = (site.homepage.jsonLd || []).flatMap((x) => x.types || []);
      let score = 40; const ev = [];
      if (types.includes("Person")) { score += 20; ev.push("Person schema"); }
      if (types.includes("Organization")) { score += 15; ev.push("Organization schema"); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") || "limited E-E-A-T signals detected from homepage (deep pages unscanned in v1)" };
    })(),
    aiDemand: (() => {
      const ai = dfs?.aiKeywordVolume;
      if (!ai?.ok) return { measured: false };
      const items = ai.data?.[0]?.items || [];
      const withVol = items.filter((i) => (i.ai_search_volume ?? 0) > 0).length;
      return { score: clamp(Math.round((withVol / Math.max(1, items.length)) * 100)), measured: true, evidence: `${withVol}/${items.length} tracked terms show AI search volume` };
    })(),
  };
  const ANSWERS_W = { citations: 40, extractability: 25, eeat: 20, aiDemand: 15 };

  // ---------- AGENTS ----------
  S.agents = {
    access: (() => {
      if (!site?.robots) return { measured: false };
      const bots = site.robots.aiBots || [];
      const blocked = bots.filter((b) => !b.allowed);
      const searchCritical = blocked.filter((b) => ["OAI-SearchBot", "PerplexityBot", "ChatGPT-User"].includes(b.bot));
      let score = 100 - blocked.length * 10 - searchCritical.length * 15;
      return { score: clamp(score), measured: true, evidence: blocked.length ? `blocked: ${blocked.map((b) => b.bot).join(", ")}` : "all 9 AI crawlers allowed" };
    })(),
    llmsTxt: (() => {
      if (!site?.llmsTxt) return { measured: false };
      const l = site.llmsTxt;
      let score = 0; const ev = [];
      if (l.present) {
        score = l.quality === "good" ? 95 : l.quality === "fair" ? 65 : 35;
        ev.push(`llms.txt present, quality ${l.quality} (${l.linkCount} links)`);
        if (site.llmsFullTxt?.present) { score = clamp(score + 5); ev.push("llms-full.txt present"); }
      } else ev.push("no llms.txt (agents-pillar gap; NOT a search-ranking issue)");
      return { score, measured: true, evidence: ev.join("; ") };
    })(),
    schemaHonesty: (() => {
      if (!site?.homepage) return { measured: false };
      const ld = site.homepage.jsonLd || [];
      const types = ld.flatMap((x) => x.types || []);
      const invalid = ld.filter((x) => !x.valid).length;
      const fakeFaq = types.includes("FAQPage") && !site.homepage.hasFaqMarkup;
      let score = 80; const ev = [];
      if (invalid) { score -= 40; ev.push(`${invalid} invalid block(s)`); }
      if (fakeFaq) { score -= 40; ev.push("FAQPage schema with no visible FAQ content (dishonest schema)"); }
      if (!ld.length) { score = 50; ev.push("no schema to judge (neutral)"); }
      return { score: clamp(score), measured: true, evidence: ev.join("; ") || "schema matches visible content" };
    })(),
    rawHtml: (() => {
      if (!site?.homepage) return { measured: false };
      const len = site.homepage.noJsTextLength || 0;
      const score = len > 2000 ? 95 : len > 800 ? 75 : len > 200 ? 45 : 10;
      return { score, measured: true, evidence: `${len} chars of content readable without JavaScript` };
    })(),
    discovery: (() => {
      if (!site?.homepage) return { measured: false };
      const has = site.homepage.discoveryHeaders?.hasLlmsLink || site.homepage.llmsAlternateLink;
      return { score: has ? 100 : 0, measured: true, evidence: has ? "llms.txt discovery headers/link present" : "no discovery headers or alternate link" };
    })(),
  };
  const AGENTS_W = { access: 30, llmsTxt: 25, schemaHonesty: 20, rawHtml: 15, discovery: 10 };

  const pillar = (signals, weights) => {
    let wSum = 0, acc = 0; const unmeasured = [];
    for (const [k, w] of Object.entries(weights)) {
      const s = signals[k];
      if (s?.measured) { wSum += w; acc += w * s.score; }
      else unmeasured.push(k);
    }
    return { score: wSum ? Math.round(acc / wSum) : null, unmeasured, signals };
  };

  const search = pillar(S.search, SEARCH_W);
  const answers = pillar(S.answers, ANSWERS_W);
  const agents = pillar(S.agents, AGENTS_W);
  const overall = (answers.score != null && search.score != null && agents.score != null)
    ? Math.round(0.4 * answers.score + 0.35 * search.score + 0.25 * agents.score)
    : null;

  return { search, answers, agents, overall, mentionRates: rates, rubric: "rubric.md v1" };
}

export function mentionRates(probes) {
  const acc = { branded: { mentioned: 0, measured: 0 }, unbranded: { mentioned: 0, measured: 0 }, measuredCells: 0, unmeasuredCells: 0 };
  for (const p of probes) {
    for (const r of p.results || []) {
      if (r.status !== "ok") { acc.unmeasuredCells++; continue; } // HONESTY: unmeasured is never "not mentioned"
      acc.measuredCells++;
      const cohort = p.cohort === "branded" ? acc.branded : acc.unbranded;
      cohort.measured++;
      if (r.mentioned) cohort.mentioned++;
    }
  }
  acc.branded.rate = acc.branded.measured ? acc.branded.mentioned / acc.branded.measured : 0;
  acc.unbranded.rate = acc.unbranded.measured ? acc.unbranded.mentioned / acc.unbranded.measured : 0;
  return acc;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.includes("--help")) {
    console.log("Usage: node scripts/score.mjs <site.json> <dfs.json|-> [--out scores.json]\n  Pass '-' for dfs.json to score free checks only (paid signals report unmeasured).");
    process.exit(args.includes("--help") ? 0 : 1);
  }
  const site = JSON.parse(readFileSync(args[0], "utf8"));
  const dfs = args[1] === "-" ? null : JSON.parse(readFileSync(args[1], "utf8"));
  const scores = computeScores(site, dfs);
  const outIdx = args.indexOf("--out");
  const json = JSON.stringify(scores, null, 2);
  if (outIdx > -1) { const p = args[outIdx + 1]; mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, json); console.log(`wrote ${p} — SEARCH ${scores.search.score} ANSWERS ${scores.answers.score} AGENTS ${scores.agents.score} OVERALL ${scores.overall}`); }
  else console.log(json);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
