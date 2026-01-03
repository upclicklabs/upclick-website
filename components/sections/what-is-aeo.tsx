"use client";

import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "User asks AI", description: "Questions about your industry" },
  { number: "02", title: "AI processes", description: "Analyzes web content" },
  { number: "03", title: "AI cites sources", description: "Recommends authoritative brands" },
  { number: "04", title: "You get mentioned", description: "With proper AEO optimization" },
];

const comparisons = [
  { seo: "Keywords", aeo: "Questions & Intent" },
  { seo: "Ranking #1", aeo: "Being cited by AI" },
  { seo: "Backlinks", aeo: "Structured content" },
  { seo: "Algorithms", aeo: "LLM understanding" },
];

export function WhatIsAeo() {
  return (
    <section id="what-is-aeo" className="py-32 bg-secondary/30 border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-mono text-xs tracking-widest text-primary uppercase">
            Understanding AEO
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
            What is Answer
            <br />
            <span className="text-gold-gradient">Engine Optimization?</span>
          </h2>
          <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
            Where traditional SEO focuses on ranking for keywords, AEO ensures
            your brand delivers complete, credible answers that AI surfaces.
          </p>
        </motion.div>

        {/* How It Works */}
        <div className="mt-24">
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase text-center mb-12">
            How AI Search Works
          </h3>
          <div className="grid gap-px bg-border/30 md:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background p-8 md:p-10 group hover:bg-secondary/50 transition-colors"
              >
                <span className="font-mono text-4xl text-primary/30 group-hover:text-primary transition-colors">
                  {step.number}
                </span>
                <h4 className="mt-4 text-xl font-serif-elegant text-foreground">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SEO vs AEO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 max-w-2xl mx-auto"
        >
          <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase text-center mb-12">
            SEO vs AEO
          </h3>
          <div className="border border-border/50">
            {/* Header */}
            <div className="grid grid-cols-2 border-b border-border/50">
              <div className="p-4 text-center font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Traditional SEO
              </div>
              <div className="p-4 text-center font-mono text-xs tracking-widest text-primary uppercase border-l border-border/50">
                AEO
              </div>
            </div>
            {/* Rows */}
            {comparisons.map((item, index) => (
              <div key={index} className="grid grid-cols-2 border-b border-border/30 last:border-0">
                <div className="p-5 text-center text-muted-foreground">
                  {item.seo}
                </div>
                <div className="p-5 text-center text-foreground border-l border-border/30">
                  {item.aeo}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
