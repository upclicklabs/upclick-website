"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "59%", label: "Use AI search weekly" },
  { value: "Free", label: "Instant assessment" },
  { value: "40%", label: "Gen Z prefer AI to Google" },
];

export function About() {
  return (
    <section id="about" className="py-32 bg-background border-t border-border/30">
      <div className="container mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="font-mono text-xs tracking-widest text-primary uppercase">
              About Us
            </span>
            <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl text-foreground">
              About
              <br />
              <span className="text-gold-gradient">UpClick Labs</span>
            </h2>
            <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
              <p>
                We help forward-thinking brands get discovered in the age of AI
                search. With 59% of consumers now using AI assistants weekly to
                find products and answers, only 25% of marketers understand how
                to optimize for it.
              </p>
              <p>
                That&apos;s where we come in. We combine deep AEO expertise with
                data-driven strategies to ensure your brand delivers the complete,
                credible answers that AI systems surface.
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-10 space-y-4">
              {[
                "Deep expertise in AEO strategy",
                "Proven 4-pillar methodology",
                "Comprehensive Content + Technical + Authority approach",
                "Transparent reporting and measurable outcomes",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <span className="w-2 h-2 bg-primary" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:pl-12"
          >
            <div className="grid gap-px bg-border/30">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-10"
                >
                  <span className="block font-serif-elegant text-6xl text-primary">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-muted-foreground">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
