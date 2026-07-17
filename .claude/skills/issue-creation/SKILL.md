---
name: issue-creation
description: Create a well-formed GitHub issue in a Wazuh Dashboard repo — pick the right issue template, run an issue-first duplicate check, and produce a ready-to-file body with the template's default labels. Use when the user asks to create, open, file, or draft an issue.
---

# Create a Wazuh Dashboard issue

Pick the right issue template, check for duplicates first, then fill the
template verbatim and hand off a ready-to-file body.

## Workflow

Copy this checklist and track progress:

- [ ] 1. Classify intent → choose issue template (ask only if ambiguous)
- [ ] 2. Issue-first check: search existing issues for duplicates
- [ ] 3. Fill the chosen .github/ISSUE_TEMPLATE/*.md verbatim
- [ ] 4. Keep the template's default labels; add a triage label only if named
- [ ] 5. Emit the ready-to-file body + report (default stop; gh issue create only if asked)

### 1. Classify intent → choose template

This repo has **three** issue templates plus a blank-issue path:

| Intent | Template | Labels claimed in the template's frontmatter |
|--------|----------|--------|
| Something is broken / unexpected behavior | [`bug_report.md`](../../../.github/ISSUE_TEMPLATE/bug_report.md) | `bug, untriaged` |
| New capability / improvement request | [`feature_request.md`](../../../.github/ISSUE_TEMPLATE/feature_request.md) | `enhancement, untriaged` |
| Track UI compatibility with an upcoming OpenSearch version | [`compatibility_request.md`](../../../.github/ISSUE_TEMPLATE/compatibility_request.md) | `request/operational, level/task, type/maintenance` |
| Doesn't fit any template (question, discussion, one-off) | Blank issue (allowed — see step 4) | none |

Ask the user only if the intent is genuinely ambiguous between bug and feature.

### 2. Issue-first duplicate check

Before drafting, search for an existing issue covering the same problem:

```bash
gh issue list --repo wazuh/wazuh-security-dashboards-plugin --search "<keywords>"
gh search issues "<keywords>" --repo wazuh/wazuh-security-dashboards-plugin
```

If a likely duplicate exists, surface it and ask whether to comment there instead
of filing a new issue.

### 3. Fill the template

Read the chosen file under
[`.github/ISSUE_TEMPLATE/`](../../../.github/ISSUE_TEMPLATE/) first and fill it
**verbatim** — every heading/question exactly as written, no invented sections,
no inlining a paraphrased copy here. `bug_report.md` and `feature_request.md`
use bolded questions (not `###` headings); `compatibility_request.md` uses `##`
headings and a checklist — match whichever the chosen template actually uses.

### 4. Labels — keep template defaults, no invented labels/workflow

- Apply **exactly** the labels the chosen template lists in its frontmatter —
  do not add, rename, or invent labels/workflow states.
- **Label discrepancy (spot-checked with `gh label list --repo
  wazuh/wazuh-security-dashboards-plugin` on 2026-07-17 — re-run this before
  relying on it, label sets drift):** at check time the repo's real label set
  only had `type/bug` and `type/enhancement`, **not** plain `bug` or
  `enhancement`. So `bug_report.md`'s `bug` label and `feature_request.md`'s
  `enhancement` label **did not exist** in this repo — GitHub silently drops an
  unknown label when creating an issue from a template (it does not
  auto-create it), so those two templates in practice only applied
  `untriaged`. Before filing, re-run `gh label list --repo
  wazuh/wazuh-security-dashboards-plugin` to confirm the label still doesn't
  exist; tell the user about any drop, and offer to add the real `type/bug` /
  `type/enhancement` label by hand if they want the type reflected.
- `compatibility_request.md`'s three labels (`request/operational`, `level/task`,
  `type/maintenance`) **do** all exist and apply cleanly.
- **Automatic labeling:** [`.github/workflows/add-untriaged.yml`](../../../.github/workflows/add-untriaged.yml)
  adds the `untriaged` label to **every** issue on `opened`/`reopened`/`transferred`
  — including blank issues with no template. So `untriaged` always ends up
  applied regardless of which path was used.
- **Blank issues are allowed:** [`.github/ISSUE_TEMPLATE/config.yml`](../../../.github/ISSUE_TEMPLATE/config.yml)
  only sets `contact_links` (OpenSearch Community Support, AWS/Amazon Security
  vulnerability reporting) and does not set `blank_issues_enabled: false`, so the
  blank-issue option remains available in the picker alongside the three templates.

### 5. Emit ready-to-file body + report, gh issue create only if asked

Default deliverable: the filled template body plus a short report —

```
Issue pre-flight
- Template: <bug_report.md / feature_request.md / compatibility_request.md / blank>
- Labels that will actually apply: <real labels, noting any dropped/unknown ones>
- Duplicate check: no existing issue found / possible duplicate: <url>
- Command to file it: gh issue create --repo wazuh/wazuh-security-dashboards-plugin --title "..." --body-file <path> --label <...>
```

Only run `gh issue create` when the user explicitly asks you to file it.
