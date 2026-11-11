#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR outside the project source directory}"

run_timed() {
  /usr/bin/time -p "$@"
}

run_timed mkdir -p "$CAPTURE_DIR"
run_timed node "$PROJECT_DIR/capture.mjs"
