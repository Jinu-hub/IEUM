/**
 * Linear Design System Theme Configuration
 * 
 * This file contains the complete theme configuration based on Linear.app's design system.
 * It provides centralized access to colors, typography, spacing, animations, and component styles.
 */

export const linearTheme = {
  theme: {
    name: "Linear Design System",
    version: "1.0",
    description: "Linear.app의 디자인 시스템을 기반으로 한 테마 데이터"
  },
  colors: {
    brand: {
      primary: "#5E6AD2",
      secondary: "#8B92D6",
      accent: "#4C566A"
    },
    background: {
      primary: "#FFFFFF",
      secondary: "#F8F9FA",
      tertiary: "#F1F2F4",
      dark: "#0D0E10",
      darkSecondary: "#1A1B1E",
      darkTertiary: "#2C2D30"
    },
    text: {
      primary: "#0D0E10",
      secondary: "#5E6AD2",
      muted: "#8B92B5",
      light: "#FFFFFF",
      darkPrimary: "#FFFFFF",
      darkSecondary: "#B4B5B9",
      darkMuted: "#6C6F7E"
    },
    border: {
      light: "#E1E4E8",
      medium: "#D1D5DB",
      dark: "#374151",
      accent: "#5E6AD2",
      darkLight: "#2C2D30",
      darkMedium: "#404040",
      darkAccent: "#7C89F9"
    },
    status: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6"
    },
    gradients: {
      hero: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      card: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      button: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      blue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }
  },
  typography: {
    fontFamilies: {
      primary: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace",
      display: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    },
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem"
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em"
    }
  },
  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
    40: "10rem",
    48: "12rem",
    56: "14rem",
    64: "16rem"
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    default: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px"
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    default: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    outline: "0 0 0 3px rgba(94, 106, 210, 0.5)"
  },
  components: {
    button: {
      primary: {
        background: "#5E6AD2",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "0.375rem",
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
        hover: {
          background: "#4C566A",
          transform: "translateY(-1px)",
          shadow: "0 4px 12px rgba(94, 106, 210, 0.4)"
        }
      },
      secondary: {
        background: "transparent",
        color: "#5E6AD2",
        border: "1px solid #E1E4E8",
        borderRadius: "0.375rem",
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
        hover: {
          background: "#F8F9FA",
          borderColor: "#5E6AD2"
        }
      },
      ghost: {
        background: "transparent",
        color: "#0D0E10",
        border: "none",
        borderRadius: "0.375rem",
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "all 0.2s ease-in-out",
        hover: {
          background: "#F8F9FA"
        }
      }
    },
    card: {
      background: "#FFFFFF",
      border: "1px solid #E1E4E8",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      shadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      transition: "all 0.2s ease-in-out",
      hover: {
        shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transform: "translateY(-2px)"
      }
    },
    input: {
      background: "#FFFFFF",
      border: "1px solid #E1E4E8",
      borderRadius: "0.375rem",
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      color: "#0D0E10",
      transition: "all 0.2s ease-in-out",
      focus: {
        borderColor: "#5E6AD2",
        boxShadow: "0 0 0 3px rgba(94, 106, 210, 0.1)",
        outline: "none"
      }
    },
    navbar: {
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      height: "60px",
      padding: "0 2rem"
    }
  },
  animations: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms"
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    keyframes: {
      fadeIn: {
        "0%": { opacity: "0", transform: "translateY(10px)" },
        "100%": { opacity: "1", transform: "translateY(0)" }
      },
      slideIn: {
        "0%": { transform: "translateX(-100%)" },
        "100%": { transform: "translateX(0)" }
      },
      float: {
        "0%, 100%": { transform: "translateY(0px)" },
        "50%": { transform: "translateY(-10px)" }
      }
    }
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070
  }
} as const;

export type LinearTheme = typeof linearTheme;

// CSS Custom Properties Generator
export const generateCSSVariables = (theme: LinearTheme) => {
  const cssVars: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([name, value]) => {
      cssVars[`--color-${category}-${name}`] = value;
    });
  });
  
  // Typography
  Object.entries(theme.typography.fontSizes).forEach(([name, value]) => {
    cssVars[`--font-size-${name}`] = value;
  });
  
  Object.entries(theme.typography.fontWeights).forEach(([name, value]) => {
    cssVars[`--font-weight-${name}`] = value.toString();
  });
  
  // Spacing
  Object.entries(theme.spacing).forEach(([name, value]) => {
    cssVars[`--spacing-${name}`] = value;
  });
  
  // Border Radius
  Object.entries(theme.borderRadius).forEach(([name, value]) => {
    cssVars[`--border-radius-${name}`] = value;
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([name, value]) => {
    cssVars[`--shadow-${name}`] = value;
  });
  
  return cssVars;
};
