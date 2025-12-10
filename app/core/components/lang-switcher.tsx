/**
 * Language Switcher Component
 *
 * A dropdown menu component that allows users to switch between different application languages.
 * This component provides internationalization (i18n) support throughout the application.
 *
 * Features:
 * - Visual indication of the current language with country flag emoji
 * - Dropdown menu with language options
 * - Integration with i18next for language switching
 * - Server-side persistence of language preference
 * - Support for multiple languages (English, Korean, Spanish)
 * - Translated language names in the current language
 */
import { useTranslation } from "react-i18next";
import { useFetcher, useLocation } from "react-router";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LangSwitcherProps {
  /** Force display a specific language code (disables dropdown) */
  forcedLanguage?: 'en' | 'ko' | 'ja';
  /** Disable the language switcher */
  disabled?: boolean;
}

/**
 * LangSwitcher component for changing the application language
 * 
 * This component uses i18next and React Router to handle language switching.
 * It displays a dropdown menu with language options, with the current language
 * indicated by the appropriate country flag emoji on the trigger button.
 * 
 * When a language is selected, it:
 * 1. Changes the language in the i18n context (client-side)
 * 2. Persists the language preference on the server via an API call
 * 
 * @returns A dropdown menu component for switching languages
 */
export default function LangSwitcher({ forcedLanguage, disabled }: LangSwitcherProps = {}) {
  // Get translation function and i18n instance
  const { t, i18n } = useTranslation();
  
  // Get fetcher for making API requests
  const fetcher = useFetcher();
  
  // Check if on review page to force English
  const location = useLocation();
  const isReviewPage = location.pathname.includes('/integrations-review');
  const effectiveForcedLanguage = isReviewPage ? 'en' : forcedLanguage;
  
  /**
   * Handle language change by updating both client and server state
   * @param locale - The language code to switch to (e.g., 'en', 'ko', 'es')
   */
  const handleLocaleChange = async (locale: string) => {
    // Change language in i18n context (client-side)
    i18n.changeLanguage(locale);
    
    // Persist language preference on the server
    await fetcher.submit(null, {
      method: "POST",
      action: "/api/settings/locale?locale=" + locale,
    });
  };

  // Get display language (forced or current)
  const displayLanguage = effectiveForcedLanguage || i18n.language;
  const displayText = displayLanguage === "en"
    ? "EN"
    : displayLanguage === "ko"
      ? "KR"
      : displayLanguage === "ja"
        ? "JP"
        : "EN";

  // If forced or disabled, render a static button
  if (effectiveForcedLanguage || disabled) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-lg cursor-not-allowed opacity-70"
        disabled
      >
        {displayText}
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      {/* Dropdown trigger button with current language flag */}
      <DropdownMenuTrigger
        asChild
        className="cursor-pointer"
        data-testid="lang-switcher" // For testing purposes
      >
        <Button variant="ghost" size="icon" className="text-lg">
          {/* Conditionally render the appropriate flag based on current language */}
          {displayText}
        </Button>
      </DropdownMenuTrigger>
      
      {/* Dropdown menu with language options */}
      <DropdownMenuContent align="end">
        {/* Japanese language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("ja")}>
          JP {t("navigation.ja")} {/* Translated name of Japanese */}
        </DropdownMenuItem>
        
        {/* Korean language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("ko")}>
          KR {t("navigation.kr")} {/* Translated name of Korean */}
        </DropdownMenuItem>
        
        {/* English language option */}
        <DropdownMenuItem onClick={() => handleLocaleChange("en")}>
          EN {t("navigation.en")} {/* Translated name of English */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
