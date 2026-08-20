# Discovery gate — complete BEFORE any paid call

The two required artifacts are a **property map** and a **seed keyword brief**. Keep both in the working notes so post-run QA can compare intended scope with actual provider inputs. This gate prevents the most expensive failure class: buying data about the wrong property or a mis-scoped market.

## Property map

Start from the user-supplied URL, but do not assume it is the only or best report target.

1. Resolve the canonical brand name from current first-party evidence.
2. Check HTTPS status and redirect behavior for apex and `www` hosts.
3. Inspect visible navigation, HTML links, robots directives, canonical tags, `robots.txt`, and actual sitemap responses.
4. Look for location, team, and person pages. Verify claimed relationships in visible first-party content; never infer ownership from an address, page title, or third-party profile.
5. Search for current microsites, campaign domains, directories, social profiles, and legacy properties associated with the brand.
6. Follow conversion paths (booking, application, calculator, contact). Record broken, blocked, stale, or contradictory paths.
7. Classify each discovered property: `primary` (canonical report target) · `supporting` (active first-party, relevant) · `third_party` · `stale` / `broken` / `parked` / `blocked` / `contradictory` (finding only, never a positive asset).
8. Decide the market model: verified local business, national brand, or combined ecosystem. State the evidence.

Record per property: URL, apparent controller, purpose, status, indexability, relationship evidence, report role, date checked.

## Seed keyword brief

Research seeds before generating variants. Use current site evidence plus a cold-eyes look at unbranded search results, competitors, and authoritative resources.

Build a compact set of representative seeds across:

- category and provider synonyms;
- each verified core product or service;
- high-intent actions (quote, booking, purchase, repair — as applicable);
- material customer segments;
- local market language when the model is local;
- comparison and decision-stage language;
- every exact unbranded query the user supplied.

Per candidate record: normalized concept, seed phrase, intent, evidence URL, provider destination, caveat. Mark unsupported, regulated, or ambiguous concepts `excluded` or `verify_before_use`. Do not infer an offering because competitors rank for it.

Three classic errors to avoid:

- One generic phrase is not the market.
- Seeds are representative concepts; variants are the measurement universe — do not send every expansion as a seed.
- Default limits silently truncate concept coverage — enumerate variants and pick limits that keep coverage balanced.

## Branded vs unbranded probe sets (ANSWERS pillar)

Build BOTH before spending:

- **Branded probes** (~6): "what is <brand>", "is <brand> legit/reputable", "<brand> reviews", "<brand> vs <top competitor>".
- **Unbranded probes** (~6–10): the seed brief's high-intent questions phrased as a buyer would ask an assistant ("best <category> for <use case>", "<category> near me", "which <category> should I buy").

The split matters: 100% branded mention with 0% unbranded mention is the classic GEO diagnosis — AI knows the brand exists but never recommends it.

## Gate decision

Proceed to paid calls only when: the primary property and market model are verified; supporting domains and conversion paths are classified; the seed set covers verified offerings, synonyms, actions, and intent; exclusions are documented; and the exact planned provider inputs can be enumerated. Otherwise keep discovering — discovery is free, wrong spend is not.
