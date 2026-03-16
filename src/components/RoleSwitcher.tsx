import { useAuth } from "@/contexts/AuthContext";
import { Shield, Edit, Eye } from "lucide-react";
import { Role } from "@/types";
import { Badge } from "@/components/ui/badge";

const roleConfig: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-destructive text-destructive-foreground" },
  editor: { label: "Editor", icon: <Edit className="h-3.5 w-3.5" />, color: "bg-primary text-primary-foreground" },
  viewer: { label: "Viewer", icon: <Eye className="h-3.5 w-3.5" />, color: "bg-secondary text-secondary-foreground" },
};

export function RoleSwitcher() {
  const { user } = useAuth();
  const role = user?.role || 'viewer';
  const config = roleConfig[role];

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 ${config.color}`}>
      {config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}
