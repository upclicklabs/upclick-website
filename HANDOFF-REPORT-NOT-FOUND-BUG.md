# BUG FIX: "Report Not Found" After AEO Assessment

## Problem
After submitting the free AEO assessment tool, users see **"Report Not Found"** instead of their report. This is a **critical bug** — the assessment runs successfully but the report page can't load the data.

## Root Cause Analysis

The report URL system has two modes:
1. **Short ID mode** (`?id=abc123`) — fetches from `/api/reports` GET endpoint which uses an **in-memory Map** (`lib/assessment/apis/reports/route.ts` line 6). This fails on Vercel because serverless functions are stateless — the Map is empty on the next invocation.
2. **Compressed URL mode** (`?d=<LZ-compressed-data>`) — embeds the full report data in the URL via LZ-string compression. This is self-contained and works on Vercel.

### What's happening now:
- `app/api/assess/route.ts` (lines 128-136) generates a compressed URL via `generateReportUrl()` from `lib/report-url.ts`
- The URL uses `?d=` parameter with LZ-compressed report data
- **BUT** the report page (`app/report/[slug]/page.tsx` lines 173-227) checks for `?id=` FIRST, and only falls back to `?d=` if no `id` param exists
- The compressed URL may be **too long** (URL length limit ~8,000 chars in browsers, ~2,000 in older systems) because the new assessment generates much more data (more strengths, more recommendations, more checks)

### The likely issue:
The compressed report data in the `?d=` parameter may exceed URL length limits, causing the URL to be truncated or the LZ decompression to fail silently, returning `null` from `decodeReport()` at line 207.

## Files Involved

### Critical files to fix:
| File | Role |
|------|------|
| `app/api/assess/route.ts` | Generates the report URL (lines 122-136) |
| `app/report/[slug]/page.tsx` | Loads and displays the report (lines 167-227) |
| `lib/report-url.ts` | Encodes/decodes report to/from compressed URL strings |
| `app/api/reports/route.ts` | In-memory store (currently broken on Vercel serverless) |

### Supporting context files:
| File | Role |
|------|------|
| `lib/email-templates.ts` | `AEOReport` interface definition (lines 30-69) |
| `lib/assessment/index.ts` | Main analyzer orchestrator — returns the full report |
| `lib/assessment/types.ts` | Detail types: TechnicalDetails, ContentDetails, etc. |
| `components/forms/assessment-form.tsx` | Frontend form, receives `reportUrl` and opens it |

## What Changed in This Session

### New Assessment Module (`lib/assessment/`)
Replaced monolithic `lib/aeo-analyzer.ts` (1,753 lines, regex-based) with modular Cheerio + API-based system:

- **16 new files** created in `lib/assessment/`
- **Cheerio DOM parsing** replaces regex for HTML analysis
- **@mozilla/readability** for main content extraction
- **7 external API integrations** running in parallel via `Promise.allSettled`:
  - Google PageSpeed Insights (performance, accessibility, CWV)
  - SSL certificate validation
  - Sitemap.xml, robots.txt, llms.txt direct checks
  - Google Knowledge Graph entity search
  - Reddit brand mention search
- **New scoring checks**: readability (Flesch), image alt coverage, section density, data points, tag manager, CRM, heatmaps, cookie consent, A/B testing
- **Scoring weights**: Content 30%, Technical 25%, Authority 25%, Measurement 20%
- **Check totals**: Content 16, Technical 14, Authority 17, Measurement 11

### `AEOReport` Interface Changes (`lib/email-templates.ts`)
Added 4 optional detail fields to the interface:
- `technicalDetails?` — PSI scores, CWV, SSL, sitemap, robots, llms.txt, AI bot crawlability
- `contentDetails?` — readability, word count, image alt coverage, section density, data points
- `authorityDetails?` — Knowledge Graph, Reddit mentions, social platforms, citations
- `measurementDetails?` — analytics tools, tag manager, CRM, heatmaps, cookie consent, A/B testing

### Report Page Update (`app/report/[slug]/page.tsx`)
Added new "Analysis Details" section (lines 651-946) displaying the detail fields in a 2x2 grid with color-coded values.

### assess/route.ts Changes
- Import changed from `@/lib/aeo-analyzer` to `@/lib/assessment`
- Added `maxDuration = 60` for Vercel
- Switched from in-memory store to compressed URL approach
- Strips detail fields before URL encoding (lines 130-134) to reduce URL size
- Redacted sensitive data from logs

## Recommended Fix Strategy

### Option A: Fix the Compressed URL Approach (Quick Fix)
The `toMinimal()` function in `lib/report-url.ts` (lines 27-68) already strips the report down to minimal format. But the new assessment generates **many more strengths and recommendations** than before, which may push the compressed URL over length limits.

**Debug steps:**
1. Add `console.log("Report URL length:", reportUrl.length)` in `assess/route.ts` after line 135
2. Check Vercel function logs to see the actual URL length
3. If > 8,000 chars, reduce data: limit strengths to 5, recommendations to 3 per pillar

**Fix in `lib/report-url.ts` `toMinimal()`:**
- Currently limits strengths to 8 (line 39) — may need to reduce to 5
- Recommendations have no limit — add `.slice(0, 3)` per pillar
- Truncate long description strings

### Option B: Persistent Storage (Proper Fix)
Replace the in-memory Map in `app/api/reports/route.ts` with actual persistent storage:
- **Vercel KV (Redis)** — free tier, 256MB, perfect for this
- **Vercel Blob** — store report JSON as blob files
- **Supabase** — free tier PostgreSQL

This would allow short `?id=` URLs that always work.

### Option C: Hybrid Approach (Recommended)
1. Try compressed URL first (for self-contained sharing)
2. If URL length > 4,000 chars, fall back to Vercel KV storage with short ID
3. Report page already handles both `?d=` and `?id=` params

## Environment Variables
```
PAGESPEED_API_KEY=<set in .env and Vercel>
GOOGLE_KNOWLEDGE_GRAPH_KEY=<set in .env and Vercel>
RESEND_API_KEY=<existing>
GOOGLESHEETS_WEBHOOK_URL=<existing>
```

## Key Dependencies Added
```
cheerio, @mozilla/readability, jsdom, @types/jsdom (dev), text-readability, ssl-checker, lz-string (existing)
```

## How to Debug

1. Run locally: `npm run dev`
2. Submit assessment for any URL
3. Check terminal for:
   - `"Report URL generated:"` — see the URL length
   - Any errors from `analyzeWebsite()`
4. Open the report URL — check browser console for `decodeReport` errors
5. Check Vercel function logs at: `vercel.com/[project]/functions` for production errors

## Build Status
- `npm run build` passes cleanly as of last commit (`7dd3d9c`)
- All TypeScript strict mode checks pass
