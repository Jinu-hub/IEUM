import type { Route } from "./+types/slack-home";

import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Hash,
  Info,
  Lock,
  LogIn,
  Mail,
  Megaphone,
  Rocket,
  Shield,
  ShieldCheck,
  Slack,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardHeader,
  NexCardTitle,
  NexCarousel,
  NexCarouselItem,
  NexHero,
  NexImageCard,
} from "~/core/components/nex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";

type PreviewSlide = {
  key: string;
  title: string;
  description: string;
};

const ONBOARDING_IMAGE_KEYS = [
  "1_login",
  "2_connect",
  "3_configure",
  "4_finish",
  "5_generate",
  "6_after_mail",
  "7_analytics",
] as const;

function getLocaleSuffix(lang: string): string {
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ko")) return "ko";
  return "en";
}

export const meta: Route.MetaFunction = () => {
  return [
    { title: "NexLetter for Slack" },
    {
      name: "description",
      content:
        "Get notified in Slack whenever your newsletter is generated. NexLetter posts weekly digest notifications directly to your Slack channel.",
    },
  ];
};

export default function SlackHome() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);

  const localeSuffix = "en";

  const PREVIEW_SLIDES: PreviewSlide[] = useMemo(
    () => [
      {
        key: "1_login",
        title: "1. Log in to NexLetter",
        description:
          "Sign in to NexLetter (or create an account) to start setting up your weekly digest.",
      },
      {
        key: "2_connect",
        title: "2. Connect Slack App",
        description:
          "From Settings → Integrations, connect Slack for NexLetter Slack App so NexLetter can read activity metadata.",
      },
      {
        key: "3_configure",
        title: "3. Configure your newsletter targets",
        description:
          "Choose which channels should be included in your weekly report.",
      },
      {
        key: "4_finish",
        title: "4. Finish setup and schedule",
        description:
          "Confirm the schedule, recipients, and Slack channel where notifications will be posted.",
      },
      {
        key: "5_generate",
        title: "5. NexLetter generates your digest",
        description:
          "On each cycle, NexLetter collects commits, PRs, conversations, and activity for the selected period.",
      },
      {
        key: "6_after_mail",
        title: "6. Email + Slack notification",
        description:
          "A full newsletter is sent via email, and a short notification is posted to your chosen Slack channel.",
      },
      {
        key: "7_analytics",
        title: "7. Review analytics and iterate",
        description:
          "Track opens and engagement, then adjust your configuration to keep reports focused and useful.",
      },
    ],
    []
  );

  useEffect(() => {
    if (i18n.language !== "en") {
      i18n.changeLanguage("en");
    }
  }, [i18n]);

  return (
    <div className="space-y-16">
      {/* ─── 1. Hero ─── */}
      <NexHero
        variant="split"
        title="NexLetter for Slack"
        subtitle="Get notified in Slack whenever your newsletter is generated."
        description={
          <>
            <span className="flex items-start gap-2">
              <span className="mt-1 text-base leading-none text-primary">•</span>
              <span>Log in to NexLetter and connect Slack.</span>
            </span>
            <span className="flex items-start gap-2">
              <span className="mt-1 text-base leading-none text-primary">•</span>
              <span>Go to Integrations → Slack → Connect (Install Slack App).</span>
            </span>
            <span className="flex items-start gap-2">
              <span className="mt-1 text-base leading-none text-primary">•</span>
              <span>Choose your channels and set a schedule.</span>
            </span>
            <span className="flex items-start gap-2">
              <span className="mt-1 text-base leading-none text-primary">•</span>
              <span>NexLetter posts when newsletter is ready.</span>
            </span>
          </>
        }
        actions={{
          primary: {
            label: "Log in to Connect Slack",
            variant: "primary",
            onClick: () => navigate("/login"),
          },
          secondary: {
            label: "Preview setup flow",
            variant: "secondary",
            onClick: () => setPreviewOpen(true),
          },
        }}
        media={{
          type: "image",
          src: "/hero/slack_app.png",
          width: 1200,
          height: 900,
          objectFit: "cover",
        }}
      />

      {/* ─── 2. How NexLetter Appears in Slack ─── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="info">How It Works</NexBadge>
          <h2 className="text-3xl font-bold">How NexLetter Appears in Slack</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            NexLetter posts a simple notification message in Slack when a
            newsletter is successfully generated.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Megaphone,
              title: 'Posts a "Newsletter sent" message',
              description:
                "A concise notification is posted to your selected Slack channel when a newsletter is generated.",
            },
            {
              icon: Calendar,
              title: "Displays the reporting period",
              description:
                "Each notification includes the date range (e.g. Feb 23 – Mar 2, 2026) for the generated report.",
            },
            {
              icon: Sparkles,
              title: "Includes a weekly summary",
              description:
                "An AI-generated summary of the week's key highlights is included directly in the Slack message.",
            },
            {
              icon: Info,
              title: "Guides you to the full version",
              description:
                "The message lets you know that the full newsletter is available on the NexLetter dashboard or via email.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NexCard key={item.title} variant="outlined" hoverable>
                <NexCardContent className="flex flex-col gap-3 p-6">
                  <div className="w-fit rounded-2xl bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>

        {/* Slack message mockup */}
        <div className="max-w-2xl mx-auto">
          <NexCard variant="elevated" className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#4A154B]/10 via-[#611f69]/5 to-transparent p-6 md:p-10">
              <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4A154B]">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">NexLetter</span>
                      <NexBadge variant="info" size="sm">APP</NexBadge>
                      <span className="text-xs text-muted-foreground">10:00 AM</span>
                    </div>
                    <p className="text-sm">
                      Your weekly newsletter has been generated successfully.
                    </p>
                    <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-primary">Weekly Team Digest</p>
                      <p className="text-xs text-muted-foreground">
                        Reporting period: Feb 23 – Mar 2, 2026
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Weekly Summary: This week, our biggest momentum came from strengthening the foundation under our OCR and Market Memory data...
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-primary font-medium">
                        <ExternalLink className="h-3 w-3" />
                        Check the NexLetter dashboard or email for details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="px-6 pb-4 text-center text-xs text-muted-foreground">
              Example of a weekly newsletter notification in Slack
            </p>
          </NexCard>
        </div>
      </section>

      {/* ─── 3. How to Install ─── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="success">Setup</NexBadge>
          <h2 className="text-3xl font-bold">How to Install</h2>
          <p className="text-muted-foreground">
            Connect NexLetter to your Slack workspace in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "1",
              icon: LogIn,
              title: "Log in to NexLetter",
              description: "Sign in to your NexLetter account or create one for free.",
            },
            {
              step: "2",
              icon: Slack,
              title: "Go to Slack Integration",
              description: "Navigate to Settings → Integrations → Slack.",
            },
            {
              step: "3",
              icon: Zap,
              title: 'Click "Connect" to Slack',
              description: "Authorize NexLetter to post to your Slack workspace and install the Slack app.",
            },
            {
              step: "4",
              icon: Hash,
              title: "Choose a Channel",
              description: "Select the channel where notifications will be posted.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NexCard key={item.step} variant="outlined" hoverable>
                <NexCardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5E6AD2] dark:bg-[#7C89F9] text-sm font-bold text-white dark:text-[#0D0E10]">
                      {item.step}
                    </span>
                    <div className="rounded-2xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-base font-semibold leading-tight">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact us at{" "}
          <a href="mailto:jinu30dev@gmail.com" className="font-medium text-primary hover:underline">
            jinu30dev@gmail.com
          </a>
        </p>
      </section>

      {/* ─── 4. When Does NexLetter Post to Slack? ─── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="warning">Triggers</NexBadge>
          <h2 className="text-3xl font-bold">When Does NexLetter Post to Slack?</h2>
          <p className="text-muted-foreground">
            NexLetter only posts when a newsletter event occurs — nothing more.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NexCard variant="elevated" hoverable>
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="rounded-2xl bg-green-500/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <NexCardTitle>Automatic Triggers</NexCardTitle>
                <NexCardDescription>
                  Messages are posted automatically when:
                </NexCardDescription>
              </div>
            </NexCardHeader>
            <NexCardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  A scheduled weekly newsletter run starts at the configured time
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  Sends the newsletter via email and Slack notification
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  After a newsletter is generated and sent, when you open its preview in NexLetter 
                </li>
              </ul>
            </NexCardContent>
          </NexCard>

          <NexCard variant="outlined" hoverable>
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="rounded-2xl bg-amber-500/10 p-3">
                <Info className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <NexCardTitle>Important Notice</NexCardTitle>
                <NexCardDescription>
                  NexLetter is a notification-only integration.
                </NexCardDescription>
              </div>
            </NexCardHeader>
            <NexCardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Does not respond to user messages or threads</li>
                <li>• Does not provide slash commands or interactive bots</li>
                <li>• Does not continuously monitor channels in real time</li>
                <li>• Does not search across your entire workspace history</li>
              </ul>
            </NexCardContent>
          </NexCard>
        </div>
      </section>

      {/* ─── 5. About NexLetter ─── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="secondary">About</NexBadge>
          <h2 className="text-3xl font-bold">About NexLetter</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered newsletter generator that summarizes team activity into a weekly digest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NexCard variant="elevated">
            <NexCardHeader>
              <NexCardTitle>What NexLetter does</NexCardTitle>
              <NexCardDescription>
                High-level overview of how NexLetter fits into your workflow.
              </NexCardDescription>
            </NexCardHeader>
            <NexCardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                NexLetter is an AI-powered newsletter generator that summarizes
                team activity from Slack and GitHub into a weekly digest.
              </p>
              <p>
                The Slack app serves as a{" "}
                <span className="font-semibold text-foreground">notification channel</span>,
                informing your team when a newsletter has been generated.
              </p>
              <ul className="space-y-2 pt-2">
                <li>• Summarizes commits, PRs, and code reviews from GitHub</li>
                <li>• Captures key Slack conversations and highlights</li>
                <li>• AI generates a human-readable weekly digest</li>
                <li>• Sends the newsletter via email and Slack notification</li>
              </ul>
            </NexCardContent>
          </NexCard>

          <NexCard variant="outlined">
            <NexCardHeader>
              <NexCardTitle>Architecture</NexCardTitle>
              <NexCardDescription>
                How the Slack app fits into NexLetter.
              </NexCardDescription>
            </NexCardHeader>
            <NexCardContent className="space-y-4">
              {[
                {
                  icon: Slack,
                  title: "Slack App",
                  description: "Notification and data source — collects channel activity for each newsletter period and posts a message when the digest is ready",
                  gradient: "from-[#4A154B] to-[#611f69]",
                },
                {
                  icon: Mail,
                  title: "NexLetter SaaS",
                  description: "Core platform — collects data, generates newsletters with AI",
                  gradient: "from-primary to-primary/70",
                },
                {
                  icon: Sparkles,
                  title: "AI Engine",
                  description: "Analyzes team activity and produces human-readable summaries",
                  gradient: "from-violet-500 to-purple-600",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </NexCardContent>
          </NexCard>
        </div>
      </section>

      {/* ─── 6. Permissions & Data Usage ─── */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <NexBadge variant="warning">Permissions</NexBadge>
          <h2 className="text-3xl font-bold">Permissions & Data Usage</h2>
          <p className="text-muted-foreground">
            NexLetter requests only the minimum permissions required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NexCard variant="elevated" hoverable>
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="rounded-2xl bg-green-500/10 p-3">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <NexCardTitle>What We Request</NexCardTitle>
                <NexCardDescription>
                  Minimum scopes for notification delivery
                </NexCardDescription>
              </div>
            </NexCardHeader>
            <NexCardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Post a notification message to a selected channel",
                  "Identify the installing workspace",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </NexCardContent>
          </NexCard>

          <NexCard variant="outlined" hoverable>
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="rounded-2xl bg-red-500/10 p-3">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <NexCardTitle>What We Never Do</NexCardTitle>
                <NexCardDescription>
                  Your workspace privacy is preserved
                </NexCardDescription>
              </div>
            </NexCardHeader>
            <NexCardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                "Use your Slack or GitHub data to train AI models",
                "Allow external AI providers to reuse your data beyond each request",
                "Store integration data longer than necessary for service and legal compliance",
                "Process messages outside the defined analysis window for each report",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </NexCardContent>
          </NexCard>
        </div>
      </section>

      {/* ─── 7. Security & Privacy ─── */}
      <section className="space-y-6">
        <div className="text-center space-y-3">
          <NexBadge variant="outline">Security</NexBadge>
          <h2 className="text-xl font-bold md:text-2xl">Security & Privacy</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "Minimum Permissions",
              description: "Only the scopes required to post notifications are requested.",
            },
            {
              icon: Shield,
              title: "Data Protection",
              description: "All communication encrypted via TLS. No Slack data is stored.",
            },
            {
              icon: ShieldCheck,
              title: "OAuth 2.0",
              description: "Industry-standard authentication. Revoke access anytime from Slack settings.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NexCard key={item.title} variant="outlined" hoverable>
                <NexCardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base font-semibold leading-tight">{item.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
                </NexCardContent>
              </NexCard>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <NexCard variant="outlined" hoverable className="h-full">
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="w-fit rounded-2xl bg-primary/10 p-3">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <NexCardTitle>Support</NexCardTitle>
                <NexCardDescription>
                  Questions? We&apos;re here to help.
                </NexCardDescription>
                <NexButton
                  variant="secondary"
                  size="sm"
                  className="mt-3 cursor-pointer"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </NexButton>
              </div>
            </NexCardHeader>
          </NexCard>
          <NexCard variant="outlined" hoverable className="h-full">
            <NexCardHeader className="flex flex-row items-start gap-4">
              <div className="w-fit rounded-2xl bg-primary/10 p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <NexCardTitle>Legal</NexCardTitle>
                <NexCardDescription>
                  Review our policies and terms of service.
                </NexCardDescription>
                <div className="mt-3 flex gap-2">
                  <NexButton
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => navigate("/legal/privacy-policy")}
                  >
                    Privacy Policy
                  </NexButton>
                  <NexButton
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => navigate("/legal/terms-of-service")}
                  >
                    Terms
                  </NexButton>
                </div>
              </div>
            </NexCardHeader>
          </NexCard>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section>
        <NexCard
          variant="elevated"
          className="p-8 shadow-xl shadow-primary/10 dark:bg-gradient-to-br dark:from-[#151822] dark:via-[#10121A] dark:to-[#0D0E10]"
        >
          <NexCardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <NexBadge variant="info">Get Started</NexBadge>
                </div>
              </div>
              <h3 className="text-3xl font-bold">
                Ready to connect NexLetter to Slack?
              </h3>
              <p className="text-muted-foreground">
                Log in and enable the Slack integration to start receiving
                newsletter notifications in your team&apos;s channel.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <NexButton
                variant="primary"
                className="cursor-pointer"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Log in to Connect Slack
              </NexButton>
              <NexButton
                variant="secondary"
                className="cursor-pointer"
                size="lg"
                onClick={() => setPreviewOpen(true)}
              >
                Preview setup flow
              </NexButton>
              <NexButton
                variant="gradient"
                className="cursor-pointer"
                size="lg"
                onClick={() => navigate("/join")}
              >
                Create Account
              </NexButton>
            </div>
          </NexCardContent>
        </NexCard>
      </section>

      {/* ─── Setup Flow Preview Dialog ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl w-[92vw] p-0 gap-0 max-h-[95vh] flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
            <DialogTitle className="text-lg">
              NexLetter setup flow
            </DialogTitle>
            <DialogDescription>
              See the end-to-end onboarding flow for NexLetter, including Slack connection and weekly digest delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4 overflow-y-auto min-h-0 flex-1">
            <NexCarousel
              showDots
              showArrows
              spaceBetween={0}
              infinite={false}
              className="w-full"
            >
              {PREVIEW_SLIDES.map((slide, index) => (
                <NexCarouselItem key={slide.key}>
                  <div className="space-y-3 px-6">
                    {/* eslint-disable-next-line jsx-a11y/alt-text 
                    <div className="overflow-hidden rounded-xl border border-border/40 shadow-sm mx-auto max-w-[960px] bg-muted/20">
                      <img
                        src={`/onboarding/${slide.key}_${localeSuffix}.png`}
                        alt={slide.title}
                        className="w-full h-auto object-contain"
                        draggable={false}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                    <div className="text-center px-4 pb-1">
                      <p className="text-xs font-medium text-primary mb-1">
                        {index + 1} / {PREVIEW_SLIDES.length}
                      </p>
                      <p className="text-base font-semibold">{slide.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {slide.description}
                      </p>
                    </div>
                    */}
                    <NexImageCard
                      image={{
                        src: `/onboarding/${slide.key}_${localeSuffix}.png`,
                        alt: slide.title,
                        aspectRatio: "video",
                      }}
                      title={slide.title}
                      description={slide.description
                        .split(/<br\s*\/?>/i)
                        .map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      badge={{
                        text: `${index + 1} / ${PREVIEW_SLIDES.length}`,
                        variant: "secondary",
                      }}
                    />
                  </div>
                </NexCarouselItem>
              ))}
            </NexCarousel>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
