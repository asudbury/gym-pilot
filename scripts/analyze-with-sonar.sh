#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v sonar-scanner >/dev/null 2>&1; then
  echo "sonar-scanner is not installed. Install it or use the SonarQube scanner container." >&2
  exit 1
fi

if [ ! -f sonar-project.properties ]; then
  echo "sonar-project.properties not found." >&2
  exit 1
fi

sonar-scanner
