import React, { createContext, useContext, ReactNode } from "react";
import { Role } from "@/types";
import { useAuth } from "./AuthContext";

interface RoleContextType {
  role: Role;
  canEdit: boolean;
  canManageUsers: boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role || "viewer";

  const canEdit = role === "editor" || role === "admin";
  const canManageUsers = role === "admin";

  return (
    <RoleContext.Provider value={{ role, canEdit, canManageUsers }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
