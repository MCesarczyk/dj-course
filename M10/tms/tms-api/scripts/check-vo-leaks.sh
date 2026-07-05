#!/usr/bin/env bash
# Guard: domain quantities (Weight, Length, Ldm) must not be unwrapped to raw
# numbers outside serialization boundaries. Unwrapping (valueInKg, valueIn(...),
# valueInMeters, valueInUnit, valueInMm) is legitimate ONLY in:
#   - repositories / read models / queries  (DB and API mapping)
#   - error classes                         (message formatting)
#   - cucumber steps                        (test input/output parsing)
#   - the value objects themselves          (shared/, ldm/ldm.ts)
# Any other hit means domain code is doing arithmetic on escaped primitives —
# hide the computation in a method of the value object instead.
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='valueInKg|valueInUnit|valueInMeters|valueInMm|valueIn\('
ALLOW='\.repository\.ts|\.readmodel\.ts|\.queries\.ts|\.errors\.ts|\.steps\.ts|in-memory/|src/shared/|ldm/ldm\.ts'

leaks=$(grep -rnE "$PATTERN" src --include='*.ts' | grep -vE "$ALLOW" || true)

if [ -n "$leaks" ]; then
  echo "❌ VO leak: domain quantity unwrapped outside a serialization boundary:"
  echo "$leaks"
  echo
  echo "Fix: express the computation as a method on the value object (Weight/Length/Ldm)."
  exit 1
fi

echo "✅ check-vo-leaks: no domain-VO leaks found."
