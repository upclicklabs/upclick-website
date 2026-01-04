import { NextRequest, NextResponse } from "next/server";
import { AEOReport } from "@/lib/email-templates";
import crypto from "crypto";

// In-memory storage (for development - use Redis/DB in production)
const reportStore = new Map<string, { report: AEOReport; expires: number }>();

// Generate a short unique ID
function generateShortId(): string {
  return crypto.randomBytes(4).toString("hex"); // 8 character hex string
}

// Clean up expired reports
function cleanupExpired() {
  const now = Date.now();
  for (const [id, data] of reportStore.entries()) {
    if (data.expires < now) {
      reportStore.delete(id);
    }
  }
}

// POST - Store a new report
export async function POST(request: NextRequest) {
  try {
    const report: AEOReport = await request.json();

    if (!report.url || !report.scores) {
      return NextResponse.json(
        { error: "Invalid report data" },
        { status: 400 }
      );
    }

    // Clean up old reports
    cleanupExpired();

    // Generate short ID
    const shortId = generateShortId();

    // Store report (expires in 30 days)
    const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days
    reportStore.set(shortId, {
      report,
      expires: Date.now() + expiresIn,
    });

    // Generate SEO-friendly slug from URL
    const hostname = new URL(report.url).hostname.replace("www.", "");
    const slug = hostname.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "");

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

// GET - Retrieve a report by short ID
export async function GET(request: NextRequest) {
  try {
    const shortId = request.nextUrl.searchParams.get("id");

    if (!shortId) {
      return NextResponse.json(
        { error: "Missing report ID" },
        { status: 400 }
      );
    }

    const data = reportStore.get(shortId);

    if (!data || data.expires < Date.now()) {
      if (data) reportStore.delete(shortId);
      return NextResponse.json(
        { error: "Report not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: data.report,
    });
  } catch (error) {
    console.error("Failed to retrieve report:", error);
    return NextResponse.json(
      { error: "Failed to retrieve report" },
      { status: 500 }
    );
  }
}
