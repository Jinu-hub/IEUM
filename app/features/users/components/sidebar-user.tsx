import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  Crown,
  LogOut,
  Sparkles,
  UserCircle2Icon
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Badge } from "~/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/core/components/ui/sidebar";
import type { PlanType, SubscriptionMode } from "~/core/lib/constants";

type SubscriptionInfo = {
  plan_type: PlanType;
  mode: SubscriptionMode;
} | null;

export default function SidebarUser({
  user,
  subscription,
}: {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  subscription: SubscriptionInfo;
}) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation("common", { keyPrefix: "sidebar" });
  const { t: commonT } = useTranslation("common");

  const planType = subscription?.plan_type ?? "free";
  const mode = subscription?.mode ?? "free";
  const isPaidPlan = mode === "paid";
  const isStarter = planType === "starter";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {!isPaidPlan && (
                <DropdownMenuItem asChild>
                  <Link to="/payments/checkout" viewTransition>
                    <Sparkles className="text-indigo-500" />
                    {t("user.upgradeToStarter")}
                  </Link>
                </DropdownMenuItem>
              )}
              {isStarter && (
                <DropdownMenuItem disabled className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <Crown className="text-amber-500" />
                    <span>{t("user.upgradeToPro")}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {commonT("soon")}
                  </Badge>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/account/edit" viewTransition>
                  <UserCircle2Icon />
                  {t("user.account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/payments">
                  <CreditCard />
                  {t("user.payments")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                {t("user.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/logout">
                <LogOut />
                {t("user.logout")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
