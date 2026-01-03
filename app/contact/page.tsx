import { ContactForm } from "@/components/forms/contact-form";
import { CalendlyEmbed } from "@/components/calendly-embed";

export const metadata = {
  title: "Contact Us | UpClick Labs",
  description:
    "Book a discovery call or get in touch to learn how we can optimize your brand for AI search engines.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-32">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <span className="font-mono text-xs tracking-widest text-primary uppercase">
              Contact
            </span>
            <h1 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
              Get in
              <br />
              <span className="text-gold-gradient">touch</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-xl mx-auto">
              Ready to get your brand mentioned by AI? Book a discovery call or send
              us a message.
            </p>
          </div>

          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            {/* Calendly Embed Section */}
            <div className="border border-border/50 bg-secondary/30 p-8 md:p-12">
              <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-2">
                Schedule
              </h2>
              <h3 className="text-2xl font-serif-elegant text-foreground mb-4">
                Book a Call
              </h3>
              <p className="text-muted-foreground mb-8">
                Schedule a free 30-minute discovery call to discuss your AEO
                strategy.
              </p>
              <CalendlyEmbed url="https://calendly.com/kris-upclicklabs/30min" />
            </div>

            {/* Contact Form Section */}
            <div className="border border-border/50 bg-background p-8 md:p-12">
              <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-2">
                Message
              </h2>
              <h3 className="text-2xl font-serif-elegant text-foreground mb-4">
                Send a Message
              </h3>
              <p className="text-muted-foreground mb-8">
                Prefer email? Fill out the form and we&apos;ll get back to you
                within 24 hours.
              </p>
              <ContactForm />
            </div>
          </div>

          {/* Direct Contact Info */}
          <div className="mt-20 pt-16 border-t border-border/30 text-center">
            <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-8">
              Other Ways to Reach Us
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-16">
              <div>
                <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-2">
                  Email
                </p>
                <a
                  href="mailto:hello@upclicklabs.com"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  hello@upclicklabs.com
                </a>
              </div>
              <div>
                <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-2">
                  Response Time
                </p>
                <p className="text-foreground">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
