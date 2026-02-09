#!/bin/bash
# End-to-end test for the report generation and retrieval flow
# Tests the FULL chain: submit assessment → get reportUrl → fetch report page → verify report loads

BASE_URL="${1:-https://www.upclicklabs.com}"
TOTAL_TESTS=10
PASS=0
FAIL=0
ERRORS=()

# Test URLs to analyze (small, fast-loading sites)
TEST_URLS=(
  "https://example.com"
  "https://google.com"
  "https://github.com"
  "https://wikipedia.org"
  "https://apple.com"
  "https://stripe.com"
  "https://vercel.com"
  "https://nextjs.org"
  "https://tailwindcss.com"
  "https://react.dev"
)

echo "=================================================="
echo "  REPORT FLOW E2E TEST"
echo "  Base URL: $BASE_URL"
echo "  Tests: $TOTAL_TESTS"
echo "=================================================="
echo ""

for i in $(seq 0 $((TOTAL_TESTS - 1))); do
  TEST_NUM=$((i + 1))
  TEST_URL="${TEST_URLS[$i]}"
  echo "--- Test $TEST_NUM / $TOTAL_TESTS: $TEST_URL ---"

  # Step 1: Submit assessment
  echo "  [1/4] Submitting assessment..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/assess" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test User $TEST_NUM\",\"url\":\"$TEST_URL\",\"email\":\"test${TEST_NUM}@example.com\"}" \
    --max-time 90)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" != "200" ]; then
    echo "  ✗ FAIL: API returned HTTP $HTTP_CODE"
    echo "  Body: $(echo "$BODY" | head -c 200)"
    FAIL=$((FAIL + 1))
    ERRORS+=("Test $TEST_NUM ($TEST_URL): API returned HTTP $HTTP_CODE")
    echo ""
    continue
  fi

  # Step 2: Extract reportUrl from response
  REPORT_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('reportUrl',''))" 2>/dev/null)
  SUCCESS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null)

  if [ "$SUCCESS" != "True" ] || [ -z "$REPORT_URL" ]; then
    echo "  ✗ FAIL: No reportUrl in response"
    echo "  Body: $(echo "$BODY" | head -c 300)"
    FAIL=$((FAIL + 1))
    ERRORS+=("Test $TEST_NUM ($TEST_URL): No reportUrl in API response")
    echo ""
    continue
  fi

  echo "  [2/4] Got reportUrl: $(echo "$REPORT_URL" | head -c 100)..."

  # Step 3: Check if the report URL has a ?b= param (new architecture)
  HAS_BLOB_PARAM="no"
  if echo "$REPORT_URL" | grep -q "?b="; then
    HAS_BLOB_PARAM="yes"
    echo "  [3/4] ✓ Has direct blob URL param (?b=)"
  elif echo "$REPORT_URL" | grep -q "?id="; then
    echo "  [3/4] ⚠ Has old-style ?id= param (middleman API)"
  else
    echo "  [3/4] ⚠ Unknown URL format"
  fi

  # Step 4: Extract blob URL and fetch it directly (simulating what the client does)
  if [ "$HAS_BLOB_PARAM" = "yes" ]; then
    # Extract the ?b= parameter value
    BLOB_URL_ENCODED=$(echo "$REPORT_URL" | sed 's/.*?b=//' | sed 's/&.*//')
    BLOB_URL=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$BLOB_URL_ENCODED'))" 2>/dev/null)

    if [ -z "$BLOB_URL" ]; then
      echo "  ✗ FAIL: Could not decode blob URL"
      FAIL=$((FAIL + 1))
      ERRORS+=("Test $TEST_NUM ($TEST_URL): Could not decode blob URL from reportUrl")
      echo ""
      continue
    fi

    echo "  [4/4] Fetching blob directly: $(echo "$BLOB_URL" | head -c 80)..."
    BLOB_RESPONSE=$(curl -s -w "\n%{http_code}" "$BLOB_URL" --max-time 10)
    BLOB_HTTP=$(echo "$BLOB_RESPONSE" | tail -1)
    BLOB_BODY=$(echo "$BLOB_RESPONSE" | head -n -1)

    if [ "$BLOB_HTTP" = "200" ]; then
      # Verify it's valid JSON with expected fields
      HAS_SCORES=$(echo "$BLOB_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'scores' in d and 'url' in d else 'no')" 2>/dev/null)
      if [ "$HAS_SCORES" = "yes" ]; then
        SCORE=$(echo "$BLOB_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['scores']['overall'])" 2>/dev/null)
        echo "  ✓ PASS: Report loaded (score: $SCORE)"
        PASS=$((PASS + 1))
      else
        echo "  ✗ FAIL: Blob returned 200 but invalid report JSON"
        FAIL=$((FAIL + 1))
        ERRORS+=("Test $TEST_NUM ($TEST_URL): Blob returned invalid JSON")
      fi
    else
      echo "  ✗ FAIL: Blob fetch returned HTTP $BLOB_HTTP"
      FAIL=$((FAIL + 1))
      ERRORS+=("Test $TEST_NUM ($TEST_URL): Blob fetch HTTP $BLOB_HTTP")
    fi
  else
    echo "  [4/4] Skipping direct blob test (old URL format)"
    echo "  ⚠ SKIP: Old architecture URL"
    FAIL=$((FAIL + 1))
    ERRORS+=("Test $TEST_NUM ($TEST_URL): Old architecture URL without ?b= param")
  fi

  echo ""

  # Small delay between tests to avoid rate limiting
  sleep 2
done

echo "=================================================="
echo "  RESULTS"
echo "=================================================="
echo "  Passed: $PASS / $TOTAL_TESTS"
echo "  Failed: $FAIL / $TOTAL_TESTS"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "  FAILURES:"
  for err in "${ERRORS[@]}"; do
    echo "    - $err"
  done
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "  🎯 ALL TESTS PASSED"
else
  echo "  ⚠ SOME TESTS FAILED"
fi
echo "=================================================="
