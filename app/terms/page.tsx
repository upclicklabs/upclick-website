import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | UpClick Labs",
  description:
    "Read the terms and conditions for using UpClick Labs services and website.",
};

export default function TermsPage() {
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
              Terms of <span className="text-gold-gradient">Service</span>
            </h1>
            <p className="mt-6 text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-12">
            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Agreement to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using the UpClick Labs website and services, you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Description of Services
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                UpClick Labs provides Answer Engine Optimization (AEO) services,
                including but not limited to website assessments, content
                optimization, technical AEO implementation, and consulting
                services designed to improve visibility in AI-powered search
                engines.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Use of Assessment Tool
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our free AEO assessment tool is provided for informational
                purposes. By using the tool, you agree that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  You have the right to submit the website URL for analysis
                </li>
                <li>
                  Assessment results are recommendations and not guarantees of
                  performance
                </li>
                <li>
                  We may use aggregated, anonymized data to improve our services
                </li>
                <li>
                  The assessment report will be sent to the email address you
                  provide
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website, including text, graphics, logos,
                and software, is the property of UpClick Labs and is protected
                by intellectual property laws. You may not reproduce,
                distribute, or create derivative works without our written
                permission.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                User Responsibilities
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When using our services, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Not use our services for any unlawful purpose</li>
                <li>
                  Not attempt to interfere with or disrupt our website or
                  services
                </li>
                <li>
                  Not submit content that infringes on third-party rights
                </li>
                <li>
                  Not use automated systems to access our services without
                  permission
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Service Delivery
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For paid services, specific terms including scope, deliverables,
                timelines, and payment terms will be outlined in a separate
                service agreement. These Terms of Service apply in addition to
                any service-specific agreements.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Payment Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Payment terms for services will be specified in individual
                service agreements. Unless otherwise stated, payments are
                non-refundable once services have commenced.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are provided &quot;as is&quot; without warranties
                of any kind. We do not guarantee specific results, rankings, or
                visibility improvements. AI search algorithms are controlled by
                third parties and are subject to change without notice.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, UpClick Labs shall not
                be liable for any indirect, incidental, special, consequential,
                or punitive damages resulting from your use of our services,
                even if we have been advised of the possibility of such damages.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Indemnification
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless UpClick Labs and its
                officers, directors, employees, and agents from any claims,
                damages, or expenses arising from your use of our services or
                violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Termination
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend access to our
                services at our sole discretion, without notice, for conduct
                that we believe violates these terms or is harmful to other
                users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Governing Law
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance
                with applicable laws. Any disputes arising from these terms
                shall be resolved through good-faith negotiation or, if
                necessary, binding arbitration.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Changes
                will be effective immediately upon posting to this page. Your
                continued use of our services after changes constitutes
                acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif-elegant text-2xl text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at{" "}
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
