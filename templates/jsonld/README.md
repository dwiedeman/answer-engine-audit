# JSON-LD snippets — honesty rules first

Schema must describe content that is VISIBLE on the page. Dishonest schema is worse
than no schema: agents parse it as ground truth, and search treats mismatches as spam.

**Safe site-wide:** Organization, WebSite, BreadcrumbList.
**Conditional:** FAQPage — ONLY when the FAQs are visible on that page AND the page is
indexable. Person — only on real author/reviewer pages.
**Do not add without real backing content:** Product/Offer (needs real offers),
LocalBusiness/MedicalClinic/Physician (needs a real physical/professional entity),
Review/AggregateRating (needs genuine reviews).

Replace every {PLACEHOLDER}. Validate with Google's Rich Results Test before shipping.
