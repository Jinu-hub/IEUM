import { Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardHeader,
  NexCardTitle,
} from "~/core/components/nex";
import { GithubLogo } from "~/features/auth/components/logos/github";
import { KakaoLogo } from "~/features/auth/components/logos/kakao";
import {
  ConnectProviderButton,
  DisconnectProviderButton,
} from "../connect-provider-buttons";

const enabledProviders = [
  {
    name: "Github",
    key: "github",
    logo: <GithubLogo />,
  },
  {
    name: "Kakao",
    key: "kakao",
    logo: <KakaoLogo />,
  },
];

export default function ConnectSocialAccountsForm({
  providers,
}: {
  providers: string[];
}) {
  const { t } = useTranslation("common", { keyPrefix: "connectSocialAccounts" });
  return (
    <NexCard variant="elevated" padding="lg" className="w-full max-w-screen-md">
      <NexCardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-3 shadow-lg">
            <Link2 className="size-6 text-white" />
          </div>
          <div>
            <NexCardTitle>{t("title")}</NexCardTitle>
            <NexCardDescription>
              {t("description")}
            </NexCardDescription>
          </div>
        </div>
      </NexCardHeader>
      <NexCardContent className="flex flex-col gap-4">
        {enabledProviders.map((provider) => {
          if (providers.includes(provider.key)) {
            return (
              <DisconnectProviderButton
                key={provider.key}
                provider={provider.name}
                logo={provider.logo}
                providerKey={provider.key}
              />
            );
          } else {
            return (
              <ConnectProviderButton
                key={provider.key}
                provider={provider.name}
                logo={provider.logo}
                providerKey={provider.key}
              />
            );
          }
        })}
      </NexCardContent>
    </NexCard>
  );
}
