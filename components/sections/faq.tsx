"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const faqs = [
  {
    question: "What is AEO (Answer Engine Optimization)?",
    answer:
      "AEO is the practice of optimizing your content and website to be discovered, understood, and cited by AI-powered answer engines like ChatGPT, Perplexity, Claude, and Google's AI Overviews.",
  },
  {
    question: "How is AEO different from SEO?",
    answer:
      "While SEO focuses on ranking in traditional search results, AEO focuses on being cited and recommended by AI systems. AEO optimizes for structured answers, authoritative content, and AI-readable formats.",
  },
  {
    question: "How long does it take to see results?",
    answer:
      "Some clients see improvements in AI mentions within 4-6 weeks, while comprehensive AEO strategies typically show significant results within 3-6 months.",
  },
  {
    question: "Can you guarantee AI mentions?",
    answer:
      "While we can't guarantee specific mentions, we optimize your content to maximize the likelihood of being cited based on how LLMs process and recommend content.",
  },
  {
    question: "What does the assessment include?",
    answer:
      "Our assessment analyzes Content (30%), Technical (25%), Authority (25%), and Measurement (20%). You receive a maturity score from 1-5 for each category with specific recommendations.",
  },
  {
    question: "Do I need to stop doing SEO?",
    answer:
      "No. AEO complements SEO rather than replacing it. Many AEO best practices also benefit traditional SEO. We recommend an integrated approach.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-background border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-mono text-xs tracking-widest text-primary uppercase">
            FAQ
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl text-foreground">
            Frequently asked
            <br />
            <span className="text-gold-gradient">questions</span>
          </h2>
        </motion.div>

        {/* FAQ List */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="border-t border-border/30">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/30"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between py-6 text-left group"
                >
                  <span className="text-foreground pr-8 group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <span className="font-mono text-2xl text-muted-foreground group-hover:text-primary transition-colors">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">Still have questions?</p>
          <Link
            href="/contact"
            className="btn-skal inline-flex px-8 py-4 text-sm tracking-widest"
          >
            Book a Free Call
          </Link>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            No commitment. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
