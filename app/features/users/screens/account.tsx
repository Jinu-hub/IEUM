import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
//import ConnectSocialAccountsForm from "../components/forms/connect-social-accounts-form";
import DeleteAccountForm from "../components/forms/delete-account-form";
import EditProfileForm from "../components/forms/edit-profile-form";
import PlanSection from "../components/forms/plan-info-form";
import { getUserProfile, getUserSubscription } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Account | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const identities = client.auth.getUserIdentities();
  const profile = getUserProfile(client, { userId: user!.id });
  const subscription = getUserSubscription(client, { userId: user!.id });
  return {
    user,
    identities,
    profile,
    subscription,
  };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, identities, profile, subscription } = loaderData;
  const hasEmailIdentity = user?.identities?.some(
    (identity) => identity.provider === "email",
  );
  return (
    <div className="flex w-full flex-col items-center gap-8 pt-0 pb-12 px-4">
      {/* Profile Section */}
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={profile}
          errorElement={
            <div className="text-red-500">Could not load profile</div>
          }
        >
          {(profile) => {
            if (!profile) {
              return null;
            }
            return (
              <EditProfileForm
                name={profile.name}
                marketingConsent={profile.marketing_consent}
                avatarUrl={profile.avatar_url}
              />
            );
          }}
        </Await>
      </Suspense>

      {/* Plan Settings Section */}
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={subscription}
          errorElement={
            <div className="text-red-500">プラン情報を読み込めませんでした</div>
          }
        >
          {(subscription) => (
            <PlanSection subscription={subscription} />
          )}
        </Await>
      </Suspense>

      {/* Security Settings Section */}
      <div className="w-full max-w-screen-md space-y-8">
        <div className="space-y-6">
          <ChangeEmailForm email={user?.email ?? ""} />
          <ChangePasswordForm hasPassword={hasEmailIdentity ?? false} />
        </div>
      </div>

      {/*
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={identities}
          errorElement={
            <div className="text-red-500">Could not load social accounts</div>
          }
        >
          {({ data, error }) => {
            if (!data) {
              return (
                <div className="text-red-500">
                  <span>Could not load social accounts</span>
                  <span className="text-xs">Code: {error.code}</span>
                  <span className="text-xs">Message: {error.message}</span>
                </div>
              );
            }
            return (
              <ConnectSocialAccountsForm
                providers={data.identities
                  .filter((identity) => identity.provider !== "email")
                  .map((identity) => identity.provider)}
              />
            );
          }}
        </Await>
      </Suspense>
      */}

      {/* Danger Zone */}
      <div className="w-full max-w-screen-md space-y-8 mt-8">        
        <DeleteAccountForm />
      </div>
    </div>
  );
}
