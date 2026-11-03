# Private consumer journal and open batch discussions

Status: Future product plan; documentation only. Requested by Mike on November 3, 2026.

## Priority and purpose

The private consumer journal and open batch discussions are major intended future uses of The Green List. Preserve both as core product directions rather than incidental COA viewer extras.

This plan does not change the existing delivery order: finish existing implementation PRs, then prioritize the separate ROOT_CUSTODIAN emergency audit/recovery work, before implementing this future feature set. Opening this planning PR is not authorization to deploy features or change production data.

Goal: help consumers understand their own reported experiences, compare batch-specific observations, and turn evidence-backed concerns into reviewed responses and documented outcomes. The platform remains non-commerce.

## Major feature 1: Private consumer journal

- Consumer accounts can save product/batch references and COAs in a private journal.
- A scan records report access only; never infer purchase, possession, use, or consumption.
- Optional Interested, Purchased, and Tried states distinguish intent from self-reported activity. Purchased and Tried are user assertions, not verified facts.
- Allow optional personal notes, date, method, approximate amount, intensity, and repeat experience entries. Do not require consumption details.
- Journal entries are private by default and unavailable to other consumers or businesses. Administrative access must be explicitly scoped, justified, and audited.
- Publishing feedback requires a separate explicit action; posting a survey must not expose a journal entry or its metadata.
- Support edit, export, deletion, and a defined retention policy.

## Shared batch survey and aggregation

Offer a short optional survey covering aroma, flavor, appearance, packaging, perceived quality, reported effects (including none/unexpected), intensity, willingness to choose the batch again, and concerns. Sensitive contextual fields remain optional and private unless explicitly shared.

- Link by validated product and batch identity, not strain name alone. Uncertain matches remain clearly marked and excluded from exact-batch summaries until resolved.
- One editable aggregate survey contribution per account per batch; repeat private entries do not increase contributor counts.
- Show distinct contributor counts, per-question denominators, missing answers, and small sample limitations. Define privacy-preserving publication thresholds before release.
- Separate laboratory-reported values, extracted text, platform-reviewed findings, and consumer self-reports.
- Do not treat voluntary surveys as representative research, causal evidence, verified consumption, or proof of product safety.
- Summaries must trace back to eligible responses and update when responses change or are removed.
- Use understandable descriptors without prescribing doses or making medical or efficacy claims.

## Major feature 2: Open batch discussions

Provide publicly readable, batch-linked questions and discussions, with authenticated posting and optional public pseudonyms. Explain that pseudonyms do not guarantee anonymity.

- Consumers can compare observations and ask questions about the same batch.
- Verified business representatives can provide clearly attributed responses; verification concerns identity/authority, not product quality.
- Display COA sources, questions, consumer observations, business responses, and reviewed findings distinctly.
- Include reporting, spam/rate controls, moderation, appeals, corrections, and an audit trail.
- Route sensitive evidence and potential safety allegations into private review; do not automatically publish accusations or adverse-event identities.
- Prevent harassment, doxxing, covert promotion, and commerce coordination.
- Paid relationships cannot improve findings, suppress legitimate criticism, or purchase favorable moderation.
- Keep discussions focused on records and batch evidence, consistent with the site's public-interest purpose.

## Evidence and outcome workflow

Scan/save -> optionally self-report an experience -> submit a concern privately -> human review where needed -> request an attributed business response -> document a supported outcome/correction -> notify opted-in followers when appropriate.

Neutral COA intake remains independent from misconduct reporting. Receipt, transcription review, authenticity assessment, and publication remain separate states. A COA does not guarantee safety or authenticity.

## Delivery phases

1. Reconcile this plan with existing COA, organization verification, moderation, and entitlement work; inventory existing models and avoid duplicate systems.
2. Implement private journal and explicit sharing boundaries.
3. Implement batch surveys and privacy-preserving aggregate summaries.
4. Implement open batch discussions after moderation and business response tooling are ready.
5. Add opted-in batch alerts and outcome reporting as capacity allows.

Basic COA scanning and evidence intake stay free. Paid analytics/alerts may be considered separately; access to correction or fair treatment cannot depend on payment.

## Future implementation acceptance checks

- A scan never creates a Tried/Purchased claim.
- Another consumer or business cannot read private entries through UI, API, database policies, uploads, search, exports, notifications, or aggregates.
- Private entry sharing requires explicit consent and reveals only selected fields.
- Wrong or uncertain batches cannot contaminate confirmed batch summaries.
- Repeat entries cannot inflate distinct contributor counts.
- Changing/removing feedback updates summaries under the documented retention policy.
- Public summaries disclose sample size and distinguish self-reports from lab results.
- Discussion access, verified business replies, reporting, appeals, and high-risk review work across intended account roles.
- No buying, ordering, inventory, delivery, checkout, or brokering is introduced.
- Homepage/account/batch-page copy explains personal usefulness and the evidence-to-resolution mission without claiming unavailable capabilities.

Before implementation, finalize the data model, RLS/access matrix, moderation capacity, retention/deletion semantics, aggregate privacy thresholds, accessibility, and test plan. Apply changes through reviewed migrations and isolated staging validation.

## Success measures

Measure repeat usefulness of the journal, successful batch matches, substantive business responses, documented corrections/resolutions, and time to resolution. Scan and upload counts alone do not demonstrate industry impact.

## Possible later additions

State-specific sourced guidance, submission of screenshots/web claims, dated correction histories, and reviewed recurring-pattern reports remain possible additions. They are not part of the initial journal/discussion delivery scope.
