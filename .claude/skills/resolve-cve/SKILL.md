---
name: resolve-cve
description: Resolve a dependency CVE in the Wazuh Dashboard security plugin — confirm the vulnerable package is actually present and reachable, apply the least-invasive remediation (direct bump, lockfile dedupe, or scoped resolution), verify build/tests/audit, and hand off a prepared PR. Use when the user asks to fix or resolve a CVE / dependency vulnerability, or provides a CVE id or CVE issue URL.
---

# Resolve a dependency CVE

Remediation flow for a dependency vulnerability. Pairs with **analyze-dashboard-vuln**
(triage/verdict + issue drafting) — use that first if it's not yet confirmed the
repo is affected. This skill assumes remediation is wanted.

Optional input: a `CVE-XXXX-XXXXX` id or a CVE issue URL. Without one, look up open
CVE issues and ask which to resolve.

> **repo-specific (wazuh-security-dashboards-plugin):** this is a **single OSD
> plugin** with **one `package.json` + one `yarn.lock`** at the repo root. Forced
> versions live in the root `resolutions` block. It is developed **inside the
> `wazuh-dashboard` checkout** at `plugins/<this-plugin>` and bootstrapped with the
> platform (`yarn osd bootstrap` from the `wazuh-dashboard` root); its scripts
> reference `../../node_modules/.bin/*`. See [`CLAUDE.md`](../../../CLAUDE.md).

## Workflow

```
- [ ] 1. Identify the CVE (package, vulnerable range, safe version, severity)
- [ ] 2. Verify presence + reachability in this plugin
- [ ] 3. Remediate with the least-invasive strategy that works
- [ ] 4. Verify (install + tests + audit; vulnerable version gone)
- [ ] 5. Write a report to tmp/ and deliver via create-pr (prepare mode)
```

### 1. Identify

Read the CVE. If given an issue URL: `gh issue view <url>`. Extract: affected
package, vulnerable version range, recommended safe version, severity, and the
GHSA if present. If you cannot confirm whether the repo is truly affected, run
**analyze-dashboard-vuln** to get the reachability verdict before changing code.

### 2. Verify presence + reachability

Check the package is really installed and why:

```bash
grep -n '"<package>"' package.json           # declared as a direct dep?
grep -n '<package>@' yarn.lock | head        # resolved versions in the lockfile
yarn why <package>                            # dependency chain (run in the checkout)
```

If **every** path is a `devDependency` / build-test tool (cypress, jest, etc.) or
a non-runtime transitive, the repo is effectively **not affected** — prefer
documenting that (via analyze-dashboard-vuln) over forcing a change. Remediate
only when a **runtime** path pulls the vulnerable version.

### 3. Remediate (least invasive first)

Back up first: `cp package.json package.json.bak && cp yarn.lock yarn.lock.bak`.
Try strategies in order:

- **A — Direct bump.** If the package is declared in `package.json`, set it to the
  safe version and re-run `yarn`.
- **B — Lockfile dedupe.** If it's transitive, remove its entries from `yarn.lock`
  and re-run `yarn` so it regenerates to a patched version.
- **C — Parent bump.** If a peer/parent constraint pins the old version, bump the
  parent dependency, then retry B.
- **D — Scoped resolution (last resort).** Add to the root `resolutions` using the
  **narrowest** path (`"**/<parent>/<package>": "<safe>"`), never a global
  override. Document why and which chain required it.

Only change versions; never remove a required dependency; follow semver; never
leave the repo in a broken state (restore the `.bak` files on failure).

### 4. Verify

> **repo-specific:** run from inside the `wazuh-dashboard` checkout at
> `plugins/<this-plugin>`:
>
> ```bash
> yarn                         # reinstall against the updated manifest/lockfile
> yarn test:jest_ui            # primary locally-runnable suite (no yarn test:jest)
> ```
>
> `yarn test:jest_server` needs `ADMIN_PASSWORD` and a running cluster — run it
> only when that environment is available. Then confirm the vulnerable version is
> gone (`yarn why <package>` / grep the lockfile) and check for new advisories
> (`yarn audit`).

If any source code was touched, also run the **check-standards** skill. Remove the
`.bak` files once verification passes.

### 5. Report + deliver

Write a short report to `tmp/cve-<id>.md` (strategy used, the changes,
dependency-chain evidence, verification results — or, on failure, strategies tried
and recommended manual steps). `tmp/` is git-ignored in this repo.

Then invoke **create-pr** in its default prepare-and-hand-off mode. It applies the
shared rules automatically:

- Base = the version branch the work started from (not always `main`).
- CVE issues usually live in **`internal-devel-requests`** → `## Description`
  has no issue reference and **no CHANGELOG entry**. If the CVE issue is public,
  use `Closes` in `## Description` and add a CHANGELOG entry (under
  `Fixed`/`Changed`) linking the **issue**.
- Commits DCO-signed.

Suggested PR title: `Fix <CVE-id>: bump <package> to <safe-version>`.

## Success criteria

1. No runtime path resolves the vulnerable version anymore.
2. `yarn` install and `yarn test:jest_ui` pass (in the checkout).
3. No new advisories introduced for the resolved package.
4. Report in `tmp/`, and a prepared PR (via create-pr) following repo conventions.
