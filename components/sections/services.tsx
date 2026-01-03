"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Content",
    description: "Create clear, helpful answers that AI systems love to cite. We structure your content so ChatGPT, Perplexity, and other AI tools can easily understand and recommend your brand.",
    features: ["Answer-focused content", "FAQ sections that AI cites", "Fresh, up-to-date pages"],
  },
  {
    number: "02",
    title: "Technical",
    description: "Make your website easy for AI to find and understand. We add the behind-the-scenes code that helps AI crawlers read your site and trust your content.",
    features: ["Schema markup setup", "Site speed optimization", "AI-friendly structure"],
  },
  {
    number: "03",
    title: "Authority",
    description: "Build the credibility that makes AI recommend you over competitors. We help you get mentioned on trusted sites and platforms that AI systems rely on.",
    features: ["Digital PR strategy", "Third-party mentions", "Trust signal building"],
  },
  {
    number: "04",
    title: "Measurement",
    description: "Know exactly how AI is talking about your brand. We track your mentions across ChatGPT, Perplexity, and other AI platforms so you can see what's working.",
    features: ["AI mention tracking", "Share of voice reports", "Performance dashboards"],
  },
];

export function Services() {
  return (
    <section id="services" className="py-32 bg-secondary/30 border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-mono text-xs tracking-widest text-primary uppercase">
            What We Do
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
            Comprehensive
            <br />
            <span className="text-gold-gradient">AEO services</span>
          </h2>
        </motion.div>

        {/* Services Grid */}
        <div className="mt-20 grid gap-px bg-border/30 md:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background p-10 md:p-14 group"
            >
              <span className="font-mono text-5xl text-primary/20 group-hover:text-primary/40 transition-colors">
                {service.number}
              </span>
              <h3 className="mt-6 text-2xl font-serif-elegant text-foreground">
                {service.title}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {service.description}
              </p>
              <ul className="mt-6 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="w-1 h-1 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            href="/contact"
            className="btn-skal-filled inline-flex px-10 py-5 text-sm tracking-widest"
          >
            Book a Strategy Call
          </Link>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Free 30-min call. No pitch. Just answers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
