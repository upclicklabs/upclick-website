import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, website, message } = body;

    // Validate inputs
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // TODO: Implement email sending with Resend
    // 1. Send notification email to agency
    // 2. Send confirmation email to user

    console.log("Contact form submission:", { name, email, website, message });

    // Placeholder response
    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully.",
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    );
  }
}
