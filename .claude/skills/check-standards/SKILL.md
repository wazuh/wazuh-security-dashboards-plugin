---
name: check-standards
description: Run the same code-quality checks CI runs (Prettier format, ESLint, typecheck, and unit tests) over the current diff before pushing or marking a PR ready. Use before opening/updating a PR, when the user asks to verify standards, lint, format, or check that CI will pass.
---

# Check standards (mirror CI locally)

Runs, over the **changed files only**, the same gates CI applies on Wazuh Dashboard
PRs, so failures are caught before they burn CI minutes. Fix issues, then re-run
until clean.

The approach is generic; blocks marked **repo-specific** cover this repo's exact
commands (test runner, lint, typecheck).

## Workflow

```
- [ ] 1. Compute changed files vs the base branch
- [ ] 2. Prettier --check (autofix with --write)
- [ ] 3. ESLint (autofix with --fix)
- [ ] 4. Typecheck
- [ ] 5. Unit tests for the changed code
- [ ] 6. Report pass/fail summary
```

### 1. Compute changed files

Match how CI computes them (diff against the base branch, excluding deletions):

```bash
BASE=<version-branch>            # e.g. 5.0.0 — the PR base
git fetch origin "$BASE"
CHANGED=$(git diff --name-status --diff-filter=d "origin/$BASE"...HEAD | awk '{print $NF}')
CODE=$(echo "$CHANGED" | grep -E '\.[jt]sx?$' || true)   # js/jsx/ts/tsx only
echo "$CHANGED"
```

### 2. Prettier (format)

Check the changed files the same way CI/pre-commit would:

```bash
npx prettier $CHANGED --check --ignore-unknown
# autofix:
npx prettier $CHANGED --write --ignore-unknown
```

> **repo-specific (wazuh-security-dashboards-plugin):** this repo **has its own
> local `.prettierrc`** (`es5` trailing commas, single quotes, 100-col,
> `bracketSpacing: true`). There is **no `.prettierignore`**. Husky's
> `pre-commit` runs `yarn lint:es --fix` (ESLint autofix, not lint-staged) — run
> Prettier yourself for format checks.

### 3. ESLint

> **repo-specific (wazuh-security-dashboards-plugin):** ESLint config is
> `.eslintrc.js` (extends `@elastic/eslint-config-kibana` +
> `plugin:@elastic/eui/recommended`, plus `eslint-plugin-unused-imports` and
> `eslint-plugin-cypress`). Stylelint config is `.stylelintrc.yml`. `yarn lint`
> runs **both ESLint and Stylelint** (`yarn lint:es && yarn lint:style`). It
> enforces the full Apache 2.0 **license header** on `.js`/`.ts`/`.tsx` files
> (`@osd/eslint/require-license-header`) — new files need that block, not the
> short SPDX two-liner. Run from this plugin's dir inside
> `wazuh-dashboard/plugins/<this-plugin>`:
>
> ```bash
> yarn lint                # ESLint + Stylelint over the whole plugin
> yarn lint:es --fix       # autofix ESLint
> ```
>
> If you need to scope ESLint to changed files, `node ../../scripts/eslint $CODE`
> works too (the `@elastic/eslint-import-resolver-kibana` resolver needs the parent
> checkout's `node_modules`).

### 4. Typecheck

> **repo-specific (wazuh-security-dashboards-plugin):** there is **no `typecheck`
> script**. `tsconfig.json` extends `../../tsconfig.json`, so run it from inside
> the parent checkout:
>
> ```bash
> ../../node_modules/.bin/tsc --noEmit -p tsconfig.json
> ```

### 5. Unit tests (changed code)

> **repo-specific (wazuh-security-dashboards-plugin):** there is **no
> `yarn test:jest`**. Tests are split by target and run via
> `test/run_jest_tests.js` from inside the `wazuh-dashboard` checkout at
> `plugins/<this-plugin>`. Bootstrap once (`yarn osd bootstrap` from the
> `wazuh-dashboard` root), then:
>
> ```bash
> yarn test:jest_ui        # primary locally-runnable UI suite
> ```
>
> `yarn test:jest_server` needs `ADMIN_PASSWORD` and a running cluster — skip it
> unless that environment is available. Integration helpers live under
> `test/jest_integration/` (`yarn runIdp` starts a local IdP server). Scope for
> speed by passing a path/pattern through the underlying runner when needed.

Remember: unit tests are **colocated** (`*.test.ts` / `*.test.tsx` next to the
source). New source files should ship with their colocated test.

### 6. Report

Summarize each gate as pass/fail; if anything failed, list the offending files and
either fix them or explain what needs manual attention:

```
Prettier:  PASS
ESLint:    FAIL (2 files) → public/components/Foo/Foo.tsx, server/routes/bar.ts
Typecheck: PASS
Jest UI:   PASS
```

Only report "ready for review" once every applicable gate passes.
