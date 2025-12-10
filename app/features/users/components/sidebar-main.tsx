import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/core/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/core/components/ui/sidebar";

export default function SidebarMain({
  items,
  allDisabled = false,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      disabled?: boolean;
      tooltip?: string;
    }[];
  }[];
  /** Force all menu items to be disabled (e.g., in review mode) */
  allDisabled?: boolean;
}) {
  const { pathname } = useLocation();
  const { t } = useTranslation("common", { keyPrefix: "common" });
  const normalizePath = (path: string) => {
    if (!path) return "";
    if (path === "/") return "/";
    return path.replace(/\/+$/, "");
  };

  const normalizedPathname = normalizePath(pathname);

  const isExactRoute = (url: string) => {
    if (!url) return false;
    return normalizedPathname === normalizePath(url);
  };

  const isRouteWithin = (url: string) => {
    if (!url) return false;
    const normalizedUrl = normalizePath(url);

    if (normalizedUrl === "/") {
      return normalizedPathname === "/";
    }

    return (
      normalizedPathname === normalizedUrl ||
      normalizedPathname.startsWith(`${normalizedUrl}/`)
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isGroupActive =
            item.items?.some((subItem) => isExactRoute(subItem.url)) ?? false;
          const isParentActive = isGroupActive || isRouteWithin(item.url);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isGroupActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isParentActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isDisabled = allDisabled || subItem.disabled;
                      const isSubItemActive =
                        !isDisabled && isExactRoute(subItem.url);
                      const tooltipText = allDisabled 
                        ? "R_Mode" 
                        : (subItem.tooltip ?? "Soon");

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          {isDisabled ? (
                            <SidebarMenuSubButton
                              asChild
                              aria-disabled
                              className="hover:bg-transparent hover:text-muted-foreground"
                              title={tooltipText}
                            >
                              <span className="flex w-full cursor-not-allowed items-center justify-between text-muted-foreground">
                                <span>{subItem.title}</span>
                                <span className="rounded-full bg-muted-foreground/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {tooltipText}
                                </span>
                              </span>
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton
                              asChild
                              isActive={isSubItemActive}
                            >
                              <Link
                                to={subItem.url}
                                aria-current={
                                  isSubItemActive ? "page" : undefined
                                }
                                title={subItem.tooltip}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
