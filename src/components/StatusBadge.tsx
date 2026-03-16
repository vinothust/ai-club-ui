import { cn } from "@/lib/utils";
import { UseCaseStatus, UseCaseType, UseCasePriority, UserStatus } from "@/types";

const statusStyles: Record<UseCaseStatus, string> = {
  "Use case finalization": "bg-amber-500/15 text-amber-600 border-amber-500/20",
  "Development": "bg-blue-500/15 text-blue-600 border-blue-500/20",
  "UST demo - completed": "bg-purple-500/15 text-purple-600 border-purple-500/20",
  "Rework after UST demo": "bg-orange-500/15 text-orange-600 border-orange-500/20",
  "Client demo - completed": "bg-cyan-500/15 text-cyan-600 border-cyan-500/20",
  "Rework after client demo": "bg-pink-500/15 text-pink-600 border-pink-500/20",
  "On hold": "bg-slate-500/15 text-slate-600 border-slate-500/20",
  "Cancelled": "bg-red-500/15 text-red-600 border-red-500/20",
  "SOW approved": "bg-green-500/15 text-green-600 border-green-500/20",
};

const typeStyles: Record<UseCaseType, string> = {
  "Customer solicited": "bg-blue-500/15 text-blue-600 border-blue-500/20",
  "Unsolicited": "bg-amber-500/15 text-amber-600 border-amber-500/20",
  "Internal": "bg-purple-500/15 text-purple-600 border-purple-500/20",
};

const priorityStyles: Record<UseCasePriority, string> = {
  Low: "bg-green-500/15 text-green-700 border-green-500/20",
  Medium: "bg-blue-500/15 text-blue-700 border-blue-500/20",
  High: "bg-red-500/15 text-red-700 border-red-500/20",
};

const userStatusStyles: Record<UserStatus, string> = {
  Active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  Inactive: "bg-slate-500/15 text-slate-600 border-slate-500/20",
};

export function StatusBadge({ status }: { status: UseCaseStatus }) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ring-1 ring-inset ring-transparent", style)}>
      {status}
    </span>
  );
}

export function TypeBadge({ type }: { type: UseCaseType }) {
  const style = typeStyles[type] || "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ring-1 ring-inset ring-transparent", style)}>
      {type}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: UseCasePriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ring-1 ring-inset ring-transparent", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ring-1 ring-inset ring-transparent", userStatusStyles[status])}>
      {status}
    </span>
  );
}
