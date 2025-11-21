import {
  GalleryVerticalEndIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MegaphoneIcon,
  Settings2Icon,
  Target
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/core/components/ui/sidebar";

import LangSwitcher from "~/core/components/lang-switcher";
import ThemeSwitcher from "~/core/components/theme-switcher";

import SidebarMain from "./sidebar-main";
import TeamSwitcher from "./sidebar-team-switcher";
import SidebarUser from "./sidebar-user";

const data = {
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
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboardIcon,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Reports",
          url: "#",
          disabled: true,
          tooltip: "추후 공개 예정",
        },
        {
          title: "Test",
          url: "/dashboard/test"
        }
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
      title: "Settings",
      url: "#",
      icon: Settings2Icon,
      items: [
        {
          title: "Integrations",
          url: "/settings/integrations",
        },
        {
          title: "Targets",
          url: "/settings/targets",
        },
        {
          title: "Mail List",
          url: "/settings/mail-list",
        },
      ],
    },
    {
      title: "Contents",
      url: "#",
      icon: LineChartIcon,
      items: [
        {
          title: "Sent Mail",
          url: "/contents/sent-mail",
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
};

export default function DashboardSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={data.navMain} />
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
