import { type Route } from "@rr/app/features/users/api/+types/edit-profile";
import { CheckCircle2, ImageIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Checkbox } from "~/core/components/ui/checkbox";
import { Label } from "~/core/components/ui/label";

export default function EditProfileForm({
  name,
  avatarUrl,
  marketingConsent,
}: {
  name: string;
  marketingConsent: boolean;
  avatarUrl: string | null;
}) {
  const { t } = useTranslation("common", { keyPrefix: "editProfile" });
  const fetcher = useFetcher<Route.ComponentProps["actionData"]>();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      formRef.current?.blur();
      formRef.current?.querySelectorAll("input").forEach((input) => {
        input.blur();
      });
    }
  }, [fetcher.data]);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const onChangeAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };
  return (
    <fetcher.Form
      method="post"
      className="w-full max-w-screen-md"
      encType="multipart/form-data"
      ref={formRef}
      action="/api/users/profile"
    >
      <NexCard variant="elevated" padding="lg">
        <NexCardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 p-3 shadow-lg">
              <UserIcon className="size-6 text-white" />
            </div>
            <div>
              <NexCardTitle>{t("title")}</NexCardTitle>
              <NexCardDescription>{t("description")}</NexCardDescription>
            </div>
          </div>
        </NexCardHeader>
        <NexCardContent>
          <div className="flex w-full flex-col gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 border border-purple-100 dark:border-purple-800/50">
              <Label
                htmlFor="avatar"
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="size-28 ring-4 ring-white dark:ring-gray-700 shadow-xl transition-transform group-hover:scale-105">
                    {avatar ? <AvatarImage src={avatar} alt="Avatar" /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/60 dark:to-blue-900/60">
                      <UserIcon className="text-purple-600 dark:text-purple-300 size-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full p-2 shadow-lg">
                    <ImageIcon className="size-4" />
                  </div>
                </div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t("avatar")}</span>
              </Label>
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-green-500 dark:text-green-400" />
                    {t("maxSize")}
                  </span>
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="size-4 text-green-500 dark:text-green-400" />
                    {t("allowedFormats")}
                  </span>
                </div>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  onChange={onChangeAvatar}
                  className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-blue-500 file:text-white hover:file:from-purple-600 hover:file:to-blue-600 file:cursor-pointer cursor-pointer file:transition-all"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="flex flex-col space-y-2">
              <NexInput
                id="name"
                name="name"
                required
                type="text"
                label={t("name")}
                placeholder="Nico"
                defaultValue={name}
                variant="outlined"
                inputSize="lg"
                leftIcon={<UserIcon className="size-5" />}
                error={
                  fetcher.data &&
                  "fieldErrors" in fetcher.data &&
                  fetcher.data.fieldErrors?.name
                    ? fetcher.data.fieldErrors.name[0]
                    : undefined
                }
              />
            </div>

            {/* Marketing Consent */}
            <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors">
              <Checkbox
                id="marketingConsent"
                name="marketingConsent"
                defaultChecked={marketingConsent}
                className="mt-1"
              />
              <Label htmlFor="marketingConsent" className="cursor-pointer flex-1">
                <span className="text-sm font-medium">{t("marketingConsent")}</span>
              </Label>
            </div>
            {fetcher.data &&
            "fieldErrors" in fetcher.data &&
            fetcher.data.fieldErrors?.marketingConsent ? (
              <FormErrors
                errors={fetcher.data?.fieldErrors?.marketingConsent}
              />
            ) : null}
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
            {t("saveProfile")}
          </NexButton>
          {fetcher.data && "success" in fetcher.data && fetcher.data.success ? (
            <FormSuccess message={t("profileUpdated")} />
          ) : null}
          {fetcher.data && "error" in fetcher.data && fetcher.data.error ? (
            <FormErrors errors={[fetcher.data.error]} />
          ) : null}
        </NexCardFooter>
      </NexCard>
    </fetcher.Form>
  );
}
