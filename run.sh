#!/usr/bin/env bash
# run.sh — the project's entry points. Run ./init.sh once first.
#   ./run.sh              backend (uvicorn :8000, reload) + frontend (vite :5173) together (default)
#   ./run.sh backend      backend only · docs at http://127.0.0.1:8000/docs
#   ./run.sh frontend     frontend only
#   ./run.sh build        production build of the frontend (frontend/dist/)
#   ./run.sh test [...]   full check suite (delegates to ./test.sh)
#   ./run.sh lint         ruff + black --check on backend/, eslint on frontend/
#   ./run.sh format       ruff --fix + black on backend/
#   ./run.sh type-check   mypy --strict on backend/
#   ./run.sh help
set -euo pipefail
cd "$(dirname "$0")"

VENV=venv
PY="$VENV/bin/python"
PORT="${PORT:-8000}"

cmd="${1:-dev}"
[ $# -gt 0 ] && shift

case "$cmd" in
    help|-h|--help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac
[ -x "$PY" ] || { echo "No $VENV/: run ./init.sh first" >&2; exit 1; }
# shellcheck disable=SC1091
if [ -f .env ]; then set -a; . ./.env; set +a; fi

case "$cmd" in
    dev)
        [ -d frontend/node_modules ] || { echo "No frontend/node_modules/: run ./init.sh first" >&2; exit 1; }
        "$PY" -m uvicorn backend.src.main:app --host 127.0.0.1 --port "$PORT" --reload &
        backend_pid=$!
        trap 'kill "$backend_pid" 2>/dev/null' EXIT
        echo "backend http://127.0.0.1:$PORT (docs at /docs) · frontend http://localhost:5173"
        (cd frontend && npm run dev)
        ;;
    backend)    exec "$PY" -m uvicorn backend.src.main:app --host 127.0.0.1 --port "$PORT" --reload ;;
    frontend)   cd frontend && exec npm run dev ;;
    build)      cd frontend && exec npm run build ;;
    test)       exec ./test.sh "$@" ;;
    lint)
        "$PY" -m ruff check backend/
        "$PY" -m black --check backend/
        (cd frontend && npm run lint)
        ;;
    format)
        "$PY" -m ruff check --fix backend/
        "$PY" -m black backend/
        ;;
    type-check) exec "$PY" -m mypy --strict --ignore-missing-imports --explicit-package-bases backend/src backend/tests ;;
    *)
        echo "Unknown command: $cmd" >&2
        sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//' >&2
        exit 2
        ;;
esac
