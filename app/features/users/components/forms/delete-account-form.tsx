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
      className="w-full max-w-screen-md border-2 border-pink-200 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30"
    >
      <NexCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-pink-400 to-rose-400 p-3 shadow-lg animate-pulse">
            <AlertTriangle className="size-6 text-white" />
          </div>
          <div>
            <NexCardTitle className="text-pink-800 dark:text-pink-200">
              {t("title")}
            </NexCardTitle>
          </div>
        </div>
      </NexCardHeader>
      <NexCardContent>
        <fetcher.Form method="delete" className="space-y-6" action="/api/users">
          {/* Warning Box */}
          <div className="rounded-lg bg-pink-50 dark:bg-pink-900/20 p-4 border-l-4 border-pink-400">
            <p className="text-sm font-medium text-pink-800 dark:text-pink-200">
              {t("warning")}
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-pink-100 dark:border-pink-700 hover:border-pink-300 dark:hover:border-pink-500 transition-colors bg-white dark:bg-gray-900">
              <Checkbox
                id="confirm-delete"
                name="confirm-delete"
                required
                className="border-pink-400 dark:border-pink-400 mt-1"
              />
              <Label 
                htmlFor="confirm-delete" 
                className="cursor-pointer flex-1 text-sm text-gray-800 dark:text-gray-200"
              >
                {t("confirmDelete")}
              </Label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-pink-100 dark:border-pink-700 hover:border-pink-300 dark:hover:border-pink-500 transition-colors bg-white dark:bg-gray-900">
              <Checkbox
                id="confirm-irreversible"
                name="confirm-irreversible"
                required
                className="border-pink-400 dark:border-pink-400 mt-1"
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
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 dark:from-pink-600 dark:to-rose-600 dark:hover:from-pink-700 dark:hover:to-rose-700 shadow-lg cursor-pointer"
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
