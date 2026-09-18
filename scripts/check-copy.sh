#!/usr/bin/env bash
# Checks the portfolio source for copy rules that the site owner enforces.
# Usage: bash scripts/check-copy.sh (or pnpm check:copy)
set -u
cd "$(dirname "$0")/.."

status=0

report() {
  local label="$1"
  local output="$2"
  if [ -n "$output" ]; then
    echo "FAIL: $label"
    echo "$output"
    echo
    status=1
  else
    echo "ok: $label"
  fi
}

files=$(find src index.html -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.html' \) -not -path 'src/components/ui/*')

report "no em or en dashes" "$(grep -nE $'\u2014|\u2013' $files || true)"
report "no comma before and/or" "$(grep -nE ', (and|or) ' $files || true)"
report "no emojis" "$(grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' $files || true)"
report "no banned words" "$(grep -niE '\b(excited|thrilled|passionate|leverage|leveraging|seamless|robust|cutting-edge|innovative|game-changing|journey|empower|elevate|unlock|delve|synergy|spearheaded|rockstar|ninja|guru|dynamic|results-driven|detail-oriented|fast-paced|revolutionize|disrupt|crafting)\b|digital experiences|bringing ideas to life|at the intersection of' $files | grep -vE '^\S+:\s*(//|\*|/\*)' || true)"

exit $status
