import {
  GalleryVerticalEndIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MegaphoneIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Target
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/core/components/ui/sidebar";

import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import LangSwitcher from "~/core/components/lang-switcher";
import ThemeSwitcher from "~/core/components/theme-switcher";

import type { SubscriptionInfo } from "../lib/types";
import SidebarMain from "./sidebar-main";
import TeamSwitcher from "./sidebar-team-switcher";
import SidebarUser from "./sidebar-user";

const getSidebarData = (
  t: (key: string) => string,
  commonT: (key: string) => string,
  isAdmin: boolean
) => ({
  teams: [
    {
      name: "Default",
      logo: GalleryVerticalEndIcon,
      description: "Basic Workspace",
    },
    /*
    {
      name: "TechCo Solutions",
      logo: BriefcaseIcon,
      description: "Startup",
    },
    {
      name: "GrowthMate",
      logo: RocketIcon,
      description: "Free",
    },
    */
  ],
  navMain: [
    {
      title: t("dashboard"),
      url: "#",
      icon: LayoutDashboardIcon,
      isActive: true,
      items: [
        {
          title: t("overview"),
          url: "/dashboard",
        },
        {
          title: t("analytics"),
          url: "/dashboard/analytics",
        },
        /*
        {
          title: t("test"),
          url: "/dashboard/test"
        }
        */
      ],
    },
    /*
    {
      title: "Customers",
      url: "#",
      icon: UsersIcon,
      items: [
        {
          title: "Contacts",
          url: "#",
        },
        {
          title: "Companies",
          url: "#",
        },
        {
          title: "Deals",
          url: "#",
        },
      ],
    },
    */
    {
      title: t("settings"),
      url: "#",
      icon: Settings2Icon,
      items: [
        {
          title: t("integrations"),
          url: "/settings/integrations",
        },
        {
          title: t("mailList"),
          url: "/settings/mail-list",
        },
        {
          title: t("targets"),
          url: "/settings/targets",
        },
        {
          title: t("templates"),
          url: "#",
          disabled: true,
          tooltip: commonT("soon"),
        },
      ],
    },
    {
      title: t("contents"),
      url: "#",
      icon: LineChartIcon,
      items: [
        {
          title: t("sentMail"),
          url: "/contents/sent-mail",
        },
        {
          title: t("reports"),
          url: "#",
          disabled: true,
          tooltip: commonT("soon"),
        },
        /*
        {
          title: "Opportunities",
          url: "#",
        },
        {
          title: "Quotes",
          url: "#",
        },
        {
          title: "Invoices",
          url: "#",
        },
        */
      ],
    },
    ...(isAdmin
      ? [
          {
            title: t("admin"),
            url: "#",
            icon: ShieldCheckIcon,
            isActive: false,
            items: [
              { title: t("testApi"), url: "/admin/test-api" },
              { title: t("monitoring"), url: "/admin/monitoring" },
            ],
          },
        ]
      : []),
  ],
  projects: [
    {
      name: "Sales Team",
      url: "#",
      icon: Target,
    },
    {
      name: "Customer Success",
      url: "#",
      icon: HeartHandshakeIcon,
    },
    {
      name: "Marketing",
      url: "#",
      icon: MegaphoneIcon,
    },
  ],
});


export default function DashboardSidebar({
  user,
  subscription,
  isAdmin = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
  subscription: SubscriptionInfo;
  isAdmin?: boolean;
}) {
  const { t } = useTranslation("common", { keyPrefix: "sidebar" });
  const { t: commonT } = useTranslation("common");
  const data = getSidebarData(t, commonT, isAdmin);
  
  // Check if on review page to disable all menu items
  const location = useLocation();
  const isReviewMode = location.pathname.includes('/integrations-review');

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={data.navMain} allDisabled={isReviewMode} />
        {/*
        <SidebarProjects projects={data.projects} />
        */}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-3">
          <SidebarUser
            user={{
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }}
            subscription={subscription}
            isReviewMode={isReviewMode}
          />
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
            <ThemeSwitcher />
            <LangSwitcher />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
