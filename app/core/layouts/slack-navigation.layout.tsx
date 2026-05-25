import { Outlet } from "react-router";

import SlackFooter from "../components/slack-footer";
import { NavigationBarWithAuth } from "../components/navigation-bar-with-auth";

export default function SlackNavigationLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <NavigationBarWithAuth homeHref="/slack" minimal />
      <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
        <Outlet />
      </div>
      <SlackFooter />
    </div>
  );
}
