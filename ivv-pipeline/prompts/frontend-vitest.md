# Frontend unit + integration test generation (Jenkins pipeline stage)

Repository: `{{REPO_PATH}}` — React 19 + Vite frontend of the GeoNexus GIS Dashboard.
Build: `{{BUILD_TAG}}`

Context (already set up — do NOT reinstall or reconfigure):
- `vitest.config.js` — jsdom, tests in `tests/`, JUnit + lcov reporters into `reports/`
- `tests/setup.js`, `tests/mocks/{server,handlers}.js` — MSW server mirroring the REST API
  (`http://localhost:8080/api/{areas,tracks,routes}`), in-memory CRUD
- `tests/geo.test.js` — passing example; follow its conventions
- Run tests with `npm run test:unit`; coverage with `npm run test:coverage`

Task:
1. Read the components under `src/` (LoginPage, Header, Footer, Dashboard, SidebarLeft,
   SidebarRight) and `src/App.jsx`. Classify by testability.
2. Write Vitest + React Testing Library tests in `tests/` (never in `src/`):
   - rendering tests per component (props in, DOM out)
   - interaction tests (click/change → state/DOM effect)
   - integration tests for API flows via the MSW handlers — extend
     `tests/mocks/handlers.js` if an endpoint shape is missing; never hit the network
   - spatial edge cases where geometry is involved (empty geometries, null island, antimeridian)
   - name tests `test_<unit>_<scenario>_<expectation>`; no vacuous asserts
3. Create `tests/header.yml` — the test manifest consumed by the reporting stage:
   one entry per test file:
   ```yaml
   tests:
     - file: tests/login.test.jsx
       requirement: REQ-AUTH-001
       covers: [src/components/LoginPage.jsx]
       cases: <count>
   ```
4. Run `npm run test:unit` and iterate until green. Then `npm run test:coverage`
   and report the coverage delta per file.
5. Deliver: new files under `tests/` only, the TEST-INTENT table
   (test | requirement | what breaks it), and `DEFECTS-SUSPECTED.md` if any
   behavior looked wrong while testing.

Do NOT modify anything under `src/`. Do NOT push. Do not weaken assertions to force green.
