---
name: create-pr
description: Prepare a standardized pull request for a Wazuh Dashboard repository (verify version base branch, DCO sign-off, CHANGELOG entry, run local checks, and produce a ready-to-paste PR body with a pre-flight report). By default it prepares and hands off; it only runs `gh pr create` when explicitly asked. Use when the user asks to create, open, draft, or prepare a PR, or to get work ready for review.
---

# Prepare a Wazuh Dashboard pull request

Standardized PR flow shared across all Wazuh Dashboard repositories. The body is
generic; blocks marked **repo-specific** are the only parts to adjust when reusing
this skill in another repo.

**Default behavior: prepare and hand off.** Do the full pre-flight (steps 1–5) and
output the ready-to-paste PR body plus a pre-flight report, so the human reviews
and opens the PR. Only run `gh pr create` (step 6) when the user explicitly asks
you to create/open/submit it.

## Golden rules (do not skip)

- **Open as Draft first.** CI is configured to skip Draft PRs, so iterate freely
  while in Draft and only trigger CI when the work is validated.
- **Base branch = the version branch the work started from** (e.g. `5.0.0`,
  `6.0.0`), which is **not always `main`**. Never guess — confirm it.
- **Every commit must be DCO-signed** (`git commit --signoff`).
- **Validate locally before "Ready for review"** using the `check-standards` skill.
- **English everywhere.** Describe the _why_, not just the _what_.
- **Issues arrive as URLs** and may live in a different repo. Read them with
  `gh issue view <url>` and classify the source (see below) — it changes both
  "Issues Resolved" and the CHANGELOG.

## Issue source: public vs internal

Detect the source repo from the issue URL:

- **Internal** — the URL/repo contains `internal-devel-request` (e.g.
  `https://github.com/wazuh/internal-devel-requests/issues/5526`):
  - PR "Issues Resolved": **leave empty** — never expose the internal link.
  - CHANGELOG: **no entry** for internal-devel-requests issues.
- **Public** — any other repo (e.g.
  `https://github.com/wazuh/wazuh-security-dashboards-plugin/issues/123`):
  - PR "Issues Resolved": `closes #<n>` (same repo) or `closes <issue-url>`
    (another public repo).
  - CHANGELOG: add an entry linking to the **issue** (see step 4).

> **repo-specific:** the internal repo is `wazuh/internal-devel-requests`; match
> it by the substring `internal-devel-request` in the URL.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Confirm branch, base branch, and clean/committed state
- [ ] 2. Verify commits are DCO-signed
- [ ] 3. Run check-standards (lint + format + tests) and fix failures
- [ ] 4. Add/confirm CHANGELOG entry (or justify the exception)
- [ ] 5. Fill the PR template body + emit the pre-flight report  ← default stop here
- [ ] 6. (Only if explicitly asked) Create the PR as Draft with gh
- [ ] 7. (Only if explicitly asked) Mark Ready for review when everything passes
```

### 1. Confirm branch and base

```bash
git rev-parse --abbrev-ref HEAD        # current (feature) branch
git log --oneline origin/main..HEAD 2>/dev/null | head   # sanity: what's new
```

Feature branch naming: `<type>/<issue#>-<kebab-description>` where `<type>` ∈
`fix`, `bug`, `enhancement`, `feat`, `feature`, `change`, `doc`, `documentation`.

To find the base version branch, list candidates and pick the one the branch
diverged from; if ambiguous, **ask the user** rather than defaulting to `main`:

```bash
git branch -r | grep -E 'origin/(main|[0-9]+\.[0-9]+)'
```

### 2. Verify DCO sign-off

```bash
git log <base>..HEAD --format='%h %s%n%(trailers:key=Signed-off-by)'
```

Every commit needs a `Signed-off-by:` trailer. If missing, re-commit with
`--signoff` (or `git rebase` adding sign-off) before continuing.

### 3. Validate locally

Invoke the **check-standards** skill (prettier + eslint on changed files, then
`yarn test:jest_ui`). Do not proceed to "Ready for review" until it passes.

### 4. CHANGELOG entry

Add one entry under the upcoming version, in the correct section
(`Added` / `Changed` / `Fixed` / `Removed`). **The link points to the issue, not
the PR.**

> **repo-specific (wazuh-security-dashboards-plugin):** the changelog is
> [`CHANGELOG.md`](../../../CHANGELOG.md) at the repo root, grouped under a
> `## [v<x>]` heading with `### Added` / `### Changed` / `### Fixed` / `### Removed`
> subsections. A "Prior versions" list links older tags. Group with an existing
> entry if the PR continues a previously merged feature. (Many historical entries
> link to PRs; for new work, prefer the **issue** link.)

**Skip the entry entirely when:**

- The issue is from **internal-devel-requests** (internal request → no changelog).
- The PR is internal-tooling / docs-only / test-only / dependency-bump with no
  user-facing impact — add the **`no changelog`** label to the PR instead.

When unsure (and the issue is public), add an entry.

### 5. Fill the PR body

Fill the repository PR template **verbatim** (keep every heading and checklist
item exactly).

> **repo-specific (wazuh-security-dashboards-plugin):** this mirrors
> [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md).
> Read it first and keep this block in sync if the repo template changes. Put the
> screenshot/video (REQUIRED for any UI change) under `### Description`, and put
> unit/integration/manual test notes under the dedicated `### Testing` section.

```markdown
### Description
[Describe what this change achieves]

### Category
[Enhancement, New feature, Bug fix, Test fix, Refactoring, Maintenance, Documentation]

### Why these changes are required?


### What is the old behavior before changes and new behavior after changes?


### Issues Resolved
[List any issues this PR will resolve (Is this a backport? If so, please add backport PR # and/or commits #)]

### Testing
[Please provide details of testing done: unit testing, integration testing and manual testing]

### Check List
- [ ] New functionality includes testing
- [ ] New functionality has been documented
- [ ] Commits are signed per the DCO using --signoff

By submitting this pull request, I confirm that my contribution is made under the terms of the Apache 2.0 license.
For more information on following Developer Certificate of Origin and signing off your commits, please check [here](https://github.com/opensearch-project/OpenSearch/blob/main/CONTRIBUTING.md#developer-certificate-of-origin).
```

Fill each section with real content; check the boxes that genuinely apply. For
**Issues Resolved**: public issue → closing keyword (`closes`, `fixes`, `fix`)
with `#<n>` or the full issue URL; **internal-devel-requests issue → leave the
section empty** (see "Issue source" above).

**Default deliverable — pre-flight report.** Unless the user asked you to create the
PR, stop here and output the filled body plus this report for the human to act on:

```
PR pre-flight
- Feature branch: <name>
- Suggested base: <version-branch>   (confirm before creating)
- Commits DCO-signed: yes / no (missing: <hashes>)
- check-standards: PASS / FAIL (<summary>)
- Issue source: public (<url>) / internal-devel-requests (link withheld)
- CHANGELOG: entry added (links to issue) / not needed (internal / `no changelog`)
- UI change: yes → evidence attached? / no
- Command to open it: gh pr create --draft --base <base> ...
```

### 6. Create as Draft — only when explicitly asked

```bash
gh pr create --draft \
  --base <version-branch> \
  --title "<Imperative, capitalized subject>" \
  --body "$(cat <<'EOF'
### Description
...
EOF
)"
```

### 7. Mark Ready for review — only when explicitly asked

Only after check-standards passes and evidence is attached:

```bash
gh pr ready <pr-number-or-url>
```

Then move the linked issue to "Pending review". Prefer **squash merge** for
single-purpose PRs.

## Notes

- Do not force-push shared branches; to address review feedback, push new commits
  and re-request review.
- Do not weaken auth/CSP/security and never commit secrets.
