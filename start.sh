#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$PROJECT_DIR"
: "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must point to the worker metadata directory}"
PORT="${PORT:-3000}"
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
  echo "PORT must be an integer from 1 to 65535." >&2
  exit 1
fi

run_timed() {
  /usr/bin/time -p "$@"
}

# This static project has no package manifest or external dependencies.
# If one is added later, install its dependencies before building.
if [[ -f package.json ]]; then
  run_timed npm install --no-audit --no-fund
fi

# Build the deployable static site entirely inside the project directory.
run_timed rm -rf "$PROJECT_DIR/dist"
run_timed mkdir -p "$PROJECT_DIR/dist"
run_timed cp -R "$PROJECT_DIR/index.html" "$PROJECT_DIR/styles.css" "$PROJECT_DIR/js" "$PROJECT_DIR/dist/"

run_timed mkdir -p "$OPENCODE_WEB_DIR"
run_timed node -e 'const fs=require("node:fs"); const path=require("node:path"); fs.writeFileSync(path.join(process.argv[2],"deployment-output.json"),JSON.stringify({project:process.argv[1],directory:path.join(process.argv[1],"dist")}));' "$PROJECT_DIR" "$OPENCODE_WEB_DIR"

# Keep the preview server in the foreground for the runtime controller.
run_timed python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$PROJECT_DIR/dist"
