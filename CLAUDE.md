# CLAUDE.md

Wazuh-owned AI context for **`wazuh-security-dashboards-plugin`**. Keep it short:
this file points to the source-of-truth docs instead of duplicating them. Read the
linked doc before doing non-trivial work.

## What this repo is

A **single OpenSearch Dashboards (OSD) plugin** — the Wazuh fork of
[`opensearch-project/security-dashboards-plugin`](https://github.com/opensearch-project/security-dashboards-plugin).
It provides the **Security** UI in the Wazuh dashboard (authentication/authorization,
roles, users, permissions, tenants, audit logging, and OpenSearch Security
configuration). It is _not_ the platform — the platform is the sibling repo
`wazuh-dashboard` (an OSD fork), into which this plugin is installed under its
external `./plugins/` directory (alongside the plugins from
`wazuh-dashboard-plugins`).

- OSD id: `securityDashboards` (`opensearch_dashboards.json`); config path
  `opensearch_security`; package name `opensearch-security-dashboards`.
- Versioning: OSD base in `package.json` → `opensearchDashboards.version` (e.g.
  `3.6.0`) and `opensearch_dashboards.json` → `opensearchDashboardsVersion`;
  Wazuh version in `VERSION.json` and `package.json` → `wazuh` (e.g. `5.0.0`,
  revision `04`).
- Node/Yarn: this plugin has **no own `.nvmrc`** — it uses the toolchain of the
  `wazuh-dashboard` checkout it lives in (Node `22.22.0`, Yarn v1). Its scripts
  reference the parent checkout (`../../scripts/*`, `../../node_modules/.bin/*`),
  so it is developed **from inside `wazuh-dashboard/plugins/`**, not standalone.
- Default branch `main`; work happens on version branches (`5.0.0`, `6.0.0`, …).

## Architecture — read this before importing anything

This is one self-contained plugin. Its code splits into layers that are bundled
**separately**:

- **`public/`** — runs in the **browser** (React, EUI/OUI, `core.http`). Uses
  DOM/`window`. Holds the Security app UI (auth types, roles, users, tenants,
  permissions, audit logging config, account/tenant management).
- **`server/`** — runs in **Node.js** (Hapi routes under `/api/`, auth backends,
  session/cookie handling, cluster clients). Uses `fs`, server context, secrets.
- **`common/`** — **isomorphic** code shared by both: constants, helpers, types.
  No DOM, no Node-only APIs.

**Import rules (strict):**

1. `public/` must **never** import from `server/`, and `server/` must **never**
   import from `public/`. Putting Node code in a browser bundle (or vice-versa)
   breaks the build/runtime.
2. Both `public/` and `server/` may import from `common/`. Put anything shared in
   `common/`.
3. Cross-plugin access (e.g. to plugins from `wazuh-dashboard-plugins` or built-in
   OSD plugins) goes **layer-to-layer** (`public → other/public`,
   `server → other/server`) and only via a plugin's declared `setup()`/`start()`
   contracts + `requiredPlugins`/`optionalPlugins` in `opensearch_dashboards.json`
   — never reach into internal paths. This plugin requires `navigation` and
   `savedObjectsManagement`, and optionally `managementOverview`, `dataSource`,
   `dataSourceManagement`.

### How `public/` and `server/` communicate

They do **not** import each other — they talk over HTTP: `server/routes/*`
register endpoints (`/api/...`, validated with `@osd/config-schema`) that delegate
to auth backends / cluster clients; `public/` calls those routes via OSD
`core.http`.

### Plugin lifecycle

`setup(core, deps)` (register routes, auth handlers, UI app, services) →
`start(core, deps)` → `stop()`. Use `core.getStartServices()` in mount handlers
instead of storing `start` references as fields.

## Commands — run from inside the `wazuh-dashboard` checkout

This plugin's scripts expect to run at `wazuh-dashboard/plugins/<this-plugin>`
(they call `../../scripts/*` and `../../node_modules/.bin/*`). Bootstrap the
platform first, then run per-plugin scripts here:

```bash
# From the wazuh-dashboard root (installs deps + builds internal packages):
yarn osd bootstrap

# From this plugin's dir (wazuh-dashboard/plugins/<this-plugin>):
yarn lint                 # yarn lint:es && yarn lint:style
yarn lint:es --fix        # ESLint autofix (node ../../scripts/eslint)
yarn test:jest_ui         # UI unit suite (locally runnable)
yarn test:jest_server     # server unit suite (needs ADMIN_PASSWORD + a cluster)
yarn build                # plugin-helpers build → build/*.zip (rename_zip.js)
yarn start                # opensearch-dashboards --dev
yarn cypress:run          # Cypress E2E (also: cypress:open)
```

There is **no `yarn test:jest`** here — unit tests are split by target:
`yarn test:jest_ui` (`node ./test/run_jest_tests.js --config
./test/jest.config.ui.js`) is the locally-runnable UI suite; `yarn
test:jest_server` (`ADMIN_PASSWORD=$ADMIN_PASSWORD node ./test/run_jest_tests.js
--config ./test/jest.config.server.js`) needs an `ADMIN_PASSWORD` env var and a
running cluster, so it is **not** runnable in a plain local checkout by default.
Integration tests live under `test/jest_integration/`; a helper IdP server is
started with `yarn runIdp`.

There is **no** `format`, `lint:fix`, `typecheck`, or `knip` script here. Prettier
is driven by a local `.prettierrc` (single quotes, `es5` trailing commas, 100-col,
`bracketSpacing`); there is **no `.prettierignore`**. `tsconfig.json` extends
`../../tsconfig.json`, so typecheck manually from the parent checkout:
`../../node_modules/.bin/tsc --noEmit -p tsconfig.json`.

New `.js`/`.ts`/`.tsx` files must carry the full OpenSearch Apache 2.0 **license
header** block — the long header defined as `LICENSE_HEADER` in `.eslintrc.js` and
enforced by `@osd/eslint/require-license-header` (not the short SPDX two-liner).

### Running a local instance (Docker dev env)

This plugin has **no dev environment of its own**. The canonical way to bring up a
local Wazuh dashboard with this plugin — together with the other additional
single-plugin forks (`wazuh-dashboard-reporting`,
`wazuh-dashboard-security-analytics`, `wazuh-dashboard-notifications`,
`wazuh-dashboard-alerting`) — is the Docker dev env **owned by
`wazuh-dashboard-plugins`** (`docker/osd-dev`). Mount this repo into it with `-r`:

```bash
# from the sibling wazuh-dashboard-plugins checkout:
cd ../wazuh-dashboard-plugins/docker/osd-dev
./dev.sh up --base --server-local 0601 --indexer-local 0601 \
  -r wazuh-security-dashboards-plugin \
  -r wazuh-dashboard-notifications \
  -r wazuh-dashboard-alerting
```

- `--base` — build/run the `wazuh-dashboard` platform from source (auto-detected
  from the sibling checkout; or `--base /abs/path`).
- `--server-local <tag>` — Wazuh server-local image tag (here `0601`).
- `--indexer-local <tag>` — packaged indexer image tag.
- `-r <repo>` — mount an external plugin repo (repeatable). Shorthand resolves the
  repo by name under the sibling parent dir (the parent of this checkout); or use
  `-r name=/abs/path`. Point to the repository **ROOT**, not a subfolder.
  `--all-forks` auto-discovers and mounts all sibling forks.

Run `./dev.sh --help` for all flags. OSD comes up on `https://0.0.0.0:5601`
(admin:admin).

## Code conventions

Enforced by tooling — run the linter/formatter, don't hand-format:

- ESLint config is `.eslintrc.js` extending **`@elastic/eslint-config-kibana`** +
  `plugin:@elastic/eui/recommended`, plus `eslint-plugin-unused-imports` and
  `eslint-plugin-cypress`. Every source file needs the full OpenSearch Apache 2.0
  license header. Stylelint config is `.stylelintrc.yml`.
- **Filenames follow the upstream OpenSearch convention** (PascalCase for
  components, snake/camel elsewhere) — this differs from the kebab-case used in
  `wazuh-dashboard-plugins`. Match the surrounding upstream style when editing.
- TypeScript-first; single quotes; semicolons; Prettier from the local
  `.prettierrc` (single quotes, `es5`, 100-col, `bracketSpacing`).
- English everywhere (code, comments, commits, docs).

Husky **is** installed: `.husky/pre-commit` runs `yarn lint:es --fix` (ESLint
autofix — not lint-staged; there is no `.lintstagedrc`), so lint/format is
enforced on commit.

## Testing

- **Unit tests are colocated** as `*.test.ts` / `*.test.tsx` next to the code they
  cover. They run through `test/run_jest_tests.js` with **two Jest configs**: UI
  (`yarn test:jest_ui`, locally runnable) and server (`yarn test:jest_server`,
  needs `ADMIN_PASSWORD` + a running cluster). When you add a source file, add its
  test beside it.
- **Integration:** suite under `test/jest_integration/`; start the helper IdP
  server with `yarn runIdp`.
- **Functional:** Cypress (`test/cypress/`, `cypress.config.js`) via
  `yarn cypress:run` / `yarn cypress:open`.

## Git / PR workflow

Shared Wazuh Dashboard conventions:

- Branch names: `<type>/<issue#>-<kebab-desc>` (`fix/`, `enhancement/`, `feat/`,
  `bug/`, `change/`, `doc/`). PR base = the target **version branch**, not always
  `main` — confirm it.
- **Sign commits** (DCO `--signoff`). Imperative, capitalized subject.
- Open PRs as **Draft** (CI skips drafts); run lint + tests locally, then "Ready
  for review". Squash merge for single-purpose PRs.
- UI changes require a screenshot/video in the PR (`### Results and Evidence`
  section of the [PR template](.github/PULL_REQUEST_TEMPLATE.md)); manual
  verification steps go in `### How to Test`.
- **Changelog:** maintain [`CHANGELOG.md`](CHANGELOG.md) by hand for user-facing
  changes; entries **link to the issue, not the PR**. No entry for
  `internal-devel-requests` issues or tooling/docs/test-only PRs.
- Issues arrive as URLs and may live in another repo. Issues from
  `internal-devel-requests` are internal: don't expose their link in the PR
  (`## Description` has no issue reference) and add no CHANGELOG entry.

## Fork coexistence

Upstream is `opensearch-project/security-dashboards-plugin`. On upstream syncs,
**Wazuh content wins** and relevant upstream technical notes are folded into the
sections above. Keep this file Wazuh-owned.

## AI working rules

- Before proposing a PR: `yarn lint` + `yarn test:jest_ui` pass for the touched
  code (`yarn test:jest_server` needs `ADMIN_PASSWORD` + a cluster).
- Never weaken auth/CSP/security; never commit secrets or credentials.
- Never force-push shared branches; never commit without DCO sign-off.
- Respect the `public`/`server`/`common` import rules above — when in doubt, put
  shared code in `common/`.

## Source-of-truth docs

- [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md), [`README.md`](README.md),
  [`CONTRIBUTING.md`](CONTRIBUTING.md), [`RELEASING.md`](RELEASING.md),
  [`SECURITY.md`](SECURITY.md).
- Platform docs live in the sibling `wazuh-dashboard` repo
  (`DEVELOPER_GUIDE.md`, `src/core/CONVENTIONS.md`, `src/core/TESTING.md`).
