import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { name: "About", href: "/#about" },
  { name: "What is AEO", href: "/#what-is-aeo" },
  { name: "Benefits", href: "/#benefits" },
  { name: "Services", href: "/#services" },
  { name: "Assessment", href: "/#assessment" },
  { name: "Blog", href: "/blog" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="md:col-span-2">
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
            <p className="mt-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Get your brand mentioned by AI. We help businesses optimize for
              the next generation of search.
            </p>
            <a
              href="mailto:hello@upclicklabs.com"
              className="mt-6 inline-block font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              hello@upclicklabs.com
            </a>
          </div>

          {/* Navigation Links */}
          <div>
            <ul className="space-y-4">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground tracking-wider">
            &copy; {new Date().getFullYear()} UpClick Labs. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
