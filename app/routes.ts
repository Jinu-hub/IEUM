/**
 * Application Routes Configuration
 * 
 * This file defines all routes for the application using React Router's
 * file-based routing system. Routes are organized by feature and access level.
 * 
 * The structure uses layouts for shared UI elements and prefixes for route grouping.
 * This approach creates a hierarchical routing system that's both maintainable and scalable.
 */
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("/robots.txt", "core/screens/robots.ts"),
  route("/sitemap.xml", "core/screens/sitemap.ts"),
  route("/samples", "features/home/screens/samples.tsx"),
  
  // Debug routes - only available in non-production environments
  // Automatically disabled when NODE_ENV is set to "production"
  ...(process.env.NODE_ENV !== "production"
    ? prefix("/debug", [
        route("/sentry", "debug/sentry.tsx"),
        route("/analytics", "debug/analytics.tsx"),
      ])
    : []),

  // Admin routes - for internal monitoring
  ...prefix("/admin", [
    route("/monitoring", "features/admin/screens/monitoring.tsx"),
  ]),
  
  // API Routes. Routes that export actions and loaders but no UI.
  ...prefix("/api", [
    ...prefix("/settings", [
      route("/theme", "features/settings/api/set-theme.tsx"),
      route("/locale", "features/settings/api/set-locale.tsx"),
      route("/github-integration/:credentialRef", "features/settings/api/github-integration.tsx"),
      route("/github-callback", "features/settings/api/github-callback.tsx"),
      route("/github-webhook", "features/settings/api/github-webhook.tsx"),
      route("/slack-integration/:credentialRef", "features/settings/api/slack-integration.tsx"), 
      route("/slack-callback", "features/settings/api/slack-callback.tsx"),
      route("/slack-channel-members", "features/settings/api/slack-channel-members.tsx"),
      route("/update-review-step", "features/settings/api/update-review-step.tsx"),
      route("/update-onboarding-step", "features/settings/api/update-onboarding-step.tsx"),
      route("/review-sample-data", "features/settings/api/review-sample-data.tsx"),
    ]),
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
      route("/subscription/cancel", "features/users/api/cancel-subscription.ts"),
    ]),
    ...prefix("/cron", [
      route("/mailer", "features/cron/api/mailer.tsx"),
      route("/actions", "features/cron/api/actions.tsx"),
      route("/test", "features/cron/api/test-api.tsx"),
      route("/send-now", "features/cron/api/send-now.tsx"),
      route("/run-status", "features/cron/api/run-status.tsx"),
    ]),
    ...prefix("/blog", [route("/og", "features/blog/api/og.tsx")]),
    ...prefix("/stripe", [
      route("/webhook", "features/payments/api/stripe-webhook.ts"),
    ]),
  ]),

  layout("core/layouts/navigation.layout.tsx", [
    route("/auth/confirm", "features/auth/screens/confirm.tsx"),
    index("features/home/screens/home.tsx"),
    route("/error", "core/screens/error.tsx"),
    route("/components", "core/components/samples/samples.tsx"),
    route("/pricing", "features/home/screens/pricing.tsx"),
    route("/faq", "features/home/screens/faq.tsx"),
    route("/about", "features/home/screens/about.tsx"),
    route("/how-it-works", "features/home/screens/how-it-works.tsx"),
    layout("core/layouts/public.layout.tsx", [
      // Routes that should only be visible to unauthenticated users.
      route("/login", "features/auth/screens/login.tsx"),
      route("/join", "features/auth/screens/join.tsx"),
      ...prefix("/auth", [
        route("/api/resend", "features/auth/api/resend.tsx"),
        route(
          "/forgot-password/reset",
          "features/auth/screens/forgot-password.tsx",
        ),
        route("/magic-link", "features/auth/screens/magic-link.tsx"),
        ...prefix("/otp", [
          route("/start", "features/auth/screens/otp/start.tsx"),
          route("/complete", "features/auth/screens/otp/complete.tsx"),
        ]),
        ...prefix("/social", [
          route("/start/:provider", "features/auth/screens/social/start.tsx"),
          route(
            "/complete/:provider",
            "features/auth/screens/social/complete.tsx",
          ),
        ]),
      ]),
    ]),
    layout("core/layouts/private.layout.tsx", { id: "private-auth" }, [
      ...prefix("/auth", [
        route(
          "/forgot-password/create",
          "features/auth/screens/new-password.tsx",
        ),
        route("/email-verified", "features/auth/screens/email-verified.tsx"),
      ]),
      // Routes that should only be visible to authenticated users.
      route("/logout", "features/auth/screens/logout.tsx"),
    ]),
    route("/contact", "features/contact/screens/contact-us.tsx"),
    ...prefix("/payments", [
      route("/checkout", "features/payments/screens/checkout.tsx"),
      route("/billing-country", "features/payments/screens/billing-country.tsx"),
      route("/billing-checkout-toss", "features/payments/screens/billing-checkout-toss.tsx"),
      route("/billing-checkout-stripe", "features/payments/screens/billing-checkout-stripe.tsx"),
      layout("core/layouts/private.layout.tsx", { id: "private-payments" }, [
        route("/success", "features/payments/screens/success.tsx"),
        route("/failure", "features/payments/screens/failure.tsx"),
        route("/billing-success-toss", "features/payments/screens/billing-success-toss.tsx"),
        route("/billing-failure-toss", "features/payments/screens/billing-failure-toss.tsx"),
        route("/billing-success-stripe", "features/payments/screens/billing-success-stripe.tsx"),
        route("/billing-failure-stripe", "features/payments/screens/billing-failure-stripe.tsx"),
      ]),
    ]),
  ]),

  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("/analytics", "features/users/screens/analytics.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
        route("/test-klkl12", "features/users/screens/test1.tsx"),
      ]),
      ...prefix("/contents", [
        route("/sent-mail", "features/contents/screens/sent-mail.tsx"),  
        route("/sent-mail/:emailId", "features/contents/screens/sent-mail-detail.tsx"),
        /*
        route("/opportunities", "features/content/screens/opportunities.tsx"),
        route("/quotes", "features/content/screens/quotes.tsx"),
        route("/invoices", "features/content/screens/invoices.tsx"),
        route("/deals", "features/content/screens/deals.tsx"),
        */
      ]),
      ...prefix("/settings", [
        route("/integrations", "features/settings/screens/integrations.tsx"),
        route("/integrations-review", "features/settings/screens/integrations-review.tsx"),
        route("/targets", "features/settings/screens/targets.tsx"),
        route("/target/:targetId", "features/settings/screens/target-detail.tsx"),
        route("/mail-list", "features/settings/screens/mail-list.tsx"),
        route("/mail-list/:mailListId", "features/settings/screens/mail-list-members.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
  ]),

  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),
  layout("features/blog/layouts/blog.layout.tsx", [
    ...prefix("/blog", [
      index("features/blog/screens/posts.tsx"),
      route("/:slug", "features/blog/screens/post.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
