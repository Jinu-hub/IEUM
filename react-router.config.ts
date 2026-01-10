import type { Config } from "@react-router/dev/config";

import { sentryOnBuildEnd } from "@sentry/react-router";
import { vercelPreset } from "@vercel/react-router/vite";
import { readdir } from "node:fs/promises";
import path from "node:path";

declare module "react-router" {
  interface Future {
    unstable_middleware: true;
  }
}

/**
 * Scan blog directory for MDX files and generate URLs
 * Returns empty array if directory read fails
 */
async function getBlogUrls(): Promise<string[]> {
  try {
    const blogFiles = await readdir(
      path.join(process.cwd(), "app", "features", "blog", "docs")
    );
    return blogFiles
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => `/blog/${file.replace(".mdx", "")}`);
  } catch (error) {
    console.warn("Failed to read blog directory:", error);
    return [];
  }
}

/**
 * Scan legal directory for MDX files and generate URLs
 * Returns empty array if directory read fails
 * 
 * Note: Removes locale suffixes (_en, _ja, _ko) to avoid duplicate routes
 * since the policy loader handles locale resolution dynamically
 */
async function getLegalUrls(): Promise<string[]> {
  try {
    const legalFiles = await readdir(
      path.join(process.cwd(), "app", "features", "legal", "docs")
    );
    
    // Get unique slugs by removing locale suffixes (_en, _ja, _ko)
    const uniqueSlugs = new Set<string>();
    
    legalFiles
      .filter((file) => file.endsWith(".mdx"))
      .forEach((file) => {
        // Remove .mdx extension
        const nameWithoutExt = file.replace(".mdx", "");
        // Remove locale suffix (_en, _ja, _ko) if present
        const slug = nameWithoutExt.replace(/_(en|ja|ko)$/, "");
        uniqueSlugs.add(slug);
      });
    
    return Array.from(uniqueSlugs).map((slug) => `/legal/${slug}`);
  } catch (error) {
    console.warn("Failed to read legal directory:", error);
    return [];
  }
}

export default {
  /**
   * Enable Server-Side Rendering for better SEO and initial load performance
   */
  ssr: true,

  /**
   * Pre-render static pages at build time for optimal performance
   * These pages will be served as static HTML from CDN
   */
  async prerender() {
    const blogUrls = await getBlogUrls();
    const legalUrls = await getLegalUrls();

    return [
      // Core pages - highest priority
      "/", // Homepage
      "/pricing", // Pricing page
      "/about", // About page
      "/faq", // FAQ page
      "/contact", // Contact page

      // Blog pages
      "/blog", // Blog index
      ...blogUrls, // Individual blog posts

      // Legal pages - dynamically scanned
      ...legalUrls,

      // SEO files
      "/sitemap.xml",
      "/robots.txt",
    ];
  },

  /**
   * Apply Vercel-specific optimizations in production
   */
  presets: [
    ...(process.env.VERCEL_ENV === "production" ? [vercelPreset()] : []),
  ],

  /**
   * Upload source maps to Sentry after build for better error tracking
   * Only runs if Sentry credentials are configured
   */
  buildEnd: async ({ viteConfig, reactRouterConfig, buildManifest }) => {
    if (
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      process.env.SENTRY_AUTH_TOKEN
    ) {
      await sentryOnBuildEnd({
        viteConfig,
        reactRouterConfig,
        buildManifest,
      });
    }
  },
} satisfies Config;
