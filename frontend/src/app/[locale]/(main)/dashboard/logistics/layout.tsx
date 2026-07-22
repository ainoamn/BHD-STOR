"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LogisticsSidebar } from "@/components/logistics/LogisticsSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  Search,
  Plus,
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Moon,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "New Shipment", icon: Plus, href: "create" },
  { label: "Assign Driver", icon: Plus, href: "drivers" },
  { label: "Optimize Routes", icon: Settings, href: "routes" },
];

const notifications = [
  {
    id: 1,
    title: "Delivery Failed",
    message: "Shipment #TRK-2847 failed - customer not available",
    time: "2 min ago",
    type: "error" as const,
    read: false,
  },
  {
    id: 2,
    title: "Maintenance Due",
    message: "Vehicle OM-1234 is overdue for maintenance",
    time: "15 min ago",
    type: "warning" as const,
    read: false,
  },
  {
    id: 3,
    title: "Route Optimized",
    message: "Route #R-452 has been auto-optimized",
    time: "1 hour ago",
    type: "success" as const,
    read: true,
  },
  {
    id: 4,
    title: "New B2B Request",
    message: "Oman Cables approval pending",
    time: "2 hours ago",
    type: "info" as const,
    read: true,
  },
];

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex h-screen bg-background",
          isRTL ? "direction-rtl" : "direction-ltr"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
            isRTL ? "right-0 border-l border-r-0" : "left-0",
            sidebarCollapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shrink-0">
                <span className="text-primary-foreground font-bold text-sm">
                  BHD
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <h1 className="font-semibold text-sm truncate">
                    BHD Logistics
                  </h1>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Oman Operations
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-2">
            <LogisticsSidebar collapsed={sidebarCollapsed} />
          </div>

          {/* Collapse Button */}
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                isRTL ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : isRTL ? (
                <ChevronRight className="h-4 w-4 mr-2" />
              ) : (
                <ChevronLeft className="h-4 w-4 mr-2" />
              )}
              {!sidebarCollapsed && (
                <span className="text-xs">{isRTL ? "طي" : "Collapse"}</span>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300",
            isRTL
              ? sidebarCollapsed
                ? "mr-[72px]"
                : "mr-[260px]"
              : sidebarCollapsed
                ? "ml-[72px]"
                : "ml-[260px]"
          )}
        >
          {/* Top Bar */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments, drivers, vehicles..."
                  className="pl-9 w-[320px] h-9"
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                />
                {showSearch && (
                  <div className="absolute top-full mt-1 left-0 w-full bg-card border rounded-lg shadow-lg p-3 z-50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Recent Searches
                    </p>
                    {["TRK-2847", "Ahmed Al-Farsi", "OM-1234"].map((s) => (
                      <div
                        key={s}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                      >
                        <Search className="h-3 w-3 text-muted-foreground" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Language</TooltipContent>
              </Tooltip>

              {/* Dark Mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Moon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dark Mode</TooltipContent>
              </Tooltip>

              {/* Help */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help</TooltipContent>
              </Tooltip>

              {/* Notifications */}
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 relative"
                      onClick={() =>
                        setShowNotifications(!showNotifications)
                      }
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-medium">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>

                {showNotifications && (
                  <div className="absolute top-full mt-2 w-[360px] bg-card border rounded-lg shadow-lg z-50"
                    style={{ [isRTL ? "left" : "right"]: 0 }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <h3 className="font-semibold text-sm">
                        Notifications
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "px-4 py-3 border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                n.type === "error" && "bg-red-500",
                                n.type === "warning" && "bg-amber-500",
                                n.type === "success" && "bg-emerald-500",
                                n.type === "info" && "bg-blue-500"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "text-sm",
                                  !n.read && "font-medium"
                                )}
                              >
                                {n.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {n.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                      >
                        View all notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="h-9 gap-1">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">New</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quick Actions</TooltipContent>
              </Tooltip>

              {/* User Avatar */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">OA</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
