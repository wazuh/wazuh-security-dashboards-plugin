#!/bin/bash
# Unit tests for tools/repository_bumper.sh (fully local, the real repo is
# never touched).
source "$(cd "$(dirname "$0")" && pwd)/test_helpers.sh"

echo "=== repository_bumper.sh ==="

# ------------------------------------------------------- argument validation
test_case "argument validation"
setup_fixture

run_tool repository_bumper.sh --help
assert_eq 0 "$STATUS" "--help exits 0"
assert_contains "$OUTPUT" "Usage:" "--help prints usage"

run_tool repository_bumper.sh
assert_eq 1 "$STATUS" "no arguments exits 1"

run_tool repository_bumper.sh --version 5.1.0
assert_eq 1 "$STATUS" "missing --stage exits 1"
assert_contains "$OUTPUT" "--stage is required" "reports stage is required"

run_tool repository_bumper.sh --stage alpha0
assert_eq 1 "$STATUS" "missing --version exits 1"
assert_contains "$OUTPUT" "--version is required" "reports version is required"

run_tool repository_bumper.sh --version 5.1 --stage alpha0
assert_eq 1 "$STATUS" "malformed version exits 1"
assert_contains "$OUTPUT" "format x.y.z" "reports version format error"

run_tool repository_bumper.sh --version 5.1.0 --stage alpha
assert_eq 1 "$STATUS" "stage without number exits 1"
assert_contains "$OUTPUT" "Stage must be alphanumeric" "reports stage format error"

run_tool repository_bumper.sh --bogus
assert_eq 1 "$STATUS" "unknown option exits 1"

assert_file_contains "$WORK/VERSION.json" '"version": "5.0.0"' \
  "VERSION.json untouched after invalid arguments"

# ------------------------------------------------------------------ full bump
test_case "full version bump (5.0.0 -> 5.1.0)"
setup_fixture
run_tool repository_bumper.sh --version 5.1.0 --stage alpha0
assert_eq 0 "$STATUS" "exits 0"
assert_contains "$OUTPUT" "Repository bump completed successfully" "reports success"

assert_file_contains "$WORK/VERSION.json" '"version": "5.1.0"' "VERSION.json version"
assert_file_contains "$WORK/VERSION.json" '"stage": "alpha0"' "VERSION.json stage"

assert_file_contains "$WORK/package.json" '"version": "5.1.0"' "package.json: wazuh.version bumped"
assert_file_contains "$WORK/package.json" '"revision": "00"' "package.json: revision reset to 00"
assert_file_contains "$WORK/package.json" '"version": "3.6.0.0"' \
  "top-level package.json version (OpenSearch Dashboards template) is NOT touched"

assert_file_contains "$WORK/CHANGELOG.md" "## [v5.1.0]" "CHANGELOG reset to the new version"
assert_file_not_contains "$WORK/CHANGELOG.md" "Some existing feature entry" "old entries removed"
assert_eq "$(expected_priors 5.0.0 4.10.2 4.10.1 4.10.0)" "$(prior_versions_block)" \
  "Prior versions rebuilt with the last 2 minors below the new version"

WF="$WORK/.github/workflows/dev-environment.yml"
assert_file_contains "$WF" "default: 5.1.0" "workflow: main default replaced with new version"
assert_file_not_contains "$WF" "default: main" "workflow: no main default left"

# ------------------------------------ same version, new stage (revision bump)
test_case "same version + new stage increments the revision"
setup_fixture
run_tool repository_bumper.sh --version 5.0.0 --stage beta1
assert_eq 0 "$STATUS" "exits 0"
assert_file_contains "$WORK/VERSION.json" '"version": "5.0.0"' "version kept"
assert_file_contains "$WORK/VERSION.json" '"stage": "beta1"' "stage updated"
assert_file_contains "$WORK/package.json" '"revision": "03"' "package.json: revision 02 -> 03"
assert_file_contains "$WORK/CHANGELOG.md" "Some existing feature entry" \
  "CHANGELOG entries preserved (sync only)"

# --------------------------------------- same version, same stage (no-op rev)
test_case "same version + same stage keeps the revision"
setup_fixture
run_tool repository_bumper.sh --version 5.0.0 --stage alpha0
assert_eq 0 "$STATUS" "exits 0"
assert_file_contains "$WORK/package.json" '"revision": "02"' "package.json: revision kept at 02"

# ------------------------------------------------------------------ downgrade
test_case "version downgrade rejected"
setup_fixture
run_tool repository_bumper.sh --version 4.9.0 --stage alpha0
assert_eq 1 "$STATUS" "exits 1"
assert_contains "$OUTPUT" "cannot be lower" "reports it cannot be lower"
assert_file_contains "$WORK/VERSION.json" '"version": "5.0.0"' "VERSION.json untouched"

# -------------------------------------------------------------- tag with stage
test_case "--tag with --stage"
setup_fixture
run_tool repository_bumper.sh --tag --stage rc1
assert_eq 0 "$STATUS" "exits 0"
assert_file_contains "$WORK/VERSION.json" '"version": "5.0.0"' "version unchanged"
assert_file_contains "$WORK/VERSION.json" '"stage": "rc1"' "stage updated to rc1"
assert_file_contains "$WORK/package.json" '"revision": "03"' \
  "package.json: revision incremented on stage change"
WF="$WORK/.github/workflows/dev-environment.yml"
assert_file_contains "$WF" "default: v5.0.0-rc1" "workflow: tag ref with stage"
assert_file_contains "$WORK/CHANGELOG.md" "Some existing feature entry" \
  "CHANGELOG entries preserved in tag mode"
assert_eq "$(expected_priors 4.10.2 4.10.1 4.10.0 4.9.1 4.9.0)" "$(prior_versions_block)" \
  "Prior versions resynced below the current version in tag mode"

# ---------------------------------------------------------------- stageless tag
test_case "--tag without stage (stageless)"
setup_fixture
run_tool repository_bumper.sh --tag
assert_eq 0 "$STATUS" "exits 0"
assert_file_contains "$WORK/package.json" '"revision": "02"' "package.json: revision kept"
assert_file_contains "$WORK/VERSION.json" '"stage": "alpha0"' "stage unchanged"
WF="$WORK/.github/workflows/dev-environment.yml"
assert_file_contains "$WF" "default: v5.0.0" "workflow: stageless tag ref"

# ----------------------------------------------------------------- set-as-main
test_case "--set-as-main leaves branch refs untouched"
setup_fixture
run_tool repository_bumper.sh --set-as-main --version 5.1.0 --stage alpha0
assert_eq 0 "$STATUS" "exits 0"
WF="$WORK/.github/workflows/dev-environment.yml"
assert_file_contains "$WF" "default: main" "workflow: defaults still main"
assert_file_contains "$WORK/VERSION.json" '"version": "5.1.0"' "version is still bumped"
assert_file_contains "$WORK/package.json" '"version": "5.1.0"' "package.json is still bumped"

summary
