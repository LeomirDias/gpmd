"use client";

import {
  LayoutDashboard,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { authClient } from "../../../lib/auth-client";

// Menu items.
const itemsAgenda = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

export function AppSidebar() {
  const session = authClient.useSession();

  const pathname = usePathname();

  const [hasUnreadPending, setHasUnreadPending] = useState<boolean>(false);
  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/appointments/pending-count", { cache: "no-store" });
        const data = (await res.json()) as { notConfirmed: number; toConclude: number };
        if (!mounted) return;
        setHasUnreadPending((data?.notConfirmed || 0) > 0 || (data?.toConclude || 0) > 0);
      } catch { }
    };
    fetchPending();
    const id = setInterval(fetchPending, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pathname]);

  return (
    <Sidebar
      variant="floating"
    >
      <div>

      </div>
      <SidebarHeader className="bg-background flex items-center justify-center p-4 rounded-t-lg shadow-lg border border-border border-b-0" />

      <SidebarContent className="bg-background shadow-lg border border-border">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsAgenda.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        {item.url === "/appointments/pending" && hasUnreadPending && (
                          <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500" aria-hidden />
                        )}
                      </div>
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="bg-background rounded-b-lg shadow-lg border border-border border-t-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="group-data-[state=collapsed]:hidden flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full bg-primary w-8 h-8">
                  <UserIcon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="text-sm flex flex-col">
                  {session.data?.user.name}
                  <span className="text-muted-foreground text-xs">{session.data?.user.email}</span>
                </p>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
