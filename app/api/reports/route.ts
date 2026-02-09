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

    // List blobs with the matching prefix
    const { blobs } = await list({ prefix: `reports/${shortId}.json` });

    if (blobs.length === 0) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Fetch the blob content
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
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
