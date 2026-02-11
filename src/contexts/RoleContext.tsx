import React, { createContext, useContext, useState, ReactNode } from "react";
import { Role } from "@/types";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  canEdit: boolean;
  canManageUsers: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin");

  const canEdit = role === "editor" || role === "admin";
  const canManageUsers = role === "admin";

  return (
    <RoleContext.Provider value={{ role, setRole, canEdit, canManageUsers }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
