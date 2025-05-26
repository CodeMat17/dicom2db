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
import { Calendar, Handshake, Home, Inbox, User, Users } from "lucide-react";

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
    title: "Testimonials",
    url: "/testimonials",
    icon: Users,
  },
  {
    title: "Our Staff",
    url: "our-staff",
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
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="mt-6">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild className="font-medium text-lg">
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
