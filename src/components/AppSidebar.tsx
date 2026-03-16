import { LayoutDashboard, Lightbulb, Users, BrainCircuit, FileText, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Use Cases", url: "/use-cases", icon: Lightbulb },
  { title: "Report", url: "/report", icon: FileText },
  { title: "Manager Insights", url: "/insights", icon: TrendingUp },
];

export function AppSidebar() {
  const { canManageUsers, role } = useRole();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <BrainCircuit className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-md font-semibold text-sidebar-foreground">AI Club</h2>
            <p className="text-sm text-sidebar-foreground/60">Use Case Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {canManageUsers && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/users" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            {user?.name ? user.name.charAt(0).toUpperCase() : role === "admin" ? "A" : role === "editor" ? "E" : "V"}
          </div>
          <div>
            <p className="text-xs font-medium text-sidebar-foreground">
              {user?.name || (role === "admin" ? "Admin User" : role === "editor" ? "Editor User" : "Viewer User")}
            </p>
            <p className="text-[10px] text-sidebar-foreground/60 capitalize">{role} Access</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
