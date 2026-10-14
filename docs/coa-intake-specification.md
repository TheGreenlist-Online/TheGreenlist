# COA intake and review implementation specification

Status: proposed implementation; no production schema or application changes in this PR.

## Evidence and inspection baseline

Verified on October 13, 2026 (America/Los_Angeles):
- Repository main snapshot: d8968d40fcb45a7165bd0838eea949c8faca092d.
- Read-only public-schema inspection of TheGreenlist, project idtnlninotxwqpznbwur.
- Reference: user-supplied three-page G3 Labs COA, RL007_RP055_1A4040300000CEA000030147_.pdf. Screenshots are secondary proposal material, not independent laboratory evidence.
- Source document is not committed here; public reproduction permission remains unverified.
- Database metadata inspection establishes columns and relationships, not policy effectiveness, live application behavior, report authenticity, or regulatory compliance.

## Existing integration points

| Existing resource | Verified behavior | Integration decision |
| --- | --- | --- |
| public.evidence_files | Owner, nullable report/thread/post references, bucket/path, file metadata, visibility | Reuse evidence identity; inspect current constraints and Storage/RLS before permitting standalone COA attachments |
| /evidence/upload | Client uploads to evidence bucket; attaches to existing or new reports; 5 files, 15 MB each; private visibility | Add neutral COA submission mode without forcing a misconduct report; enforce limits server-side and in Storage |
| public.business_profiles | Existing business directory identity | Optional reviewed match; never create or merge business identity solely from AI text |
| public.business_documents | Business reference, document type, storage path, uploader and review status | Link existing lab_result sources through document bridge; do not duplicate uploaded bytes |
| /api/businesses/[slug]/documents | Owner-only POST; accepts lab_result | Retain business-owner workflow; general evidence submission needs separate authorization |
| /api/admin/business-documents | Existing administrative review | Reuse authorization patterns and visual shell; COA field review/authentication/publication require separate decisions |
| public.ai_audit_logs | Metadata-only logs, constrained feature/classification values | Add compatible COA feature/classification values in migration before using; never put extracted evidence or prompts in audit logs |
| public.automation_jobs | Background job history | Reuse observability; job history is not itself a durable work queue |

No product, product-batch, or COA analytical-result tables were found in the inspected public schema. public.moderation_batches groups moderation work and must not be repurposed as product batches. Existing RLS-enabled flags do not prove access policies are correct.

## Verified reference mapping

| Field | Source value |
| --- | --- |
| Laboratory | G3 Labs |
| Lab license | 46100778561169443516 |
| Business named on COA | Green Therapeutics |
| Business license | 62002429809099661968 |
| Business location | Las Vegas, NV 89113 |
| Product / strain | Garlic Butter Live Resin Vape / Garlic Butter |
| Classification | Concentrates & Extracts, Formulated Vape Oil, Multiple Solvents |
| Lab sample ID | 2601G3L0026.0294 |
| Production run | LRV-GAR-010826 |
| METRC batch | 1A4040300000CEA000030125 |
| METRC sample | 1A4040300000CEA000030147 |
| Received / report created | 2026-01-09 / 2026-01-15 |
| Harvest process lot / harvest-production date | Blank; numeric/date values remain null |
| Signatory | Isaac Maceo, Scientific Director |
| Total potential THC / CBD | 79.85% / <LOQ |
| Total cannabinoids | 83.18% |
| Total terpenes | 20.39 mg/g |
| Panel outcomes | Pesticides, microbials, mycotoxins, residual solvents, heavy metals, foreign matter: lab-reported Pass |
| Moisture | Explicitly Not Tested |

Capture accreditation wording/number/organization and QR payload as source claims for review; appearance of a logo, signature or QR does not authenticate a report.

Reference cannabinoids: THCa 18.33% / 183.3 mg/g; delta-9 THC 63.77% / 637.7 mg/g; CBGa 1.08% / 10.8 mg/g. Delta-8 THC, CBD, CBDa, CBG, CBN, THCV are <LOQ in both measurement columns. Preserve all nine rows and reported LOQ 0.00016% with its unit.

Reference terpenes: beta-Caryophyllene 10.04 mg/g / 1.004%; Linalool 4.82 / 0.482%; alpha-Humulene 3.68 / 0.368%; delta-Limonene 1.84 / 0.184%. Preserve all 23 rows, including below-LOQ entries, and LOQ 0.0025 mg/g. Keep raw Greek prefixes; do not merge Ocimene, beta-Ocimene, Nerolidol or trans-Nerolidol automatically.

Reference methods include LC402/HPLC-PDA (cannabinoids), GC302/GCMS-HS (terpenes), GC304 & LC404/GCMS-MS & LCMS-MS (pesticides), organism-specific microbial methods, IC501/ICPMS (metals), LC404/LCMS-MS (mycotoxins), GC303/GCMS-HS (solvents), LA602/Microscope (foreign matter), LA601/Moisture Analyzer (moisture). Retain exact original wording, even for unperformed panels.

## Proposed additive model

Final DDL must follow current constraints, policies and repository migration tooling.

- coa_reports: submitter, original report identity, jurisdiction, dates, raw product/business/lab descriptions, methods/notes/disclaimers, optional reviewed batch/business/lab references, distinct extraction/review/authenticity/publication states, superseded-report reference.
- coa_documents: report-to-source bridge with exactly one evidence_files or business_documents reference per row, source role, origin description/URL, privately scoped content fingerprint. Support label attachments and multiple source documents.
- product_records and product_batches: evidence subjects only; no prices, availability, inventory or checkout. Scope identifiers by namespace, jurisdiction and issuing entity. Accept an unmatched report without inventing canonical identities.
- coa_panels: report, original and normalized panel label, method, reported outcome and detail availability. A summary-only Pass is valid; Not Tested differs from absent.
- coa_results: panel, raw analyte label, optional reviewed canonical analyte key, source order.
- coa_measurements: result or summary metric reference (exactly one), raw value, nullable decimal value, qualifier, raw/normalized unit, reporting basis, LOQ/LOD and lab-reported limit with explicit units. Each measurement independently preserves qualifiers.
- coa_summary_metrics: original metric label and lab formula text; measurements preserve headline totals. Derived values have separate derivation metadata.
- coa_extraction_runs: immutable parser/model/schema versions, input fingerprint, protected extracted JSON and field provenance. Preserve unknown fields; reruns never overwrite a reviewed version.
- coa_review_flags and coa_review_events: field references, reason, decision, actor, timestamp and previous/new values; immutable review history.
- Durable queue records/provider: idempotency key, attempts, lease, retry timing, terminal state and cost reservation. Do not assume automation_jobs supplies these semantics.

Provenance for every extracted field: source document ID, page, source text and bounding box when available; record whether OCR or embedded text supplied it. Abstain when provenance or matching is uncertain.

Qualifiers include quantified, below_loq, below_lod, not_detected and missing. Not Tested is primarily panel/test state. Null numeric value never means zero. Record ND independently from the table's unit header; qualitative PCR results must not be invented as CFU/g measurements.

Use lab_reported_limit, not regulatory_limit, until independently checked. Any platform assessment needs rule source/version, effective date, jurisdiction, product category, units and evaluation basis. Never replace lab-reported status.

## Reference validation cases

1. Propane: <LOQ, null numeric value, ppm, LOQ 100 ppm, lab-reported limit 500 ppm, Pass, page 3.
2. Enterobacteriaceae: <LOQ, LOQ 100 CFU/g, limit 99 CFU/g, Pass, page 2. Flag insufficient numerical resolution for independent threshold assessment; preserve Pass and ask for clarification. Do not infer a failure.
3. Displayed terpene sum is 20.38 mg/g; reported total is 20.39 mg/g. Flag a 0.01 difference as a possible rounding discrepancy, not evidence of misconduct.
4. Displayed THCa adjustment plus delta-9 is 18.33 * 0.877 + 63.77 = 79.84541%, rounding to 79.85%. Delta-8 remains below LOQ; this arithmetic is not an exact independent reconstruction of all underlying measurements.
5. Numeric cannabinoid entries sum to 83.18%. Preserve censored entries separately.
6. 20.39 mg/g converts to 2.039% on the same mass basis; label this conversion as platform-derived.
7. Foreign matter has summary Pass and no detailed result table. Moisture is Not Tested. Do not fabricate either table.
8. Blank dates/lot fields and long license/METRC IDs survive extraction and round-trip storage without numeric coercion.

## Intake, AI and review

Upload privately -> validate bytes and authorization -> register source -> extract embedded text, OCR/vision fallback -> schema validation -> normalization proposals -> deterministic checks -> human review -> explicit publication.

Neutral COA submission must work without an allegation or preexisting business/batch. Optional report association is separately authorized. Business owner uploads remain attributable to their actual uploader, not merely the business named in the PDF.

Treat document contents as untrusted data; never execute document instructions or automatically fetch QR destinations. URL retrieval requires allowlisted protocols, SSRF protections and bounded redirects/content. Validate actual file signatures, page limits and decompression limits. Enforce ownership, quotas, total page/token/spend budgets and bounded retry attempts before paid AI work. Repeated submission/retry must not double-charge.

No live AI calls or credential provisioning are required for this specification. Before implementation, inspect the existing AI privacy rules and obtain appropriate authorization for provider processing; do not assume every private evidence document may be sent externally.

Review screen shows original pages next to proposed fields, corrections and unresolved flags. Extraction confidence, human transcription review, source authenticity and publication are independent. No AI promotion to verified, no self-review of sensitive submissions, and no automatic public exposure of original PDFs.

Public view: source-specific headline metrics, panel outcomes, detail tables, missing-information notes and corrections. Use "Lab-reported panel results"; no global safety badge. Raw files require publication permission and privacy review, separate from field publication.

## Delivery sequence and acceptance

1. Storage/model PR: neutral intake, additive tables, private permissions, source bridge, validators and G3 reference fixture. Generate migrations through the Supabase CLI; test in an isolated database/dev environment.
2. Extraction PR: versioned adapters, embedded text/OCR fallback, validated schema, durable jobs, retry/cost limits, field provenance and protected JSON.
3. Review/public-record PR: responsive reviewer comparison, field corrections, source authentication workflow, publication projections and correction history.

Required checks: owner/non-owner/reviewer/anonymous direct database and Storage access; forged publication/reviewer fields; standalone uploads; foreign business source links; row and byte identity enforcement; unresolved batch matching; duplicate bytes without revealing private existence; revised reports; result qualifiers and Greek-name distinctions; unit/basis conversion; missing pages and partial extraction; queue retries and budget exhaustion; private identity/redaction; source withdrawal and corrections.

Test extraction on this PDF, a substantially different laboratory PDF, a scan and a phone photo before claiming broad format support. Track critical-field error rate and human correction effort, not only JSON validity.

## Inspection references

Repository files at the baseline SHA:
- src/app/evidence/upload/evidence-upload-form.tsx
- src/app/api/reports/route.ts
- src/app/api/businesses/[slug]/documents/route.ts
- src/app/api/admin/business-documents/route.ts
- supabase/migrations/20260915031415_align_content_information_model.sql
- AGENTS.md

The inspected live ai_audit_logs schema is metadata-only and has feature constraints. Existing legacy roadmap text is historical and does not establish present production policy or behavior.
