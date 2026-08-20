#!/usr/bin/env node
// site-checks.mjs — free direct checks: robots/AI-crawler matrix, llms.txt, sitemap,
// discovery headers, homepage HTML + JSON-LD. Zero npm dependencies.
// Usage: node scripts/site-checks.mjs <url> [--out file.json]
import { promises as dns } from "node:dns";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot",
  "Google-Extended", "Amazonbot", "Applebot-Extended", "CCBot",
];
const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 2_000_000;

function usage() {
  console.log("Usage: node scripts/site-checks.mjs <url> [--out file.json]\n" +
    "Free direct checks. No credentials needed. SSRF-guarded (public hosts only).");
}

function isPrivateIp(ip) {
  if (ip.includes(":")) {
    const low = ip.toLowerCase();
    return low === "::1" || low.startsWith("fe80:") || low.startsWith("fc") || low.startsWith("fd") || low === "::";
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  return (
    p[0] === 10 || p[0] === 127 || p[0] === 0 ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127)
  );
}

export async function assertPublicHost(url) {
  const u = new URL(url);
  if (!/^https?:$/.test(u.protocol)) throw new Error(`refusing non-http(s) URL: ${url}`);
  if (u.hostname === "localhost" || u.hostname.endsWith(".local") || u.hostname.endsWith(".internal")) {
    throw new Error(`refusing private hostname: ${u.hostname}`);
  }
  let records;
  try {
    records = await dns.lookup(u.hostname, { all: true });
  } catch {
    throw new Error(`DNS lookup failed for ${u.hostname}`);
  }
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error(`refusing private/loopback address for ${u.hostname}: ${r.address}`);
  }
  return u;
}

export async function safeFetch(url, { headers = {}, redirect = "follow" } = {}) {
  await assertPublicHost(url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "answer-engine-audit/1.0 (+https://github.com/dwiedeman/answer-engine-audit)", ...headers },
      redirect,
      signal: ctrl.signal,
    });
    // Revalidate the landed URL after redirects (SSRF via redirect).
    if (res.url && res.url !== url) await assertPublicHost(res.url);
    const ctype = res.headers.get("content-type") || "";
    const reader = res.body?.getReader();
    let received = 0;
    const chunks = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_BODY_BYTES) { reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
    return { ok: res.ok, status: res.status, url: res.url, headers: Object.fromEntries(res.headers.entries()), contentType: ctype, body, truncated: received > MAX_BODY_BYTES };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export function parseRobots(body) {
  // Group directives by user-agent blocks.
  const groups = [];
  let current = null;
  for (const raw of (body || "").split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(val.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current) {
      current.rules.push({ type: key, path: val });
    } else if (key === "sitemap") {
      groups.sitemaps = groups.sitemaps || [];
      groups.sitemaps.push(val);
    }
  }
  return groups;
}

export function botVerdict(groups, bot) {
  const lower = bot.toLowerCase();
  let block = groups.find((g) => g.agents?.includes(lower));
  let source = "specific";
  if (!block) { block = groups.find((g) => g.agents?.includes("*")); source = "wildcard"; }
  if (!block) return { bot, allowed: true, source: "default-open" };
  // Root-path decision: does "/" fall under a disallow with no more-specific allow?
  const dis = block.rules.filter((r) => r.type === "disallow").map((r) => r.path);
  const blockedAll = dis.includes("/") || dis.includes("");
  const hasRootDisallow = dis.includes("/");
  const allowedRules = block.rules.filter((r) => r.type === "allow").map((r) => r.path);
  const allowed = !hasRootDisallow || allowedRules.includes("/");
  return { bot, allowed, source, disallows: dis.slice(0, 10), blockedAll };
}

export function extractJsonLd(html) {
  const out = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      out.push({ valid: true, types: collectTypes(parsed) });
    } catch (e) {
      out.push({ valid: false, error: String(e.message).slice(0, 120) });
    }
  }
  return out;
}
function collectTypes(node, acc = []) {
  if (Array.isArray(node)) node.forEach((n) => collectTypes(n, acc));
  else if (node && typeof node === "object") {
    if (node["@type"]) acc.push(...[].concat(node["@type"]));
    if (node["@graph"]) collectTypes(node["@graph"], acc);
  }
  return acc;
}

export function stripTags(html) {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeLlmsTxt(body) {
  if (!body) return { quality: "missing" };
  const hasTitle = /^#\s+.+/m.test(body);
  const hasSummary = /^>\s+.+/m.test(body);
  const linkCount = (body.match(/^-\s*\[[^\]]+\]\([^)]+\)/gm) || []).length;
  const looksLikeSitemapDump = linkCount > 200;
  let quality = "poor";
  if (hasTitle && hasSummary && linkCount >= 3 && !looksLikeSitemapDump) quality = "good";
  else if (hasTitle && linkCount >= 1) quality = "fair";
  return { quality, hasTitle, hasSummary, linkCount, looksLikeSitemapDump };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) { usage(); process.exit(args.length ? 0 : 1); }
  const target = args[0];
  const outIdx = args.indexOf("--out");
  const outPath = outIdx > -1 ? args[outIdx + 1] : null;

  const u = await assertPublicHost(target.startsWith("http") ? target : `https://${target}`);
  const origin = `${u.protocol}//${u.hostname}`;
  const result = { target: origin, checkedAt: new Date().toISOString() };

  const [home, robots, llms, llmsFull] = await Promise.all([
    safeFetch(origin + "/"),
    safeFetch(origin + "/robots.txt"),
    safeFetch(origin + "/llms.txt"),
    safeFetch(origin + "/llms-full.txt"),
  ]);

  result.homepage = {
    status: home.status, finalUrl: home.url, truncated: !!home.truncated,
    title: (home.body?.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim()?.slice(0, 300) || null,
    metaDescription: (home.body?.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']*)["']/i) || [])[1]?.slice(0, 500) || null,
    h1Count: (home.body?.match(/<h1[\s>]/gi) || []).length,
    noJsTextLength: stripTags(home.body).length,
    scriptTagCount: (home.body?.match(/<script[\s>]/gi) || []).length,
    hasFaqMarkup: /faq/i.test(home.body || ""),
    tableCount: (home.body?.match(/<table[\s>]/gi) || []).length,
    jsonLd: extractJsonLd(home.body || ""),
    llmsAlternateLink: /<link[^>]+rel\s*=\s*["']alternate["'][^>]+llms\.txt/i.test(home.body || ""),
    discoveryHeaders: {
      link: home.headers?.["link"] || null,
      xLlmsTxt: home.headers?.["x-llms-txt"] || null,
      hasLlmsLink: /llms-txt/.test(home.headers?.["link"] || "") || !!home.headers?.["x-llms-txt"],
    },
  };

  const robotsGroups = home && robots.ok ? parseRobots(robots.body) : [];
  result.robots = {
    status: robots.status,
    present: robots.ok,
    sitemaps: robotsGroups.sitemaps || [],
    aiBots: AI_BOTS.map((b) => botVerdict(robotsGroups, b)),
  };

  const sitemapUrl = (robotsGroups.sitemaps && robotsGroups.sitemaps[0]) || origin + "/sitemap.xml";
  let sitemap = { status: 0 };
  try {
    sitemap = await safeFetch(sitemapUrl);
  } catch (e) { sitemap = { ok: false, status: 0, error: String(e.message || e) }; }
  result.sitemap = {
    url: sitemapUrl, status: sitemap.status, present: !!sitemap.ok,
    urlCount: (sitemap.body?.match(/<loc>/g) || []).length,
    isIndex: /<sitemapindex/i.test(sitemap.body || ""),
  };

  result.llmsTxt = { status: llms.status, present: llms.ok && !/<html/i.test(llms.body || ""), ...analyzeLlmsTxt(llms.ok && !/<html/i.test(llms.body || "") ? llms.body : null) };
  result.llmsFullTxt = { status: llmsFull.status, present: llmsFull.ok && !/<html/i.test(llmsFull.body || "") };

  const json = JSON.stringify(result, null, 2);
  if (outPath) { mkdirSync(dirname(outPath), { recursive: true }); writeFileSync(outPath, json); console.log(`wrote ${outPath}`); }
  else console.log(json);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(`site-checks failed: ${e.message}`); process.exit(1); });
}
