"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const benefits = [
  { value: "59%", label: "Weekly AI users", description: "Consumers using AI search" },
  { value: "70%", label: "Beyond page one", description: "AI cites non-top-10 results" },
  { value: "95%", label: "Fresh content wins", description: "Citations from recent pages" },
  { value: "73%", label: "Schema advantage", description: "Top results use markup" },
  { value: "40%", label: "Gen Z preference", description: "Choose AI over Google" },
  { value: "25%", label: "Marketers ready", description: "Currently understand AEO" },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-32 bg-background border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="font-mono text-xs tracking-widest text-primary uppercase">
            The Shift Is Happening
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
            Why AEO
            <br />
            <span className="text-gold-gradient">matters now</span>
          </h2>
          <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
            Industry research shows the rapid shift to AI-powered search.
            Early adopters are already capturing this traffic.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="mt-20 grid gap-px bg-border/30 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-background p-8 md:p-10 group hover:bg-secondary/30 transition-colors"
            >
              <span className="block font-serif-elegant text-4xl md:text-5xl text-primary">
                {benefit.value}
              </span>
              <span className="mt-4 block text-lg text-foreground">
                {benefit.label}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {benefit.description}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <Link
            href="#assessment"
            className="btn-skal inline-flex px-8 py-4 text-sm tracking-widest"
          >
            See Your AI Visibility Score
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
