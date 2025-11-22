import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { GithubLogo } from "~/features/auth/components/logos/github";
import { KakaoLogo } from "~/features/auth/components/logos/kakao";

import { useTranslation } from "react-i18next";
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
    <Card className="w-full max-w-screen-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
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
      </CardContent>
    </Card>
  );
}
