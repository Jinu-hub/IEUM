/**
 * Sitemap Generator Module
 *
 * This module dynamically generates an XML sitemap for the application by scanning
 * content directories and combining them with static routes. The sitemap helps search
 * engines discover and index the application's pages, improving SEO performance.
 *
 * The module automatically includes:
 * - Blog posts from MDX files in the blog directory
 * - Legal pages from MDX files in the legal directory
 * - Custom static routes defined in the code
 *
 * The sitemap is generated on-demand when the route is accessed, ensuring it always
 * contains the latest content without requiring a rebuild of the application.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * URL entry configuration for sitemap
 */
interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Sitemap generator loader function
 * 
 * This React Router loader function dynamically generates an XML sitemap for the application.
 * It scans the filesystem for content files, combines them with static routes, and formats
 * them according to the sitemap protocol specification.
 * 
 * The function performs these steps:
 * 1. Gets the site domain from environment variables
 * 2. Scans the blog directory for MDX files and converts filenames to URLs
 * 3. Scans the legal directory for MDX files and converts filenames to URLs
 * 4. Combines these with static routes like homepage, login, and registration
 * 5. Formats all URLs according to the sitemap XML specification
 * 6. Returns an XML response with the proper content type header
 * 
 * @returns {Response} XML response containing the sitemap
 */
export async function loader() {
  // Get the site domain from environment variables
  const DOMAIN = process.env.SITE_URL;

  // Validate environment variable
  if (!DOMAIN) {
    throw new Error("SITE_URL environment variable is not defined");
  }

  // Initialize URL arrays
  let blogUrls: SitemapUrl[] = [];
  let legalUrls: SitemapUrl[] = [];

  // Scan the blog directory for MDX files and convert to URLs with error handling
  try {
    const blogFiles = await readdir(
      path.join(process.cwd(), "app", "features", "blog", "docs")
    );
    blogUrls = blogFiles
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => ({
        loc: `/blog/${file.replace(".mdx", "")}`,
        changefreq: "weekly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.warn("Failed to read blog directory:", error);
  }

  // Scan the legal directory for MDX files and convert to URLs with error handling
  try {
    const legalFiles = await readdir(
      path.join(process.cwd(), "app", "features", "legal", "docs")
    );
    legalUrls = legalFiles
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => ({
        loc: `/legal/${file.replace(".mdx", "")}`,
        changefreq: "yearly" as const,
        priority: 0.3,
      }));
  } catch (error) {
    console.warn("Failed to read legal directory:", error);
  }

  // Define static routes that should be included in the sitemap with SEO metadata
  const customUrls: SitemapUrl[] = [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: "/pricing",
      changefreq: "weekly",
      priority: 0.9,
    },
    {
      loc: "/about",
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      loc: "/contact",
      changefreq: "monthly",
      priority: 0.7,
    },
    {
      loc: "/how-it-works",
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      loc: "/faq",
      changefreq: "monthly",
      priority: 0.6,
    },
    {
      loc: "/login",
      changefreq: "yearly",
      priority: 0.4,
    },
    {
      loc: "/join",
      changefreq: "yearly",
      priority: 0.5,
    },
  ];

  // Get current date for lastmod
  const currentDate = new Date().toISOString();

  // Combine all URLs and format them according to sitemap protocol
  const allUrls = [...blogUrls, ...legalUrls, ...customUrls];
  const sitemapUrls = allUrls.map((url) => {
    return `  <url>
    <loc>${DOMAIN}${url.loc}</loc>
    <lastmod>${url.lastmod || currentDate}</lastmod>${
      url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ""
    }${url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : ""}
  </url>`;
  });

  // Return an XML response with the sitemap
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${sitemapUrls.join("\n")}
</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    }
  );
}
