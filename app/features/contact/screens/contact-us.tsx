import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "~/core/components/ui/button";
import type { Route } from "./+types/contact-us";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Contact Us | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

export default function ContactUs() {
  const { t } = useTranslation("common", { keyPrefix: "common" });
 
  return (
    <div className="flex flex-col items-center gap-20">
      <div>
        <h1 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
          {t("contactTitle")}
        </h1>
        <p className="text-muted-foreground mt-2 text-center font-medium md:text-lg">
          {t("contactDescription")}
        </p>
        <div className="mt-14 text-center">
          <Button variant="outline" size="lg" asChild className="text-lg px-12 py-6 font-bold">
            <a
                href="mailto:jinu30dev@gmail.com"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                <Mail className="mr-2 h-5 w-5" />
                <span className="text-base font-bold">jinu30dev@gmail.com</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}