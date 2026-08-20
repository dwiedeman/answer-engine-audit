#!/usr/bin/env node
// dfs.mjs — DataForSEO client for the answer-engine-audit skill. Zero npm dependencies.
// Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from the environment ONLY.
// Every call goes through optionalCall: {ok, data, error?, costUsd} — a dead endpoint
// never throws, and cost is captured from every charged response INCLUDING errors.
// A running total enforces the spend cap: once reached, further billable calls are
// skipped with status "cap".
//
// Usage:
//   node scripts/dfs.mjs collect <url> [--budget 5] [--out audit-work/dfs.json]
//                                [--branded "q1|q2"] [--unbranded "q1|q2"] [--keywords "k1|k2"]
//   node scripts/dfs.mjs call <path> '<json-task>'     one raw endpoint call (debugging)
//   node scripts/dfs.mjs --help

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = "https://api.dataforseo.com";
const US = { location_code: 2840, language_code: "en" };

function usage() {
  console.log(`dfs.mjs — DataForSEO collection for answer-engine-audit

Requires env: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD (get them at dataforseo.com — $50 min top-up, free sandbox)

Subcommands:
  collect <url> [--budget 5] [--out file.json] [--branded "q1|q2"] [--unbranded "q1|q2"] [--keywords "k1|k2"]
      Typical-depth collection (~$2-3): instant pages, lighthouse, ranked keywords, SERPs,
      backlinks, technologies, AI keyword volume, LLM response probes, LLM mentions.
  call <path> '<json-task-object>'
      One raw POST to any v3 endpoint (debugging). Body is [task].

Every response's cost is accumulated; the --budget cap (default 5 USD) halts further
billable calls once reached. Failed calls report {ok:false} and the run continues.`);
}

function creds() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    console.error(JSON.stringify({
      ok: false,
      error: "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set. This skill requires a DataForSEO account (dataforseo.com): pay-as-you-go, $50 minimum top-up, credits never expire, free sandbox. Set both env vars and re-run.",
    }, null, 2));
    process.exit(2);
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

export class DfsClient {
  constructor({ budgetUsd = 5 } = {}) {
    this.auth = creds();
    this.budgetUsd = budgetUsd;
    this.spentUsd = 0;
    this.calls = [];
  }

  capReached() { return this.spentUsd >= this.budgetUsd; }

  async optionalCall(path, task, { label = path, billable = true } = {}) {
    if (billable && this.capReached()) {
      const rec = { label, path, ok: false, status: "cap", costUsd: 0, error: `spend cap $${this.budgetUsd} reached (spent $${this.spentUsd.toFixed(3)})` };
      this.calls.push(rec);
      return rec;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const res = await fetch(BASE + path, {
        method: "POST",
        headers: { Authorization: this.auth, "Content-Type": "application/json" },
        body: JSON.stringify([task]),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      // Cost is charged even on many error responses — capture it FIRST, from every shape.
      const cost = Number(json?.cost ?? json?.tasks?.[0]?.cost ?? 0) || 0;
      this.spentUsd += cost;
      if (!res.ok || !json || json.status_code >= 40000 || json.tasks_error > 0) {
        const err = json ? `${json.status_code} ${json.status_message || ""} ${json.tasks?.[0]?.status_message || ""}`.trim() : `http ${res.status}`;
        const rec = { label, path, ok: false, status: "error", costUsd: cost, error: err.slice(0, 500) };
        this.calls.push(rec);
        return rec;
      }
      const result = json.tasks?.[0]?.result ?? null;
      const rec = { label, path, ok: true, status: "ok", costUsd: cost, data: result };
      this.calls.push({ ...rec, data: undefined });
      return rec;
    } catch (e) {
      const rec = { label, path, ok: false, status: "error", costUsd: 0, error: String(e.message || e).slice(0, 300) };
      this.calls.push(rec);
      return rec;
    } finally {
      clearTimeout(timer);
    }
  }

  summary() {
    return { spentUsd: Number(this.spentUsd.toFixed(4)), budgetUsd: this.budgetUsd, capReached: this.capReached(), calls: this.calls };
  }
}

function parseListFlag(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  return String(args[i + 1] || "").split("|").map((s) => s.trim()).filter(Boolean);
}

async function collect(args) {
  const target = args[0];
  if (!target) { usage(); process.exit(1); }
  const u = new URL(target.startsWith("http") ? target : `https://${target}`);
  const domain = u.hostname.replace(/^www\./, "");
  const budgetIdx = args.indexOf("--budget");
  const budgetUsd = budgetIdx > -1 ? Number(args[budgetIdx + 1]) : 5;
  const outIdx = args.indexOf("--out");
  const outPath = outIdx > -1 ? args[outIdx + 1] : null;
  const branded = parseListFlag(args, "--branded") || [
    `what is ${domain}`, `is ${domain} legit and reputable`, `${domain} reviews`,
  ];
  const unbranded = parseListFlag(args, "--unbranded") || [];
  const keywords = parseListFlag(args, "--keywords") || [];

  const dfs = new DfsClient({ budgetUsd });
  const out = { target: u.origin, domain, collectedAt: new Date().toISOString() };

  // Fast, cheap, parallel base facts.
  const [instant, lighthouse, ranked, backlinks, tech] = await Promise.all([
    dfs.optionalCall("/v3/on_page/instant_pages", { url: u.origin + "/", enable_javascript: false, ...{} }, { label: "instant_pages" }),
    dfs.optionalCall("/v3/on_page/lighthouse/live/json", { url: u.origin + "/", for_mobile: true, categories: ["performance", "seo"] }, { label: "lighthouse" }),
    dfs.optionalCall("/v3/dataforseo_labs/google/ranked_keywords/live", { target: domain, ...US, limit: 200, order_by: ["keyword_data.keyword_info.search_volume,desc"] }, { label: "ranked_keywords" }),
    dfs.optionalCall("/v3/backlinks/summary/live", { target: domain, include_subdomains: true }, { label: "backlinks_summary" }),
    dfs.optionalCall("/v3/domain_analytics/technologies/domain_technologies/live", { target: domain }, { label: "technologies" }),
  ]);
  out.instantPages = instant; out.lighthouse = lighthouse; out.rankedKeywords = ranked;
  out.backlinks = backlinks; out.technologies = tech;

  // SERP checks on the top unbranded concepts (presence + AI Overview presence).
  const serpQueries = unbranded.slice(0, 8);
  out.serps = [];
  for (const q of serpQueries) {
    out.serps.push({ query: q, ...(await dfs.optionalCall("/v3/serp/google/organic/live/advanced", { keyword: q, ...US, depth: 20 }, { label: `serp:${q.slice(0, 40)}` })) });
  }

  // AI keyword demand for the site's terms.
  if (keywords.length) {
    out.aiKeywordVolume = await dfs.optionalCall("/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live", { keywords: keywords.slice(0, 100), ...US }, { label: "ai_keyword_volume" });
  }

  // Measured citations — the core ANSWERS evidence. Branded + unbranded probes.
  // HONESTY RULE: a failed probe is status:"unmeasured", never "not mentioned".
  const probes = [
    ...branded.map((q) => ({ q, cohort: "branded" })),
    ...unbranded.map((q) => ({ q, cohort: "unbranded" })),
  ];
  // model_name is REQUIRED by the API (verified live 2026-08-20: omitting it returns
  // 40501 Invalid Field). Defaults are the consumer-representative models; override
  // via AEA_MODEL_CHATGPT / AEA_MODEL_PERPLEXITY / AEA_MODEL_GEMINI. Valid names:
  // GET /v3/ai_optimization/<provider>/llm_responses/models
  const models = [
    { name: "chatgpt", path: "/v3/ai_optimization/chat_gpt/llm_responses/live", model: process.env.AEA_MODEL_CHATGPT || "gpt-5.5" },
    { name: "perplexity", path: "/v3/ai_optimization/perplexity/llm_responses/live", model: process.env.AEA_MODEL_PERPLEXITY || "sonar" },
    { name: "gemini", path: "/v3/ai_optimization/gemini/llm_responses/live", model: process.env.AEA_MODEL_GEMINI || "gemini-3.5-flash" },
  ];
  out.llmProbes = [];
  for (const probe of probes.slice(0, 16)) {
    const perModel = await Promise.all(models.map(async (m) => {
      const r = await dfs.optionalCall(m.path, { user_prompt: probe.q, model_name: m.model, web_search: true, max_output_tokens: 1024 }, { label: `probe:${m.name}:${probe.q.slice(0, 30)}` });
      if (!r.ok) return { model: m.name, status: "unmeasured", error: r.error };
      const text = JSON.stringify(r.data || "");
      const mentioned = new RegExp(domain.split(".")[0], "i").test(text) || new RegExp(domain.replace(/\./g, "\\."), "i").test(text);
      return { model: m.name, status: "ok", mentioned, excerpt: extractExcerpt(r.data, domain), costUsd: r.costUsd };
    }));
    out.llmProbes.push({ prompt: probe.q, cohort: probe.cohort, results: perModel });
  }

  // Brand mention metrics.
  // Payload shape verified live 2026-08-20: `target` is an array of objects, each
  // carrying exactly one of `domain` or `keyword` ({targets:[...]}, {target:["..."]}
  // and {target:[{target,target_type}]} all return 40501). $0.10/request.
  out.llmMentions = await dfs.optionalCall("/v3/ai_optimization/llm_mentions/target_metrics_lite/live", { target: [{ domain }], ...US }, { label: "llm_mentions" });

  out.spend = dfs.summary();
  const json = JSON.stringify(out, null, 2);
  if (outPath) { mkdirSync(dirname(outPath), { recursive: true }); writeFileSync(outPath, json); console.log(`wrote ${outPath} — spent $${out.spend.spentUsd} of $${budgetUsd}`); }
  else console.log(json);
}

function extractExcerpt(data, domain) {
  try {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    const idx = text.toLowerCase().indexOf(domain.split(".")[0].toLowerCase());
    if (idx === -1) return null;
    return text.slice(Math.max(0, idx - 120), idx + 180).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  } catch { return null; }
}

async function rawCall(args) {
  const [path, taskJson] = args;
  if (!path || !taskJson) { usage(); process.exit(1); }
  const dfs = new DfsClient({ budgetUsd: 99 });
  const r = await dfs.optionalCall(path, JSON.parse(taskJson), { label: "raw" });
  console.log(JSON.stringify({ ...r, spend: dfs.summary() }, null, 2));
}

const [sub, ...rest] = process.argv.slice(2);
if (!sub || sub === "--help") { usage(); process.exit(sub ? 0 : 1); }
if (sub === "collect") collect(rest).catch((e) => { console.error(String(e.message || e)); process.exit(1); });
else if (sub === "call") rawCall(rest).catch((e) => { console.error(String(e.message || e)); process.exit(1); });
else { usage(); process.exit(1); }
