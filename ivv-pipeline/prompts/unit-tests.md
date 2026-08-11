# Stage 2 — Unit test generation (trigger: MR webhook)

Repository: `{{REPO_PATH}}`
Merge request: `!{{MR_IID}}` — commit `{{MR_SHA}}`, target branch `{{TARGET_BRANCH}}`

Task:
1. `git diff --name-only origin/{{TARGET_BRANCH}}...{{MR_SHA}}` and classify changed files.
2. For each changed production file, write unit tests per your standing rules.
   Target changed-line coverage; prioritize failure modes (nulls, boundaries,
   async error paths, spatial edge cases like antimeridian/empty geometries).
3. Run the module's existing tests plus your new ones; iterate until green.
4. Run the coverage tool and report the delta for changed files.
5. Deliver:
   - new/modified test files (in `tests/` or the project's test tree — never
     mixed into production source dirs)
   - the TEST-INTENT table for human review
   - a `DEFECTS-SUSPECTED.md` if any behavior looked wrong while testing
Do NOT push. Leave the working tree clean except for the new test artifacts.
