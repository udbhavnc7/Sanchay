#!/usr/bin/env bash
# Check the built APK artifact (not source): denylist strings absent from dex,
# single hashed web-bundle pair + index.html in assets/web.
# Usage: scripts/check-apk-artifact.sh path/to/app.apk
set -euo pipefail

APK="${1:?usage: check-apk-artifact.sh <apk>}"
command -v unzip >/dev/null || { echo "unzip required"; exit 2; }
[ -f "$APK" ] || { echo "APK not found: $APK"; exit 2; }

fail=0

# --- dex denylist -----------------------------------------------------------
DEX_TMP="$(mktemp -d)"
trap 'rm -rf "$DEX_TMP"' EXIT
unzip -o -q "$APK" 'classes*.dex' -d "$DEX_TMP" || { echo "FAIL: no classes*.dex in APK"; exit 1; }

DENY_STRINGS=(
  'crashlytics'
  'ReviewManagerFactory'
  'play-services-review'
  'upi://pay'
  'com.google.zxing'
  'SmsManager'
)
for dex in "$DEX_TMP"/classes*.dex; do
  for s in "${DENY_STRINGS[@]}"; do
    # grep -a: binary-safe fixed-string search (dex strings are ASCII/MUTF-8)
    if grep -aqF -- "$s" "$dex"; then
      echo "FAIL: denylist string '$s' present in $(basename "$dex")"
      fail=1
    fi
  done
done
[ "$fail" -eq 0 ] && echo "OK: dex denylist strings absent"

# --- web bundle invariants --------------------------------------------------
listing="$(unzip -l "$APK" | awk '{print $4}')"
count_js="$(printf '%s\n' "$listing" | grep -cE '^assets/web/assets/index-[^/]+\.js$' || true)"
count_css="$(printf '%s\n' "$listing" | grep -cE '^assets/web/assets/index-[^/]+\.css$' || true)"
has_html=0
printf '%s\n' "$listing" | grep -qx 'assets/web/index.html' && has_html=1

if [ "$count_js" -ne 1 ] || [ "$count_css" -ne 1 ] || [ "$has_html" -ne 1 ]; then
  echo "FAIL: expected exactly 1 hashed js + 1 hashed css + index.html under assets/web (got js=$count_js css=$count_css html=$has_html)"
  fail=1
else
  echo "OK: single bundle pair + index.html embedded in APK"
  printf '%s\n' "$listing" | grep -E '^assets/web/assets/index-[^/]+\.(js|css)$' | sed 's/^/    /'
fi

if [ "$fail" -ne 0 ]; then
  echo "check-apk-artifact: FAIL"
  exit 1
fi
echo "check-apk-artifact: PASS"
