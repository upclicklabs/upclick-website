import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPostBySlug, getAllPosts, BlogPost } from "@/lib/blog/posts";

function generateArticleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "UpClick Labs",
      logo: {
        "@type": "ImageObject",
        url: "https://upclicklabs.com/upclick logos/upclick logo white no background.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://upclicklabs.com/blog/${post.slug}`,
    },
    articleSection: post.category,
    keywords: ["AEO", "Answer Engine Optimization", "AI Search", post.category],
  };
}

function generateFAQSchema(post: BlogPost) {
  if (!post.faqs || post.faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function generateBreadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://upclicklabs.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://upclicklabs.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://upclicklabs.com/blog/${post.slug}`,
      },
    ],
  };
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | UpClick Labs",
    };
  }

  return {
    title: `${post.title} | UpClick Labs Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Function to render content with images interspersed
  const renderContent = () => {
    const paragraphs = post.content.split("\n\n");
    const totalParagraphs = paragraphs.length;
    const imagePositions = [
      Math.floor(totalParagraphs * 0.2),
      Math.floor(totalParagraphs * 0.5),
      Math.floor(totalParagraphs * 0.8),
    ];

    return paragraphs.map((paragraph, index) => {
      const imageIndex = imagePositions.indexOf(index);
      const image = imageIndex !== -1 ? post.images[imageIndex] : null;

      // Check if paragraph is a table (starts with |)
      if (paragraph.trim().startsWith("|")) {
        const rows = paragraph.trim().split("\n");
        const headerRow = rows[0];
        const dataRows = rows.slice(2); // Skip header and separator

        const headers = headerRow
          .split("|")
          .filter((cell) => cell.trim())
          .map((cell) => cell.trim());

        return (
          <div key={index} className="my-8 overflow-x-auto">
            <table className="w-full border-collapse border border-border/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-primary/10">
                  {headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border/50"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIndex) => {
                  const cells = row
                    .split("|")
                    .filter((cell) => cell.trim())
                    .map((cell) => cell.trim());
                  return (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      {cells.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-sm text-muted-foreground border-b border-border/30"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // Check if paragraph is a heading
      if (paragraph.startsWith("## ")) {
        const headingText = paragraph.replace("## ", "");
        const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (
          <div key={index}>
            {image && (
              <figure className="my-8">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
                  {image.caption}
                </figcaption>
              </figure>
            )}
            <h2
              id={headingId}
              className="text-2xl font-bold text-foreground mt-10 mb-4 scroll-mt-24"
            >
              {headingText}
            </h2>
          </div>
        );
      }

      // Regular paragraph
      return (
        <div key={index}>
          {image && (
            <figure className="my-8">
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover object-center"
                />
              </div>
              <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
                {image.caption}
              </figcaption>
            </figure>
          )}
          <p className="text-muted-foreground leading-relaxed mb-6">{paragraph}</p>
        </div>
      );
    });
  };

  const articleSchema = generateArticleSchema(post);
  const faqSchema = generateFAQSchema(post);
  const breadcrumbSchema = generateBreadcrumbSchema(post);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <main className="min-h-screen bg-background pt-32 pb-20">
        <article className="container mx-auto px-6 max-w-3xl">
          {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <span className="text-xs font-mono text-primary uppercase tracking-wider">
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {post.title}
          </h1>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        {/* Key Takeaways */}
        {post.keyTakeaways && post.keyTakeaways.length > 0 && (
          <div className="mb-10 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              {post.keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary mt-1 flex-shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-muted-foreground text-sm">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Table of Contents */}
        {post.tableOfContents && post.tableOfContents.length > 0 && (
          <nav className="mb-10 p-6 border border-border/50 rounded-lg">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Table of Contents
            </h2>
            <ul className="space-y-2">
              {post.tableOfContents.map((item, index) => (
                <li key={index}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <span className="text-primary font-mono text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          {renderContent()}
        </div>

        {/* FAQs */}
        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {post.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-6 border border-border/50 rounded-lg"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 p-8 border border-border/50 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Ready to optimize for AI search?
          </h3>
          <p className="text-muted-foreground mb-6">
            Get your free AEO assessment and see how your brand performs in AI-powered search.
          </p>
          <Link
            href="/#assessment"
            className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Free Assessment
          </Link>
        </div>
        </article>
      </main>
    </>
  );
}
