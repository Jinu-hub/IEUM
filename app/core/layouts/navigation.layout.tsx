import { Outlet } from "react-router";

import Footer from "../components/footer";
import { NavigationBarWithAuth } from "../components/navigation-bar-with-auth";

export default function NavigationLayout() {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <NavigationBarWithAuth />
      <div className="mx-auto my-16 w-full max-w-screen-2xl px-5 md:my-32">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
