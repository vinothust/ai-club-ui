import { useRole } from "@/contexts/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Edit, Eye } from "lucide-react";
import { Role } from "@/types";

const roleConfig: Record<Role, { label: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", icon: <Shield className="h-3.5 w-3.5" /> },
  editor: { label: "Editor", icon: <Edit className="h-3.5 w-3.5" /> },
  viewer: { label: "Viewer", icon: <Eye className="h-3.5 w-3.5" /> },
};

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
      <SelectTrigger className="w-[140px] h-8 text-xs bg-card">
        <div className="flex items-center gap-1.5">
          {roleConfig[role].icon}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-card z-50">
        {Object.entries(roleConfig).map(([key, config]) => (
          <SelectItem key={key} value={key}>
            <div className="flex items-center gap-1.5">
              {config.icon}
              {config.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
