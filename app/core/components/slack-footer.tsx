import { ExternalLink, Mail } from "lucide-react";
import { Link } from "react-router";
import { Actions } from "./navigation-bar";

export default function SlackFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-screen-2xl px-5 py-8 md:px-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-bold">IEUM for Slack</span>
          </div>

          {/* Center: main site link */}
          <Link
            to="/"
            reloadDocument
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Go to IEUM main site
          </Link>

          {/* Right: actions + legal */}
          <div className="flex items-center gap-4">
            <Actions />
            <span className="text-xs text-muted-foreground">|</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a href="/legal/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="/legal/terms-of-service" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="mailto:jinu30dev@gmail.com" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 LinkVerse. All rights reserved. IEUM is a service operated by LinkVerse.
        </div>
      </div>
    </footer>
  );
}
