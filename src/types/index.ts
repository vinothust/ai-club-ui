export type Role = "viewer" | "editor" | "admin";

export type UseCaseStatus = 
  | "Use case finalization"
  | "Development"
  | "UST demo - completed"
  | "Rework after UST demo"
  | "Client demo - completed"
  | "Rework after client demo"
  | "On hold"
  | "Cancelled"
  | "SOW approved";

export type UseCaseType = 
  | "Customer solicited" 
  | "Unsolicited" 
  | "Internal";

export type UseCasePriority = "Low" | "Medium" | "High";

export type UseCaseCategory = "IBC" | "BCBSA";

export const STATUS_OPTIONS: UseCaseStatus[] = [
  "Use case finalization",
  "Development",
  "UST demo - completed",
  "Rework after UST demo",
  "Client demo - completed",
  "Rework after client demo",
  "On hold",
  "Cancelled",
  "SOW approved",
];

export const USE_CASE_TYPES: UseCaseType[] = [
  "Customer solicited",
  "Unsolicited",
  "Internal",
];

export const TECH_STACK_OPTIONS = [
  "GPT-4",
  "Claude",
  "Gemini",
  "LangChain",
  "RAG",
  "Fine-tuning",
  "Custom ML",
  "Azure OpenAI",
  "AWS Bedrock",
  "Vertex AI",
  "Stable Diffusion",
  "Whisper",
  "Other",
];

export const STATUS_COLORS: Record<UseCaseStatus, string> = {
  "Use case finalization": "#f59e0b",
  "Development": "#3b82f6",
  "UST demo - completed": "#8b5cf6",
  "Rework after UST demo": "#f97316",
  "Client demo - completed": "#06b6d4",
  "Rework after client demo": "#ec4899",
  "On hold": "#6b7280",
  "Cancelled": "#ef4444",
  "SOW approved": "#10b981",
};

export const TYPE_COLORS: Record<UseCaseType, string> = {
  "Customer solicited": "#3b82f6",
  "Unsolicited": "#f59e0b",
  "Internal": "#8b5cf6",
};

export interface UseCase {
  id: string;
  account: string;
  project: string;
  description: string;
  /** Comma-separated string as returned by the API */
  techStack: string;
  priority?: string;
  customerType?: string;
  /** Maps to the "usecase" field in the API response */
  usecase: UseCaseType;
  status: UseCaseStatus;
  /** Maps to "useCaseLoggedDate" in the API response */
  useCaseLoggedDate: string;
  aging?: number;
  plannedEndDate: string;
  aiTechLead: string;
  podMembers: string;
  /** Maps to "usecaseOwner" in the API response */
  usecaseOwner: string;
  /** Maps to "usecaseLeader" in the API response */
  usecaseLeader: string;
  podMembersRequired: number;
  /** Maps to "podMembersAllocated" in the API response */
  podMembersAllocated: number;
  effort: string;
  comments: string;
  createdAt?: string;
  updatedAt?: string;
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
