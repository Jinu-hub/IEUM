import type { Route } from "@rr/app/features/users/api/+types/delete-account";

import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

import FormErrors from "~/core/components/form-error";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Label } from "~/core/components/ui/label";

export default function DeleteAccountForm() {
  const { t } = useTranslation("common", { keyPrefix: "deleteAccount" });
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  return (
    <Card className="w-full max-w-screen-md bg-red-100 dark:bg-red-900/40">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <fetcher.Form method="delete" className="space-y-4" action="/api/users">
          <Label>
            <Checkbox
              id="confirm-delete"
              name="confirm-delete"
              required
              className="border-black dark:border-white"
            />
            {t("confirmDelete")}
          </Label>
          <Label>
            <Checkbox
              id="confirm-irreversible"
              name="confirm-irreversible"
              required
              className="border-black dark:border-white"
            />
            {t("confirmIrreversible")}
          </Label>
          <Button
            variant={"destructive"}
            className="w-full"
            disabled={fetcher.state === "submitting"}
          >
            {fetcher.state === "submitting" ? (
              <Loader2Icon className="ml-2 size-4 animate-spin" />
            ) : (
              t("deleteButton")
            )}
          </Button>
          {fetcher.data?.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}
