/**
 * Robots.txt Generator Module
 *
 * This module generates a robots.txt file that instructs search engine crawlers
 * which pages they should and shouldn't access. This helps protect private pages
 * and optimize crawl efficiency for better SEO performance.
 *
 * Protected paths include:
 * - User dashboard and private areas
 * - API endpoints
 * - Authentication pages
 * - Payment and checkout flows
 * - Development/debug pages
 */

export async function loader() {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const SITE_URL = process.env.SITE_URL;

  // Validate environment variable
  if (!SITE_URL) {
    throw new Error("SITE_URL environment variable is not defined");
  }

  // Base disallow rules for all environments
  const baseDisallowRules = [
    // Private user areas
    "Disallow: /dashboard",
    "Disallow: /account",
    "Disallow: /settings",
    "Disallow: /contents", // Sent mail history and user content
    
    // Payment and checkout
    "Disallow: /payments",
    
    // Authentication endpoints
    "Disallow: /auth",
    
    // API endpoints
    "Disallow: /api",
  ];

  // Additional disallow rules for development environment
  const developmentDisallowRules = isDevelopment
    ? [
        "Disallow: /debug", // Debug pages (Sentry, Analytics tests)
        "Disallow: /samples", // Component samples
        "Disallow: /components", // Component showcase
      ]
    : [];

  // Combine all disallow rules
  const allDisallowRules = [...baseDisallowRules, ...developmentDisallowRules];

  return new Response(
    `# robots.txt for ${SITE_URL}
# Generated dynamically based on environment

User-agent: *
${allDisallowRules.join("\n")}
Allow: /

# Crawl delay to be respectful to server resources
Crawl-delay: 1

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml`,
    {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    }
  );
}
