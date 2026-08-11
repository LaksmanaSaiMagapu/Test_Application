# Stage 3 — Static analysis remediation (gate 1)

Repository: `{{REPO_PATH}}`  Branch: `{{BRANCH}}`
SonarQube: `{{SONAR_URL}}`  Project key: `{{SONAR_PROJECT_KEY}}`

Task:
1. Pull open blocker/critical issues:
   `curl "$SONAR_URL/api/issues/search?componentKeys=$SONAR_PROJECT_KEY&severities=BLOCKER,CRITICAL&statuses=OPEN"`
   (token from the SONAR_TOKEN secret).
2. Group issues by rule. For each group, produce the minimal behavior-preserving
   fix; one group per commit, message: `fix(sonar): <rule-key> — <issue keys>`.
3. Re-run build + tests after each group. Abort and report if anything goes red.
4. Re-run the scanner and list issues that remain, with justification
   (false positive / needs design decision).
5. Deliver: branch `ivv/sonar-{{BRANCH}}`, a summary table
   (rule | count fixed | count remaining | notes), and — if a rule fired >3
   times — a coding-standard recommendation for the dev team.
