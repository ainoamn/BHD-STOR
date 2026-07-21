"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Route,
  Warehouse,
  MapPin,
  Tag,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    nameAr: "نظرة عامة",
    href: "/dashboard/logistics",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Shipments",
    nameAr: "الشحنات",
    href: "/dashboard/logistics/shipments",
    icon: Package,
  },
  {
    name: "Vehicles",
    nameAr: "المركبات",
    href: "/dashboard/logistics/vehicles",
    icon: Truck,
  },
  {
    name: "Drivers",
    nameAr: "السائقين",
    href: "/dashboard/logistics/drivers",
    icon: Users,
  },
  {
    name: "Routes",
    nameAr: "المسارات",
    href: "/dashboard/logistics/routes",
    icon: Route,
  },
  {
    name: "Hubs",
    nameAr: "المراكز",
    href: "/dashboard/logistics/hubs",
    icon: Warehouse,
  },
  {
    name: "Zones",
    nameAr: "المناطق",
    href: "/dashboard/logistics/zones",
    icon: MapPin,
  },
  {
    name: "Pricing",
    nameAr: "التسعير",
    href: "/dashboard/logistics/pricing",
    icon: Tag,
  },
  {
    name: "B2B Customers",
    nameAr: "عملاء B2B",
    href: "/dashboard/logistics/b2b",
    icon: Building2,
  },
  {
    name: "Analytics",
    nameAr: "التحليلات",
    href: "/dashboard/logistics/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    nameAr: "الإعدادات",
    href: "/dashboard/logistics/settings",
    icon: Settings,
  },
];

interface LogisticsSidebarProps {
  collapsed?: boolean;
}

export function LogisticsSidebar({ collapsed = false }: LogisticsSidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof navigation)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="px-2 space-y-1">
      {navigation.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;

        const linkContent = (
          <>
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && (
              <span className="truncate text-sm">{item.name}</span>
            )}
            {active && !collapsed && (
              <div className="absolute inset-y-0 left-0 w-[3px] bg-primary rounded-r-full" />
            )}
          </>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.name} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center h-10 rounded-lg transition-colors group",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {linkContent}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 px-3 h-10 rounded-lg transition-colors group",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {linkContent}
          </Link>
        );
      })}
    </nav>
  );
}
