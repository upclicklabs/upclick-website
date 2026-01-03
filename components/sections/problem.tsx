"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "15-25%", label: "SEO traffic decline", description: "across industries" },
  { value: "88%", label: "Sites lack schema", description: "missing AI signals" },
  { value: "3 yrs", label: "Until AI dominates", description: "search landscape" },
];

export function Problem() {
  return (
    <section className="py-32 bg-background border-t border-border/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="font-mono text-xs tracking-widest text-primary uppercase">
            The Challenge
          </span>
          <h2 className="mt-6 font-serif-elegant text-4xl sm:text-5xl md:text-6xl text-foreground">
            Traditional SEO is
            <br />
            <span className="text-gold-gradient">no longer enough</span>
          </h2>
          <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
            With AI interpreting your narrative, brands risk being lost in a sea
            of sameness—where differentiation fades and narratives are diluted.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mt-20 grid gap-px bg-border/30 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background p-10 md:p-12"
            >
              <span className="block font-serif-elegant text-5xl md:text-6xl text-primary">
                {stat.value}
              </span>
              <span className="mt-4 block text-lg text-foreground">
                {stat.label}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {stat.description}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 max-w-2xl"
        >
          <blockquote className="border-l-2 border-primary pl-6">
            <p className="text-lg text-muted-foreground italic">
              "93% of marketing leaders say AEO will be critical to success
              in the next 2 years."
            </p>
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
