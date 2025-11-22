import type { Route } from "@rr/app/features/users/api/+types/change-password";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import {
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardFooter,
  NexCardHeader,
  NexCardTitle,
  NexInput,
} from "~/core/components/nex";

export default function ChangePasswordForm({
  hasPassword,
}: {
  hasPassword: boolean;
}) {
  const { t } = useTranslation("common", { keyPrefix: "changePassword" });
  const formRef = useRef<HTMLFormElement>(null);
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
  }, [fetcher.data]);
  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      className="w-full max-w-screen-md"
      action="/api/users/password"
    >
      <NexCard variant="elevated" padding="lg">
        <NexCardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-3 shadow-lg">
              <ShieldCheck className="size-6 text-white" />
            </div>
            <div>
              <NexCardTitle>
                {hasPassword ? t("title") : t("addPasswordTitle")}
              </NexCardTitle>
              <NexCardDescription>
                {hasPassword
                  ? t("description")
                  : t("addPasswordDescription")}
              </NexCardDescription>
            </div>
          </div>
        </NexCardHeader>
        <NexCardContent>
          <div className="flex w-full flex-col gap-6">
            {/* New Password */}
            <div className="flex flex-col space-y-2">
              <NexInput
                id="password"
                name="password"
                required
                type="password"
                label={t("newPassword")}
                placeholder="••••••••"
                variant="outlined"
                inputSize="lg"
                leftIcon={<KeyRound className="size-5" />}
                error={
                  fetcher.data &&
                  "fieldErrors" in fetcher.data &&
                  fetcher.data.fieldErrors?.password
                    ? fetcher.data.fieldErrors.password[0]
                    : undefined
                }
              />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col space-y-2">
              <NexInput
                id="confirmPassword"
                name="confirmPassword"
                required
                type="password"
                label={t("confirmNewPassword")}
                placeholder="••••••••"
                variant="outlined"
                inputSize="lg"
                leftIcon={<ShieldCheck className="size-5" />}
                error={
                  fetcher.data &&
                  "fieldErrors" in fetcher.data &&
                  fetcher.data.fieldErrors?.confirmPassword
                    ? fetcher.data.fieldErrors.confirmPassword[0]
                    : undefined
                }
              />
            </div>

            {/* Password Requirements */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                {t("passwordRequirements")}
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>{t("passwordRequirementsLength")}</li>
                <li>{t("passwordRequirementsUppercaseAndLowercase")}</li>
                <li>{t("passwordRequirementsNumber")}</li>
              </ul>
            </div>
          </div>
        </NexCardContent>
        <NexCardFooter className="flex flex-col gap-4">
          <NexButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full cursor-pointer"
            loading={fetcher.state === "submitting"}
            disabled={fetcher.state === "submitting"}
          >
            {hasPassword ? t("title") : t("addPasswordTitle")}
          </NexButton>
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message={t("successMessage")} />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </NexCardFooter>
      </NexCard>
    </fetcher.Form>
  );
}
