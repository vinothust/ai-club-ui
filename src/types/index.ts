export type Role = "viewer" | "editor" | "admin";

export type UseCaseStatus = "Draft" | "Active" | "In Review" | "Completed" | "Archived";
export type UseCasePriority = "Low" | "Medium" | "High" | "Critical";
export type UseCaseCategory =
  | "Customer Service"
  | "Operations"
  | "Marketing"
  | "Finance"
  | "HR"
  | "IT"
  | "Sales"
  | "Product"
  | "Legal";

export interface UseCase {
  id: string;
  title: string;
  description: string;
  category: UseCaseCategory;
  status: UseCaseStatus;
  priority: UseCasePriority;
  owner: string;
  department: string;
  estimatedImpact: string;
  dateCreated: string;
}

export type UserStatus = "Active" | "Inactive";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  dateAdded: string;
}
