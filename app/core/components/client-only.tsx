import { useEffect, useState, type ReactNode } from "react";

type ClientOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Renders children only after mount — keeps heavy client-only UI out of SSR.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
