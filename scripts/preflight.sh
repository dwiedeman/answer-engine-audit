#!/bin/sh
# preflight.sh — configuration-presence check. NEVER expands or prints credential values.
# Usage: scripts/preflight.sh
# Output: one JSON object on stdout. Exit 0 = ready for paid checks, 1 = not ready.

has_env_value() {
  # Presence check without expanding the value into output.
  eval "v=\${$1:-}"
  [ -n "$v" ] && echo "true" || echo "false"
}

NODE_OK=false
NODE_VERSION=""
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node --version 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/^v//' | cut -d. -f1)
  [ "${NODE_MAJOR:-0}" -ge 20 ] && NODE_OK=true
fi

DFS_LOGIN=$(has_env_value DATAFORSEO_LOGIN)
DFS_PASS=$(has_env_value DATAFORSEO_PASSWORD)

READY=false
[ "$NODE_OK" = "true" ] && [ "$DFS_LOGIN" = "true" ] && [ "$DFS_PASS" = "true" ] && READY=true

cat <<JSON
{
  "ready": $READY,
  "credential_check": "configuration_presence_only",
  "note": "a configured credential may still fail live authentication",
  "tools": { "node": $NODE_OK, "node_version": "${NODE_VERSION}" },
  "credentials_configured": { "dataforseo_login": $DFS_LOGIN, "dataforseo_password": $DFS_PASS }
}
JSON

[ "$READY" = "true" ] && exit 0 || exit 1
