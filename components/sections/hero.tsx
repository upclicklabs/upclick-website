"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { GL } from "@/components/gl";

export function Hero() {
  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render GL after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* WebGL Wave Background - only render on client */}
      {mounted && <GL hovering={hovering} />}

      {/* Content */}
      <div className="container mx-auto px-4 pb-16 relative" style={{ zIndex: 10 }}>
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Headline - Skal Style */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif-elegant text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight"
          >
            <span className="text-foreground">Get your brand</span>
            <br />
            <span className="text-gold-gradient">mentioned</span>
            <span className="text-foreground"> by AI</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-10 max-w-xl text-lg text-muted-foreground font-mono tracking-wide"
          >
            Through Answer Engine Optimization strategies
            <br />
            that put your brand in AI conversations
          </motion.p>

          {/* CTA Button - Skal Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-14"
          >
            <Link
              href="#assessment"
              className="btn-skal-filled inline-flex items-center justify-center px-10 py-5 text-sm tracking-widest"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              Get Your Free Assessment
            </Link>
            <p className="mt-4 text-sm text-muted-foreground font-mono">
              No credit card. No spam. Just insights.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
