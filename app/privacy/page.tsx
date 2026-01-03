import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | UpClick Labs",
  description:
    "Learn how UpClick Labs collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-32">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="font-mono text-xs tracking-widest text-primary uppercase">
              Legal
            </span>
            <h1 className="mt-6 font-serif-elegant text-4xl sm:text-5xl text-foreground">
              Privacy <span className="text-gold-gradient">Policy</span>
            </h1>
            <p className="mt-6 text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-12">
            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                UpClick Labs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
                respects your privacy and is committed to protecting your
                personal data. This privacy policy explains how we collect, use,
                and safeguard your information when you visit our website or use
                our services.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect the following types of information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Contact Information:</strong>{" "}
                  Name, email address, and company name when you fill out forms
                  or contact us
                </li>
                <li>
                  <strong className="text-foreground">Website Data:</strong> URLs
                  submitted for AEO assessment analysis
                </li>
                <li>
                  <strong className="text-foreground">Usage Data:</strong>{" "}
                  Information about how you interact with our website, including
                  pages visited and time spent
                </li>
                <li>
                  <strong className="text-foreground">Technical Data:</strong> IP
                  address, browser type, device information, and cookies
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and improve our AEO services</li>
                <li>Send you assessment reports and related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Analyze website usage to improve user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Data Sharing
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your data
                with trusted third-party service providers who assist us in
                operating our website and delivering our services, such as email
                delivery services and analytics providers. These parties are
                contractually obligated to protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Cookies
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website uses cookies to enhance your browsing experience and
                analyze site traffic. You can control cookie settings through
                your browser preferences. Disabling cookies may limit some
                functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction. However, no method of
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data only for as long as necessary to
                fulfill the purposes for which it was collected, comply with
                legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Third-Party Links
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain links to third-party websites. We are
                not responsible for the privacy practices of these external
                sites. We encourage you to review their privacy policies before
                providing any personal information.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this privacy policy or our data
                practices, please contact us at{" "}
                <a
                  href="mailto:hello@upclicklabs.com"
                  className="text-primary hover:underline"
                >
                  hello@upclicklabs.com
                </a>
                .
              </p>
            </section>
          </div>

          {/* Back Link */}
          <div className="mt-16 pt-8 border-t border-border/30">
            <Link
              href="/"
              className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
