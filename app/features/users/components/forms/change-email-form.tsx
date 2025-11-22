import type { Route } from "@rr/app/features/users/api/+types/change-email";

import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";

import { useTranslation } from "react-i18next";
import FetcherFormButton from "~/core/components/fetcher-form-button";
import FormErrors from "~/core/components/form-error";
import FormSuccess from "~/core/components/form-success";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader,
  CardTitle
} from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

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
      <Card className="justify-between">
        <CardHeader>
          <CardTitle>{email ? t("title") : t("addEmailTitle")}</CardTitle>
          <CardDescription>
            {email
              ? t("description")
              : t("addEmailDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full flex-col gap-7">
            <div className="flex cursor-not-allowed flex-col items-start space-y-2">
              <Label
                htmlFor="currentEmail"
                className="flex flex-col items-start gap-1"
              >
                {t("currentEmail")}
              </Label>
              <Input
                id="currentEmail"
                name="currentEmail"
                required
                type="email"
                disabled
                value={email}
              />
            </div>
            <div className="flex flex-col items-start space-y-2">
              <Label
                htmlFor="email"
                className="flex flex-col items-start gap-1"
              >
                {t("newEmail")}
              </Label>
              <Input id="email" name="email" required type="email" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <FetcherFormButton
            label={email ? t("title") : t("addEmailTitle")}
            className="w-full"
            submitting={fetcher.state === "submitting"}
            disabled={fetcher.state === "submitting"}
          />
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message={t("emailUpdateProcessStarted")} />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
