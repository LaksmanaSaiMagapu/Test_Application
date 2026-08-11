# Stage 6 — Defect triage (trigger: any red run)

Artifacts: `{{REPORT_DIR}}` (JUnit XML, traces, logs)

Task:
1. Parse the JUnit XML; for each failure gather the error, stack, linked
   trace, and the relevant service logs if mounted.
2. Classify each failure: PRODUCT-DEFECT / TEST-DEFECT / ENV-FLAKE,
   with confidence (high/med/low) and verbatim evidence.
3. For each PRODUCT-DEFECT with med+ confidence, emit a tracker-ready ticket:
   title, repro, expected vs actual, evidence excerpts, suspected component,
   proposed severity.
4. Output `triage-{{RUN_DATE}}.md` with the full table.
Never modify product code in this stage.
