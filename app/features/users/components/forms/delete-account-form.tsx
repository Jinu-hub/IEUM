import type { Route } from "@rr/app/features/users/api/+types/delete-account";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

import FormErrors from "~/core/components/form-error";
import {
  NexButton,
  NexCard,
  NexCardContent,
  NexCardHeader,
  NexCardTitle,
} from "~/core/components/nex";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Label } from "~/core/components/ui/label";

export default function DeleteAccountForm() {
  const { t } = useTranslation("common", { keyPrefix: "deleteAccount" });
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  return (
    <NexCard
      variant="default"
      padding="lg"
      className="w-full max-w-screen-md border-2 border-red-200 dark:border-red-600 bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-950/60 dark:via-gray-900/60 dark:to-gray-950/50"
    >
      <NexCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-500/80 dark:to-rose-500/80 p-3 shadow-lg animate-pulse">
            <AlertTriangle className="size-6 text-white" />
          </div>
          <div>
            <NexCardTitle className="text-red-800 dark:text-red-100">
              {t("title")}
            </NexCardTitle>
          </div>
        </div>
      </NexCardHeader>
      <NexCardContent>
        <fetcher.Form method="delete" className="space-y-6" action="/api/users">
          {/* Warning Box */}
          <div className="rounded-lg bg-red-50 dark:bg-red-900/25 p-4 border-l-4 border-red-500 dark:border-red-600">
            <p className="text-sm font-medium text-red-800 dark:text-red-100">
              {t("warning")}
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-100 dark:border-red-600 hover:border-red-300 dark:hover:border-red-500 transition-colors bg-white dark:bg-gray-900/70">
              <Checkbox
                id="confirm-delete"
                name="confirm-delete"
                required
                className="border-red-500 dark:border-red-300 mt-1"
              />
              <Label 
                htmlFor="confirm-delete" 
                className="cursor-pointer flex-1 text-sm text-gray-800 dark:text-gray-200"
              >
                {t("confirmDelete")}
              </Label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-100 dark:border-red-600 hover:border-red-300 dark:hover:border-red-500 transition-colors bg-white dark:bg-gray-900/70">
              <Checkbox
                id="confirm-irreversible"
                name="confirm-irreversible"
                required
                className="border-red-500 dark:border-red-300 mt-1"
              />
              <Label 
                htmlFor="confirm-irreversible" 
                className="cursor-pointer flex-1 text-sm text-gray-800 dark:text-gray-200"
              >
                {t("confirmIrreversible")}
              </Label>
            </div>
          </div>

          {/* Delete Button */}
          <NexButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 dark:from-red-500/85 dark:to-rose-500/85 dark:hover:from-red-500 dark:hover:to-rose-500 shadow-lg cursor-pointer"
            loading={fetcher.state === "submitting"}
            disabled={fetcher.state === "submitting"}
            leftIcon={<Trash2 className="size-5" />}
          >
            {t("deleteButton")}
          </NexButton>

          {fetcher.data?.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </fetcher.Form>
      </NexCardContent>
    </NexCard>
  );
}
