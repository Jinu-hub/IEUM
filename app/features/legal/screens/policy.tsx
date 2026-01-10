/**
 * Legal Policy Page Component
 * 
 * This file implements a dynamic legal document page that renders MDX content.
 * It's designed to display various legal documents (privacy policy, terms of service, etc.)
 * from MDX files with consistent styling and navigation.
 * 
 * Key features:
 * - Dynamic MDX content loading based on URL parameters
 * - Frontmatter extraction for metadata (title, description)
 * - Consistent typography and styling for legal documents
 * - SEO-friendly metadata
 * - Proper error handling for missing documents
 */

import type { Route } from "./+types/policy";

import { bundleMDX } from "mdx-bundler";
import { getMDXComponent } from "mdx-bundler/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { data } from "react-router";
import i18next from "~/core/lib/i18next.server";

import { useTranslation } from "react-i18next";
import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyList,
  TypographyOrderedList,
  TypographyP,
} from "~/core/components/mdx-typography"; // Typography components for consistent MDX styling
import { Button } from "~/core/components/ui/button";

/**
 * Meta function for setting page metadata
 * 
 * This function generates SEO-friendly metadata for legal policy pages.
 * It handles two scenarios:
 * 1. When data is available (valid policy page):
 *    - Sets page title using the document's frontmatter title
 *    - Sets meta description using the document's frontmatter description
 * 2. When data is not available (404 error):
 *    - Sets a 404 page title
 * 
 * This approach ensures proper SEO for both valid pages and error states.
 * 
 * @param data - Data returned from the loader function containing MDX frontmatter
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  // Handle case where the policy document doesn't exist (404)
  if (!data) {
    return [
      {
        title: `404 Page Not Found | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }
  
  // For valid policy documents, use frontmatter for metadata
  return [
    {
      title: `${data.frontmatter.title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    {
      name: "description",
      content: data.frontmatter.description,
    },
  ];
};

/**
 * Placeholder values for legal documents
 * These values will replace placeholders in the MDX files
 */
const PLACEHOLDERS: Record<string, string> = {
  'YYYY-MM-DD': '2026-01-01',
  'support email': import.meta.env.VITE_SUPPORT_EMAIL || 'support@nexletter.com',
  'company name': 'NexLetter',
  'company address': 'Seoul, South Korea',
  'service URL': import.meta.env.VITE_SERVICE_URL || 'https://nexletter.com',
  'company or service provider': 'LinkVerse',
  // Add more placeholders as needed
};

/**
 * Replace placeholders in content with actual values
 * Placeholders are in the format {{placeholder name}}
 * 
 * @param content - The content with placeholders
 * @returns Content with placeholders replaced by actual values
 */
function replacePlaceholders(content: string): string {
  let result = content;
  
  for (const [key, value] of Object.entries(PLACEHOLDERS)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    result = result.replace(placeholder, value);
  }
  
  return result;
}

/**
 * Loader function for fetching and processing MDX content
 * 
 * This function performs several key operations:
 * 1. Constructs the file path to the requested legal document based on URL params
 * 2. Loads the MDX file and replaces placeholders with actual values
 * 3. Bundles the processed MDX content
 * 4. Extracts frontmatter metadata and compiled code
 * 5. Handles errors with appropriate HTTP status codes
 * 
 * Error handling:
 * - Returns 404 for missing documents (ENOENT errors)
 * - Returns 500 for other processing errors
 * 
 * @param request - The incoming HTTP request
 * @param params - URL parameters containing the document slug
 * @returns Object with frontmatter metadata and compiled MDX code
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  // Get the user's locale from the request (cookie or URL parameter)
  const locale = await i18next.getLocale(request);

  // デバッグ: cookieとheaderを確認
  const cookieHeader = request.headers.get('Cookie');
  const acceptLanguage = request.headers.get('Accept-Language');
  console.log('🔍 Locale detection debug:', {
    detectedLocale: locale,
    cookieHeader,
    acceptLanguage,
    url: request.url,
  });

  const filename = `${params.slug}_${locale}.mdx`;
  
  // Construct the file path to the requested legal document
  const filePath = path.join(
    process.cwd(),
    "app",
    "features",
    "legal",
    "docs",
    filename, // Use the slug from URL params to find the correct document
  );
  
  try {
    // Read the MDX file content
    const fileContent = await readFile(filePath, 'utf-8');
    
    // Replace placeholders with actual values
    const processedContent = replacePlaceholders(fileContent);
    
    // Bundle the processed MDX content
    const { code, frontmatter } = await bundleMDX({
      source: processedContent,
    });
    
    // Return the compiled code and frontmatter metadata
    return {
      frontmatter,
      code,
    };
  } catch (error) {
    // Handle file not found errors with 404 status
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw data(null, { status: 404 });
    }
    // Handle all other errors with 500 status
    throw data(null, { status: 500 });
  }
}

/**
 * Policy page component for rendering legal documents
 * 
 * This component renders MDX content with consistent styling for legal documents.
 * It provides:
 * 1. A navigation button to return to the home page
 * 2. The MDX content with styled typography components
 * 3. Responsive layout with appropriate spacing and width constraints
 * 
 * The component uses the getMDXComponent function to transform the compiled MDX code
 * into a React component, then applies custom typography components to ensure
 * consistent styling across all legal documents.
 * 
 * @param loaderData - Data from the loader containing frontmatter and compiled MDX code
 * @returns JSX element representing the policy page
 */
export default function Policy({
  loaderData: { frontmatter, code },
}: Route.ComponentProps) {
  // Convert the compiled MDX code into a React component
  const MDXContent = getMDXComponent(code);
  const { t } = useTranslation("common", { keyPrefix: "common" });
  
  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-10 px-5 py-10 md:px-10 md:py-20">
      {/* Navigation button to go back */}
      {/* Using window.history.back() instead of navigate(-1) to ensure proper */}
      {/* locale and auth state are preserved (avoiding prerendered page cache) */}
      <Button variant="outline" onClick={() => window.history.back()}>
        &larr; {t("back")}
      </Button>
      
      {/* MDX content container */}
      <div>
        <MDXContent
          components={{
            // Map MDX elements to custom typography components
            // This ensures consistent styling across all legal documents
            h1: TypographyH1,
            h2: TypographyH2,
            h3: TypographyH3,
            h4: TypographyH4,
            p: TypographyP,
            blockquote: TypographyBlockquote,
            ul: TypographyList,
            ol: TypographyOrderedList,
            code: TypographyInlineCode,
          }}
        />
      </div>
    </div>
  );
}
