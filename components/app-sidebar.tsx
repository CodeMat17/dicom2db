"use client";

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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Calendar,
  Handshake,
  Home,
  Images,
  Inbox,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Carousel",
    url: "/",
    icon: Home,
  },
  {
    title: "Statistics",
    url: "/statistics",
    icon: Inbox,
  },
  {
    title: "Our Stories",
    url: "/our-stories",
    icon: Calendar,
  },
  {
    title: "Gallery",
    url: "/gallery",
    icon: Images,
  },
  {
    title: "Testimonials",
    url: "/testimonials",
    icon: Users,
  },
  {
    title: "Our Staff",
    url: "/our-staff",
    icon: User,
  },
  {
    title: "Collaborators",
    url: "/collaborators",
    icon: Handshake,
  },
  {
    title: "Upcoming Events",
    url: "/upcoming-events",
    icon: Handshake,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="mt-6">
            {items.map((item) => {
              const isActive =
                item.url === "/"
                  ? pathname === "/"
                  : pathname === item.url || pathname.startsWith(`${item.url}/`);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="font-medium text-lg">
                    <Link href={item.url} onClick={handleNavigate} prefetch>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
