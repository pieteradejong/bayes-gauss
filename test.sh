#!/usr/bin/env bash
# test.sh — every check in one place. Exit 0 = all green.
# `./run.sh test` runs this script.
#
#   ./test.sh            backend: deps, ruff, black, mypy, pytest; frontend: deps, eslint, build
#   ./test.sh --quick    skip mypy and the frontend build
#   ./test.sh --ci       skip the local security gate (CI runs it in its own job)
#
# Every step runs even after an earlier failure; a summary table lists them all.
set -euo pipefail
cd "$(dirname "$0")"

QUICK=0; CI_MODE=0
for arg in "$@"; do
    case "$arg" in
        --quick) QUICK=1 ;;
        --ci) CI_MODE=1 ;;
        -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Unknown option: $arg (see ./test.sh --help)" >&2; exit 2 ;;
    esac
done

VENV=venv
PY="$VENV/bin/python"
[ -x "$PY" ] || { echo "No $VENV/: run ./init.sh first" >&2; exit 1; }

if [ -t 1 ]; then
    GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'
else
    GREEN=''; RED=''; YELLOW=''; BOLD=''; RESET=''
fi

LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/bayes-gauss-test.XXXXXX")"
trap 'rm -rf "$LOG_DIR"' EXIT

# Parallel indexed arrays (bash 3.2 has no associative arrays).
NAMES=(); RESULTS=(); SECONDS_TAKEN=()
record() { NAMES+=("$1"); RESULTS+=("$2"); SECONDS_TAKEN+=("$3"); }

# run_step <name> <command...>: runs the command, captures output, never aborts the script.
run_step() {
    local name="$1"; shift
    local log="$LOG_DIR/$name.log" start end rc
    printf '%b▶ %s%b\n' "$BOLD" "$name" "$RESET"
    start=$(date +%s)
    set +e
    ( "$@" ) > "$log" 2>&1
    rc=$?
    set -e
    end=$(date +%s)
    if [ "$rc" -eq 0 ]; then
        record "$name" PASS $((end - start))
    else
        record "$name" FAIL $((end - start))
        printf '%b  failed (exit %s) — last 40 lines:%b\n' "$RED" "$rc" "$RESET"
        tail -n 40 "$log" | sed 's/^/    /'
    fi
}

skip_step() {
    printf '%b▶ %s — skipped (%s)%b\n' "$YELLOW" "$1" "$2" "$RESET"
    record "$1" "SKIP: $2" 0
}

# --- step bodies -------------------------------------------------------------------------------

check_python() {
    "$PY" -c 'import sys; assert sys.version_info >= (3, 12, 2), sys.version; print(sys.version.split()[0])'
}

check_deps() { "$PY" -m pip check; }

check_secrets() {
    local tracked
    tracked="$(git ls-files | grep -E '(^|/)\.env(\..+)?$' | grep -vE '\.env\.(example|template)$' || true)"
    if [ -n "$tracked" ]; then
        echo "Env files with real values must never be tracked:"; echo "$tracked"; return 1
    fi
    echo "no tracked env files"
}

check_shell() {
    local f rc=0
    for f in ./*.sh; do
        bash -n "$f" || rc=1
        /bin/bash -n "$f" || rc=1   # macOS bash 3.2 — the committed-script baseline
    done
    if command -v shellcheck >/dev/null 2>&1; then
        shellcheck -S warning init.sh test.sh run.sh || rc=1
    else
        echo "shellcheck not installed — syntax-checked only (brew install shellcheck)"
    fi
    return $rc
}

check_fe_deps() {
    [ -d frontend/node_modules ] || (cd frontend && npm ci --no-fund --no-audit)
    (cd frontend && npm ls --depth=0)
}
check_fe_lint() { (cd frontend && npm run lint); }
check_fe_build() { (cd frontend && npm run build); }

check_gate() { "$HOME/dev/dotfiles/security/gate.sh" scan-tree; }

# --- steps -------------------------------------------------------------------------------------

run_step python  check_python
run_step deps    check_deps
run_step secrets check_secrets
run_step shell   check_shell
run_step lint    "$PY" -m ruff check backend/
run_step format  "$PY" -m black --check backend/
if [ "$QUICK" -eq 1 ]; then
    skip_step types "--quick"
else
    run_step types "$PY" -m mypy --strict --ignore-missing-imports --explicit-package-bases backend/src backend/tests
fi
run_step unit    "$PY" -m pytest backend/tests
run_step fe-deps check_fe_deps
run_step fe-lint check_fe_lint
if [ "$QUICK" -eq 1 ]; then
    skip_step fe-build "--quick"
else
    run_step fe-build check_fe_build
fi
if [ "$CI_MODE" -eq 1 ]; then
    skip_step gate "--ci"
elif [ -x "$HOME/dev/dotfiles/security/gate.sh" ]; then
    run_step gate check_gate
else
    skip_step gate "dotfiles security gate not installed"
fi

# --- summary -----------------------------------------------------------------------------------

echo
printf '%b%-10s %6s  %s%b\n' "$BOLD" STEP TIME RESULT "$RESET"
fail=0; i=0
while [ "$i" -lt "${#NAMES[@]}" ]; do
    case "${RESULTS[$i]}" in
        PASS) c="$GREEN" ;;
        FAIL) c="$RED"; fail=1 ;;
        *)    c="$YELLOW" ;;
    esac
    printf '%-10s %5ss  %b%s%b\n' "${NAMES[$i]}" "${SECONDS_TAKEN[$i]}" "$c" "${RESULTS[$i]}" "$RESET"
    i=$((i + 1))
done
echo
if [ "$fail" -eq 0 ]; then
    printf '%ball green%b\n' "$GREEN" "$RESET"
else
    printf '%bsome steps failed%b\n' "$RED" "$RESET"; exit 1
fi
