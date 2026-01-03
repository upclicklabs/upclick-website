"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "About", href: "/#about" },
  { name: "What is AEO", href: "/#what-is-aeo" },
  { name: "Benefits", href: "/#benefits" },
  { name: "Services", href: "/#services" },
  { name: "Assessment", href: "/#assessment" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll after navigation completes
  useEffect(() => {
    if (pendingHash && pathname === "/") {
      const scrollToElement = () => {
        const element = document.querySelector(pendingHash);
        if (element) {
          const headerOffset = 96; // 6rem = 96px
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          setPendingHash(null);
        }
      };

      // Small delay to ensure DOM is ready
      const timer = setTimeout(scrollToElement, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname, pendingHash]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Check if it's a hash link to the home page
    if (href.startsWith("/#")) {
      const hash = href.substring(1); // Remove leading "/"

      if (pathname === "/") {
        // Already on home page, just scroll to section
        e.preventDefault();
        const element = document.querySelector(hash);
        if (element) {
          const headerOffset = 96; // 6rem = 96px
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      } else {
        // On a different page, navigate to home first then scroll
        e.preventDefault();
        setPendingHash(hash);
        router.push("/");
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <nav className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo - Skal Style */}
        <Link href="/" className="flex items-center">
          <Image
            src="/upclick logos/upclick logo white no background.svg"
            alt="UpClick Labs"
            width={96}
            height={96}
            className="h-24 w-auto"
          />
          <span className="-ml-6 text-xl font-bold tracking-tight text-foreground">
            UpClick Labs
          </span>
        </Link>

        {/* Desktop Navigation - Hidden, minimal like Skal */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-sm font-mono tracking-wider text-muted-foreground uppercase hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA + Menu Button */}
        <div className="flex items-center gap-6">
          <Link
            href="/#assessment"
            onClick={(e) => handleNavClick(e, "/#assessment")}
            className="hidden md:inline-flex btn-skal px-6 py-3 text-xs tracking-widest"
          >
            Free Assessment
          </Link>

          {/* Hamburger Menu Button */}
          <button
            type="button"
            className="flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-7 h-0.5 bg-foreground origin-center"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-7 h-0.5 bg-foreground"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-7 h-0.5 bg-foreground origin-center"
            />
          </button>
        </div>
      </nav>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay - fades in/out */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel - full screen with solid black background */}
            <motion.div
              key="menu-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#000000',
                zIndex: 9999,
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '1rem',
                  color: '#ffffff',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Close menu"
              >
                <X size={28} />
              </button>

              {/* Menu content */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '6rem 2rem 3rem 2rem',
                backgroundColor: '#000000',
              }}>
                <nav style={{ flex: 1 }}>
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          setMobileMenuOpen(false);
                          handleNavClick(e, item.href);
                        }}
                        className="block text-2xl sm:text-3xl font-serif-elegant text-neutral-200 hover:text-primary transition-colors py-3 border-b border-neutral-800"
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-auto space-y-6"
                >
                  <p className="text-neutral-500 font-mono text-sm tracking-wider">
                    hello@upclicklabs.com
                  </p>
                  <Link
                    href="/#assessment"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      handleNavClick(e, "/#assessment");
                    }}
                    className="btn-skal-filled inline-flex px-8 py-4 text-sm tracking-widest"
                  >
                    Get Your Assessment
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
