import { cn } from "@/lib/utils";
import { UseCaseStatus, UseCasePriority, UserStatus } from "@/types";

const statusStyles: Record<UseCaseStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Active: "bg-success/15 text-success",
  "In Review": "bg-warning/15 text-warning",
  Completed: "bg-primary/15 text-primary",
  Archived: "bg-muted text-muted-foreground",
};

const priorityStyles: Record<UseCasePriority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-info/15 text-info",
  High: "bg-warning/15 text-warning",
  Critical: "bg-destructive/15 text-destructive",
};

const userStatusStyles: Record<UserStatus, string> = {
  Active: "bg-success/15 text-success",
  Inactive: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: UseCaseStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusStyles[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: UseCasePriority }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", userStatusStyles[status])}>
      {status}
    </span>
  );
}
