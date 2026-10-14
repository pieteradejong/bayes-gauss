#!/usr/bin/env bash
# init.sh — everything needed to work on bayes-gauss: a Python 3.12+ venv with the pinned backend
# dependencies, frontend/node_modules, and .env from .env.example. Idempotent: a second run reuses
# venv/ and frontend/node_modules/.
#   ./init.sh            set up (or refresh) backend and frontend
#   ./init.sh --clean    rebuild venv/ and frontend/node_modules/ from scratch
set -euo pipefail
cd "$(dirname "$0")"

CLEAN=0
case "${1:-}" in
    -h|--help) sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    --clean) CLEAN=1 ;;
    '') ;;
    *) echo "Unknown option: $1 (see ./init.sh --help)" >&2; exit 2 ;;
esac

VENV=venv
PY="$VENV/bin/python"

# pyproject.toml: requires-python >= 3.12.2; CI, black and mypy target 3.12, so prefer it.
pick_python() {
    local p
    for p in python3.12 python3.13 python3.14 python3; do
        command -v "$p" >/dev/null 2>&1 || continue
        if "$p" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12, 2) else 1)' 2>/dev/null; then
            echo "$p"; return 0
        fi
    done
    return 1
}

if [ "$CLEAN" -eq 1 ]; then
    echo "== clean: removing $VENV/ and frontend/node_modules/"
    rm -rf "$VENV" frontend/node_modules
fi

echo "== python"
if [ -x "$PY" ]; then
    echo "reusing $VENV/ ($("$PY" --version))"
else
    PYTHON="$(pick_python)" || { echo "Python 3.12.2+ required (brew install python@3.12)" >&2; exit 1; }
    echo "creating $VENV/ with $PYTHON ($("$PYTHON" --version))"
    "$PYTHON" -m venv "$VENV"
fi

echo "== backend dependencies (backend/requirements.txt, pinned)"
"$PY" -m pip install --quiet --disable-pip-version-check -r backend/requirements.txt

echo "== .env"
if [ -f .env ]; then
    echo ".env present"
else
    (umask 077 && cp .env.example .env)
    echo "created .env from .env.example"
fi

echo "== frontend dependencies"
command -v npm >/dev/null 2>&1 || { echo "npm (Node 20.19+) required" >&2; exit 1; }
if [ -d frontend/node_modules ]; then
    echo "reusing frontend/node_modules/"
else
    (cd frontend && npm ci --no-fund --no-audit)
fi

echo "ready: ./run.sh (backend :8000 + frontend :5173) · ./test.sh · ./run.sh help"
