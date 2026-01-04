import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { analyzeWebsite } from "@/lib/aeo-analyzer";
import { generateSimpleReportEmail } from "@/lib/email-templates-simple";

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

// Send lead data to Google Sheets via webhook
async function sendToGoogleSheets(data: {
  name: string;
  email: string;
  url: string;
  score: number;
  maturityLevel: string;
  reportUrl: string;
}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL not configured - lead not captured");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log("Lead sent to Google Sheets successfully");
    } else {
      console.error("Failed to send lead to Google Sheets:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending to Google Sheets:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, email } = body;

    // Validate inputs
    if (!name || !url || !email) {
      return NextResponse.json(
        { error: "Name, URL, and email are required" },
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

    console.log("Assessment requested:", { name, url, email });

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

    // Store report and get short URL
    const baseUrl = getBaseUrl(request);
    const hostname = new URL(report.url).hostname.replace("www.", "");

    // Store the report via internal API call
    const storeResponse = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });

    let reportUrl: string;

    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      reportUrl = `${baseUrl}${storeData.reportUrl}`;
      console.log("Short report URL generated:", reportUrl);
    } else {
      // Fallback to old compressed URL method if storage fails
      const { generateReportUrl } = await import("@/lib/report-url");
      reportUrl = generateReportUrl(report, baseUrl);
      console.log("Fallback to compressed URL:", reportUrl.substring(0, 100) + "...");
    }

    // Send lead to Google Sheets (fire and forget - don't block on this)
    sendToGoogleSheets({
      name,
      email,
      url,
      score: report.scores.overall,
      maturityLevel: report.maturityLevel,
      reportUrl,
    }).catch(err => console.error("Google Sheets error:", err));

    // Generate simple email with link
    const emailHtml = generateSimpleReportEmail({
      hostname,
      reportUrl,
      score: report.scores.overall,
      maturityLevel: report.maturityLevel,
      name,
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
