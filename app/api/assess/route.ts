import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { analyzeWebsite } from "@/lib/aeo-analyzer";
import { generateSimpleReportEmail } from "@/lib/email-templates-simple";
import { generateReportUrl } from "@/lib/report-url";

// Lazy initialize Resend to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Get base URL for report links
function getBaseUrl(request: NextRequest): string {
  // Check for forwarded host (when behind proxy/load balancer)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Use request URL host
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email } = body;

    // Validate inputs
    if (!url || !email) {
      return NextResponse.json(
        { error: "URL and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("Assessment requested:", { url, email });

    // Analyze the website
    let report;
    try {
      report = await analyzeWebsite(url);
      console.log("Analysis complete:", {
        url,
        overallScore: report.scores.overall,
        maturityLevel: report.maturityLevel,
      });
    } catch (analysisError) {
      console.error("Website analysis failed:", analysisError);
      return NextResponse.json(
        {
          error:
            "Could not analyze website. Please check the URL is accessible.",
        },
        { status: 400 }
      );
    }

    // Generate the report URL (no database needed - data encoded in URL)
    const baseUrl = getBaseUrl(request);
    const reportUrl = generateReportUrl(report, baseUrl);
    const hostname = new URL(report.url).hostname.replace("www.", "");

    console.log("Report URL generated:", reportUrl.substring(0, 100) + "...");

    // Generate simple email with link
    const emailHtml = generateSimpleReportEmail({
      hostname,
      reportUrl,
      score: report.scores.overall,
      maturityLevel: report.maturityLevel,
    });

    // Send email via Resend
    const resend = getResendClient();
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "UpClick Labs <kris@upclicklabs.com>",
          to: email,
          subject: `Your AEO Assessment for ${hostname}`,
          html: emailHtml,
        });

        if (error) {
          console.error("Email send error:", error);
          // Still return success with report URL
          return NextResponse.json({
            success: true,
            message: "Assessment complete. Email delivery pending.",
            reportUrl,
          });
        }

        console.log("Email sent successfully:", data?.id);
      } catch (emailError) {
        console.error("Email error:", emailError);
        // Still return success with report URL
        return NextResponse.json({
          success: true,
          message: "Assessment complete. Email delivery pending.",
          reportUrl,
        });
      }
    } else {
      console.warn("RESEND_API_KEY not configured - email not sent");
    }

    return NextResponse.json({
      success: true,
      message: "Assessment complete! Check your email for the report link.",
      reportUrl,
    });
  } catch (error) {
    console.error("Error processing assessment:", error);
    return NextResponse.json(
      { error: "Failed to process assessment request" },
      { status: 500 }
    );
  }
}
