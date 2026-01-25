/**
 * Billing Country Selection Page
 *
 * Step 1 of the billing checkout flow.
 * Users select their billing country before proceeding to payment.
 *
 * Supported countries:
 * - Korea (KR): Full support
 * - Japan (JA): Coming soon
 * - Other (Global): Coming soon
 */
import type { Route } from "./+types/billing-country";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "~/core/components/ui/button";
import { PLAN_TYPE_LABEL } from "~/core/lib/constants";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";

/**
 * Validation schema for URL parameters
 */
const paramsSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `Select Country | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for authentication and plan validation
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const url = new URL(request.url);
  const result = paramsSchema.safeParse({
    plan: url.searchParams.get("plan"),
    interval: url.searchParams.get("interval") || "monthly",
  });

  if (!result.success) {
    throw redirect("/pricing");
  }

  const { plan, interval } = result.data;

  // Pro plan is not yet available - redirect to pricing page
  if (plan === "pro") {
    throw redirect("/pricing?error=pro_not_available");
  }

  return {
    plan,
    interval,
    planLabel: PLAN_TYPE_LABEL[plan],
  };
}

/**
 * Country option type
 */
type CountryOption = {
  id: string;
  code: string;
  name: string;
  flag: string;
  currency: string;
  supported: boolean;
};

/**
 * Available country options
 */
const COUNTRY_OPTIONS: CountryOption[] = [
  {
    id: "kr",
    code: "KR",
    name: "Korea",
    flag: "🇰🇷",
    currency: "KRW",
    supported: true,
  },
  {
    id: "jp",
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    currency: "JPY",
    supported: false,
  },
  {
    id: "global",
    code: "GLOBAL",
    name: "Other (Global)",
    flag: "🌍",
    currency: "USD",
    supported: false,
  },
];

/**
 * Billing Country Selection component
 */
export default function BillingCountry({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("common", { keyPrefix: "billing.country" });
  const { t: tCommon } = useTranslation("common", { keyPrefix: "common" });
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const selectedOption = COUNTRY_OPTIONS.find((c) => c.id === selectedCountry);
  const isSupported = selectedOption?.supported ?? false;
  const isGlobalOrJapan = selectedOption?.code === "GLOBAL" || selectedOption?.code === "JP";

  const handleContinue = () => {
    if (!selectedOption || !isSupported) return;

    navigate(
      `/payments/billing-checkout-toss?plan=${loaderData.plan}&interval=${loaderData.interval}&currency=${selectedOption.currency}&region=${selectedOption.code}`
    );
  };

  return (
    <div className="flex flex-col items-center gap-10 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("description", { plan: loaderData.planLabel })}
          </p>
        </div>

        {/* Country options */}
        <div className="w-full space-y-3">
          {COUNTRY_OPTIONS.map((country) => (
            <button
              key={country.id}
              type="button"
              onClick={() => setSelectedCountry(country.id)}
              className={cn(
                "relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
                selectedCountry === country.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                !country.supported && "opacity-70"
              )}
            >
              {/* Flag */}
              <span className="text-4xl">{country.flag}</span>

              {/* Country info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{country.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({country.code})
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {country.currency}
                </span>
              </div>

              {/* Coming soon badge */}
              {!country.supported && (
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t("comingSoon")}
                </span>
              )}

              {/* Selected indicator */}
              {selectedCountry === country.id && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-4" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Coming soon message - fixed height container */}
        <div className="h-20 w-full">
          <div
            className={cn(
              "w-full rounded-xl bg-amber-500/10 p-4 text-center transition-opacity duration-200",
              selectedCountry && !isSupported
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {selectedOption?.name || "This region"} {t("comingSoonMessage")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("comingSoonSubMessage")}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-2xl py-7 text-lg"
            onClick={handleContinue}
            disabled={!selectedCountry || !isSupported}
          >
            {t("continueToPayment")}
          </Button>

        {/*
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            asChild
          >
            <Link to="/pricing">{t("backToPlans")}</Link>
          </Button>
          */}
          <Button             
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => window.history.back()}
          >
            &larr; {tCommon("back")}
          </Button>
        </div>

        {/* Info note */}
        <p className="text-center text-xs text-muted-foreground">
          <GlobeIcon className="mr-1 inline-block size-3" />
          {t("infoNote")}
        </p>
      </div>
    </div>
  );
}
