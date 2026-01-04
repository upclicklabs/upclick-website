"use client";

import { motion } from "framer-motion";
import { AssessmentForm } from "@/components/forms/assessment-form";

const features = [
  { weight: "30%", title: "Content Analysis", description: "FAQ coverage, headings, freshness" },
  { weight: "25%", title: "Technical Review", description: "Schema, structure, speed" },
  { weight: "25%", title: "Authority Check", description: "E-E-A-T signals, mentions" },
  { weight: "20%", title: "Measurement", description: "AI tracking, analytics" },
];

export function AssessmentTool() {
  return (
    <section id="assessment" className="py-32 bg-secondary/30 border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <span className="font-mono text-2xl font-bold text-primary">40%</span>
            <span className="text-sm text-muted-foreground">of Gen Z prefer AI to Google</span>
          </div>
          <span className="block font-mono text-xs tracking-widest text-primary uppercase">
            Free Instant Assessment
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
            Free AEO
            <br />
            <span className="text-gold-gradient">assessment</span>
          </h2>
          <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
            Discover how AI-ready your website is. Get a detailed report on your
            AEO maturity score across 4 key categories.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:items-start">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border border-border/50 bg-background p-8 md:p-12"
          >
            <h3 className="text-xl font-serif-elegant text-foreground mb-2">
              Get your free assessment
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your website URL and we&apos;ll analyze your AEO readiness.
            </p>
            <AssessmentForm />

            <div className="mt-8 pt-8 border-t border-border/30">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground font-mono tracking-wider">
                <span>✓ 100% free</span>
                <span>✓ No credit card</span>
                <span>✓ No sales calls</span>
                <span>✓ Report in 24hrs</span>
              </div>
            </div>

            {/* AI Disclaimer */}
            <div className="mt-6 p-4 border border-border/30 bg-secondary/20 rounded">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground/70">A note on accuracy:</span>{" "}
                Our analysis uses automated scanning to evaluate your site. While we strive for precision,
                no tool is perfect — use this report as a guide to identify opportunities, not as a definitive audit.
              </p>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase mb-8">
              What we analyze
            </h3>
            <div className="grid gap-px bg-border/30">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-6 flex items-start gap-6"
                >
                  <span className="font-mono text-2xl text-primary/50">
                    {feature.weight}
                  </span>
                  <div>
                    <h4 className="text-foreground font-medium">{feature.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Maturity levels */}
            <div className="mt-8 p-6 border border-border/30">
              <p className="text-sm text-muted-foreground mb-4">
                AEO Maturity Levels:
              </p>
              <div className="space-y-2">
                {[
                  { level: "Keywords", desc: "Traditional SEO approach" },
                  { level: "Answers", desc: "Beginning to structure for AI" },
                  { level: "Structure", desc: "Good technical foundation" },
                  { level: "Pillar", desc: "Comprehensive content ecosystem" },
                  { level: "Authority", desc: "AI actively recommends you" },
                ].map((item, i) => (
                  <div
                    key={item.level}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="font-mono text-primary w-4">{i + 1}</span>
                    <span className="font-medium text-foreground w-20">{item.level}</span>
                    <span className="text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
