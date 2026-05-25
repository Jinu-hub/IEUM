import { useEffect, useState } from "react";
import { useRouteLoaderData } from "react-router";

import { getSupabaseBrowserClient } from "~/core/lib/supa-client.browser";

import { NavigationBar } from "./navigation-bar";

type RootLoaderData = {
  supabasePublic?: { url: string; anonKey: string };
};

type AuthUser = {
  name: string;
  email?: string;
  avatarUrl?: string | null;
};

type NavigationBarWithAuthProps = {
  homeHref?: string;
  minimal?: boolean;
};

/**
 * Resolves the current user on the client so public layouts skip server-side getUser().
 */
export function NavigationBarWithAuth({
  homeHref = "/",
  minimal = false,
}: NavigationBarWithAuthProps) {
  const rootData = useRouteLoaderData("root") as RootLoaderData | undefined;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const url = rootData?.supabasePublic?.url;
    const anonKey = rootData?.supabasePublic?.anonKey;
    if (!url || !anonKey) {
      setResolved(true);
      return;
    }

    let cancelled = false;
    const client = getSupabaseBrowserClient(url, anonKey);

    client.auth.getUser().then(({ data: { user: authUser } }) => {
      if (cancelled) return;
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.name || "Anonymous",
          email: authUser.email,
          avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        });
      }
      setResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [rootData?.supabasePublic?.url, rootData?.supabasePublic?.anonKey]);

  if (!resolved) {
    return <NavigationBar loading homeHref={homeHref} minimal={minimal} />;
  }

  if (user) {
    return (
      <NavigationBar
        loading={false}
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
        homeHref={homeHref}
        minimal={minimal}
      />
    );
  }

  return <NavigationBar loading={false} homeHref={homeHref} minimal={minimal} />;
}
