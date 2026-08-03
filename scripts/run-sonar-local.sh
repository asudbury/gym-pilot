#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to start the local SonarQube instance." >&2
  exit 1
fi

if ! docker compose -f docker-compose.sonar.yml ps >/dev/null 2>&1; then
  echo "Docker Compose is not available for the SonarQube setup." >&2
  exit 1
fi

echo "Starting local SonarQube instance..."
docker compose -f docker-compose.sonar.yml up -d

echo "SonarQube should be available at http://localhost:9000"
echo "Create a local token in the UI and set it in sonar-project.properties before running analysis."
