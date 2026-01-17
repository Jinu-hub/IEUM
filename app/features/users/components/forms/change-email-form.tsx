import type { Route } from "@rr/app/features/users/api/+types/change-email";

import { ArrowDown, MailIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";

import { useTranslation } from "react-i18next";
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

export default function ChangeEmailForm({ email }: { email: string }) {
  const { t } = useTranslation("common", { keyPrefix: "changeEmail" });
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.reset();
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        if (!input.disabled) {
          input.blur();
        }
      });
    }
  }, [fetcher.data]);
  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      className="w-full max-w-screen-md"
      action="/api/users/email"
    >
      <NexCard variant="elevated" padding="lg">
        <NexCardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3 shadow-lg">
              <MailIcon className="size-6 text-white" />
            </div>
            <div>
              <NexCardTitle>{email ? t("title") : t("addEmailTitle")}</NexCardTitle>
              <NexCardDescription>
                {email
                  ? t("description")
                  : t("addEmailDescription")}
              </NexCardDescription>
            </div>
          </div>
        </NexCardHeader>
        <NexCardContent>
          <div className="flex w-full flex-col gap-6">
            {/* Current Email (Disabled) */}
            <div className="relative">
              <NexInput
                id="currentEmail"
                name="currentEmail"
                required
                type="email"
                disabled
                value={email}
                label={t("currentEmail")}
                variant="filled"
                inputSize="lg"
                leftIcon={<MailIcon className="size-5" />}
                className="cursor-not-allowed opacity-70"
              />
            </div>

            {/* Arrow Indicator */}
            <div className="flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3 shadow-lg">
                <ArrowDown className="size-5 text-white" />
              </div>
            </div>

            {/* New Email */}
            <div>
              <NexInput
                id="email"
                name="email"
                required
                type="email"
                label={t("newEmail")}
                placeholder="new-email@example.com"
                variant="outlined"
                inputSize="lg"
                leftIcon={<MailIcon className="size-5" />}
              />
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
            {email ? t("title") : t("addEmailTitle")}
          </NexButton>
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message={t("emailUpdateProcessStarted")} />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </NexCardFooter>
      </NexCard>
    </fetcher.Form>
  );
}
