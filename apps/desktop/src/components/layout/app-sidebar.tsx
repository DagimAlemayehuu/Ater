import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { sidebarData } from "./data/sidebar-data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Placeholder for workspace switcher */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navMain.map((group) => (
          <SidebarMenu key={group.title}>
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest my-2">{group.title}</div>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ))}
      </SidebarContent>
      <SidebarFooter>
         {/* Placeholder for user profile */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
