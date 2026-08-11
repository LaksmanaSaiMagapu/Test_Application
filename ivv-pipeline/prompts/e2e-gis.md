# Stage 5 — Nightly E2E IV&V (trigger: cron 0 2 * * *)

SUT base URL: `{{SUT_URL}}`  Suite repo: `{{E2E_REPO_PATH}}`

Task:
1. Verify the QA namespace is healthy (readiness endpoints) before starting;
   abort with an ENV report if not.
2. Maintain and run the Playwright suite:
   - map load & basemap render (canned tiles only)
   - layer control toggles & legend sync
   - feature click → popup content vs. API truth (`GET /api/features/:id`)
   - draw + measure tools: geometry values vs. expected
   - API flow: create → Kafka event → read-model update (correlation ID)
3. Every failing spec: capture trace, video, screenshot.
4. Classify failures (product defect / test defect / env flake) per your rules.
5. Deliver: JUnit XML + HTML report to `reports/{{RUN_DATE}}/`,
   triage table, and updated specs if selectors needed healing
   (separate commit, message prefix `test(e2e): heal selectors`).
