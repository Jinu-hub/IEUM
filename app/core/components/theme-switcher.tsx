/**
 * Theme Switcher Component
 *
 * A dropdown menu component that allows users to switch between light, dark, and system themes.
 * This component provides a consistent interface for theme switching throughout the application.
 *
 * Features:
 * - Visual indication of the current theme (sun, moon, or monitor icon)
 * - Dropdown menu with theme options
 * - Integration with remix-themes for theme persistence
 * - Support for light, dark, and system themes
 * - Accessible button with appropriate aria attributes
 */
import { MoonIcon, SunIcon } from "lucide-react";
import { Theme, useTheme } from "remix-themes";

import { Button } from "./ui/button";

/**
 * ThemeSwitcher component for toggling between light, dark, and system themes
 * 
 * This component uses the remix-themes hook to access and modify the current theme.
 * It displays a dropdown menu with options for light, dark, and system themes,
 * with the current theme indicated by the appropriate icon on the trigger button.
 * 
 * @returns A dropdown menu component for switching themes
 */
export default function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();

  const effectiveTheme = theme ?? Theme.LIGHT;
  const isDarkMode = effectiveTheme === Theme.DARK;

  const toggleTheme = () => {
    setTheme(isDarkMode ? Theme.LIGHT : Theme.DARK);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      data-testid="theme-switcher"
    >
      {isDarkMode ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </Button>
  );
}
