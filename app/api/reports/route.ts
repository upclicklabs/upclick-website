import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { AEOReport } from "@/lib/email-templates";
import crypto from "crypto";

// Generate a short unique ID
function generateShortId(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 character hex string
}

// POST - Store a new report in Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const report: AEOReport = await request.json();

    if (!report.url || !report.scores) {
      return NextResponse.json(
        { error: "Invalid report data" },
        { status: 400 }
      );
    }

    const shortId = generateShortId();

    // Generate SEO-friendly slug from URL
    const hostname = new URL(report.url).hostname.replace("www.", "");
    const slug = hostname.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "");

    // Store in Vercel Blob as JSON
    const blob = await put(
      `reports/${shortId}.json`,
      JSON.stringify(report),
      {
        contentType: "application/json",
        access: "public",
        addRandomSuffix: false,
      }
    );

    console.log("Report stored in blob:", { shortId, blobUrl: blob.url });

    return NextResponse.json({
      success: true,
      shortId,
      slug,
      reportUrl: `/report/${slug}?id=${shortId}`,
    });
  } catch (error) {
    console.error("Failed to store report:", error);
    return NextResponse.json(
      { error: "Failed to store report" },
      { status: 500 }
    );
  }
}

// GET - Retrieve a report by short ID from Vercel Blob
export async function GET(request: NextRequest) {
  try {
    const shortId = request.nextUrl.searchParams.get("id");

    if (!shortId) {
      return NextResponse.json(
        { error: "Missing report ID" },
        { status: 400 }
      );
    }

    // Sanitize shortId to prevent path traversal
    const safeId = shortId.replace(/[^a-f0-9]/gi, "");
    if (!safeId || safeId.length < 4) {
      return NextResponse.json(
        { error: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Strategy 1: Try list with short prefix (handles both old random-suffix and new fixed-name blobs)
    // Use prefix WITHOUT .json so it matches "reports/abc123.json" AND "reports/abc123-rAnDoM.json"
    const { blobs } = await list({ prefix: `reports/${safeId}` });

    if (blobs.length === 0) {
      console.error("Report not found in blob storage for id:", safeId);
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Pick the most recent blob if multiple match (handles re-generation)
    const targetBlob = blobs.length === 1
      ? blobs[0]
      : blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

    console.log("Found blob:", targetBlob.pathname, "url:", targetBlob.url);

    // Fetch the blob content using the blob's public URL
    const response = await fetch(targetBlob.url);
    if (!response.ok) {
      console.error("Blob fetch failed:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch report" },
        { status: 500 }
      );
    }

    const report = await response.json();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Failed to retrieve report:", error);
    return NextResponse.json(
      { error: "Failed to retrieve report" },
      { status: 500 }
    );
  }
}
