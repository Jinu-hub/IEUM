import type { Route } from "./+types/slack-navigation.layout";

import { Suspense } from "react";
import { Await, Outlet } from "react-router";

import SlackFooter from "../components/slack-footer";
import { NavigationBar } from "../components/navigation-bar";
import makeServerClient from "../lib/supa-client.server";

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userPromise = client.auth.getUser();
  return { userPromise };
}

export default function SlackNavigationLayout({ loaderData }: Route.ComponentProps) {
  const { userPromise } = loaderData;
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <Suspense fallback={<NavigationBar loading={true} homeHref="/slack" minimal />}>
        <Await resolve={userPromise}>
          {({ data: { user } }) =>
            user === null ? (
              <NavigationBar loading={false} homeHref="/slack" minimal />
            ) : (
              <NavigationBar
                name={user.user_metadata.name || "Anonymous"}
                email={user.email}
                avatarUrl={user.user_metadata.avatar_url}
                loading={false}
                homeHref="/slack"
                minimal
              />
            )
          }
        </Await>
      </Suspense>
      <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
        <Outlet />
      </div>
      <SlackFooter />
    </div>
  );
}
