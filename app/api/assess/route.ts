import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { generateSimpleReportEmail, generatePlainTextEmail } from "@/lib/email-templates-simple";

export const maxDuration = 60; // Allow up to 60s for parallel API calls (PSI, etc.)

// GET handler for health check / diagnostics
export async function GET() {
  try {
    // Dynamic import to catch module-level crashes
    const mod = await import("@/lib/assessment");
    return NextResponse.json({
      status: "ok",
      hasAnalyzeWebsite: typeof mod.analyzeWebsite === "function",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : "";
    return NextResponse.json({
      status: "error",
      message,
      stack,
    }, { status: 500 });
  }
}

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
  const webhookUrl = process.env.GOOGLESHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("GOOGLESHEETS_WEBHOOK_URL not configured - lead not captured");
    return;
  }

  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  console.log("Sending lead to Google Sheets...");
  console.log("Payload:", JSON.stringify({ ...payload, email: "***" }));

  try {
    // Google Apps Script redirects, so we need to follow redirects
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    console.log("Google Sheets response status:", response.status);
    const responseText = await response.text();
    console.log("Google Sheets response:", responseText);

    if (response.ok || response.status === 302) {
      console.log("Lead sent to Google Sheets successfully");
    } else {
      console.error("Failed to send lead to Google Sheets:", response.status, responseText);
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

    // Analyze the website (dynamic import to isolate module crashes)
    let report;
    try {
      const { analyzeWebsite } = await import("@/lib/assessment");
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

    // Store report in Vercel Blob for persistent, reliable access
    const baseUrl = getBaseUrl(request);
    const hostname = new URL(report.url).hostname.replace("www.", "");
    const slug = hostname.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "");
    const shortId = crypto.randomBytes(4).toString("hex");

    let blobUrl: string;
    try {
      const blob = await put(
        `reports/${shortId}.json`,
        JSON.stringify(report),
        {
          contentType: "application/json",
          access: "public",
          addRandomSuffix: false,
        }
      );
      blobUrl = blob.url;
      console.log("Report stored in blob:", shortId, "url:", blobUrl);
    } catch (blobError) {
      console.error("Blob storage failed:", blobError);
      return NextResponse.json(
        { error: "Failed to save report. Please try again." },
        { status: 500 }
      );
    }

    // Encode the blob URL into the report page URL so the client can fetch directly
    // No middleman API needed — the blob URL is public and permanent
    const encodedBlobUrl = encodeURIComponent(blobUrl);
    const reportUrl = `${baseUrl}/report/${slug}?b=${encodedBlobUrl}`;
    console.log("Report URL generated:", reportUrl);

    // Send lead to Google Sheets (fire and forget - don't block on this)
    sendToGoogleSheets({
      name,
      email,
      url,
      score: report.scores.overall,
      maturityLevel: report.maturityLevel,
      reportUrl,
    }).catch(err => console.error("Google Sheets error:", err));

    // Generate email content
    const emailData = {
      hostname,
      reportUrl,
      score: report.scores.overall,
      maturityLevel: report.maturityLevel,
      name,
    };
    const emailHtml = generateSimpleReportEmail(emailData);
    const emailText = generatePlainTextEmail(emailData);

    // Send email via Resend
    const resend = getResendClient();
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "UpClick Labs <kris@upclicklabs.com>",
          to: email,
          subject: `Your AEO Assessment for ${hostname}`,
          html: emailHtml,
          text: emailText,
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
