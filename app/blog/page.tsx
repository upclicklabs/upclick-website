import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";

export const metadata = {
  title: "Blog | UpClick Labs",
  description: "Insights on Answer Engine Optimization, AI search, and getting your brand mentioned by AI.",
};

const breadcrumbSchema = {
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
  ],
};

export default function BlogPage() {
  const posts = getAllPosts();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "UpClick Labs Blog",
    description: "Insights on Answer Engine Optimization, AI search, and getting your brand mentioned by AI.",
    url: "https://upclicklabs.com/blog",
    publisher: {
      "@type": "Organization",
      name: "UpClick Labs",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://upclicklabs.com/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Insights on Answer Engine Optimization, AI search, and getting your brand mentioned by AI.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-6 border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
              >
                <span className="text-xs font-mono text-primary uppercase tracking-wider">
                  {post.category}
                </span>
                <h2 className="mt-3 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border/50 rounded-lg">
            <p className="text-muted-foreground">
              No articles yet. Check back soon!
            </p>
          </div>
        )}
      </div>
      </main>
    </>
  );
}
