---
name: issue-creation
description: Create a well-formed GitHub issue in a Wazuh Dashboard repo — pick the right issue template, run an issue-first duplicate check, and produce a ready-to-file body with the template's default labels. Use when the user asks to create, open, file, or draft an issue.
---

# Create a Wazuh Dashboard issue

Pick the right issue template, check for duplicates first, then fill the
template verbatim and hand off a ready-to-file body.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Classify intent → choose issue template (ask only if ambiguous)
- [ ] 2. Issue-first check: search existing issues for duplicates
- [ ] 3. Fill the chosen .github/ISSUE_TEMPLATE/*.md verbatim
- [ ] 4. Apply the real Wazuh label for the intent (`type/bug` / `type/enhancement` / `level/task`) + `untriaged`; ignore stale frontmatter labels
- [ ] 5. Emit the ready-to-file body + report (default stop; gh issue create only if asked)
```

### 1. Classify intent → choose template

Map the user's intent to a template. Ask the user only when genuinely
ambiguous between two rows.

| Intent                                                                        | Template                   | Labels (from template frontmatter)                  |
| ----------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| Something is broken / unexpected behavior                                     | `bug_report.md`            | `bug, untriaged`                                    |
| New capability / improvement request                                          | `feature_request.md`       | `enhancement, untriaged`                            |
| Track UI compatibility with an upcoming OpenSearch version                    | `compatibility_request.md` | `request/operational, level/task, type/maintenance` |
| Engineering task / improvement (not a bug, feature, or compatibility request) | `task_template.md`         | `level/task`                                        |

### 2. Issue-first duplicate check

Before drafting, search for an existing issue covering the same problem:

```bash
gh issue list --search "<keywords>"
gh search issues "<keywords>" --repo wazuh/wazuh-security-dashboards-plugin
```

On a likely match, surface it to the user and ask whether to proceed with a
new issue or comment on the existing one instead.

### 3. Fill the template

Reference the chosen file under
[`.github/ISSUE_TEMPLATE`](../../../.github/ISSUE_TEMPLATE) — read it first and
fill it verbatim; do not inline template bodies in this skill.

> **repo-specific (wazuh-security-dashboards-plugin):** `bug_report.md`'s `bug`
> label and `feature_request.md`'s `enhancement` label do not exist in this
> repo — stale, see step 4 for the real labels to apply.
> `compatibility_request.md`'s three
> labels (`request/operational`, `level/task`, `type/maintenance`) and
> `task_template.md`'s `level/task` label all exist and apply cleanly.
> [`.github/workflows/add-untriaged.yml`](../../../.github/workflows/add-untriaged.yml)
> adds the `untriaged` label to every issue on `opened`/`reopened`/`transferred`
> — including blank issues with no template — so `untriaged` always ends up
> applied regardless of which path was used. Blank issues remain enabled:
> [`.github/ISSUE_TEMPLATE/config.yml`](../../../.github/ISSUE_TEMPLATE/config.yml)
> only sets `contact_links` (OpenSearch Community Support, AWS/Amazon Security
> vulnerability reporting) and does not set `blank_issues_enabled: false`.

### 4. Labels

Several issue templates in this repo were inherited from the upstream
OpenSearch Dashboards fork and still declare stale labels in their
frontmatter (bare `bug`, `enhancement`) that don't exist as real labels here
— GitHub silently drops any label that doesn't exist instead of erroring, so
filing the template as-is can result in no type label at all. Standardize on
the real Wazuh label set instead of trusting the frontmatter verbatim:

| Intent                   | Real label to apply                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Bug / defect             | `type/bug`                                                                                                                    |
| Feature / enhancement    | `type/enhancement`                                                                                                            |
| Engineering task / chore | `level/task`                                                                                                                  |
| Every issue              | `untriaged` — applied automatically on open/reopen/transfer by `.github/workflows/add-untriaged.yml`, no manual action needed |

Do not invent labels beyond this set, and do not invent an approval workflow.

### 5. Emit the ready-to-file body + report

**Default deliverable — stop here.** Output the filled issue body plus a short
report for the human to review:

```
Issue pre-flight
- Template: <file>
- Labels: <label list>
- Duplicate check: no matches found / possible match: <issue-url>
- Command to open it: gh issue create --template <file> --label "<labels>"
```

Only run `gh issue create` when the user explicitly asks you to open the
issue.
