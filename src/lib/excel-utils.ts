import * as XLSX from "xlsx";
import { UseCase, UseCaseStatus, UseCaseType, STATUS_OPTIONS, USE_CASE_TYPES } from "@/types";

// Normalize a raw header: collapse whitespace/newlines, lowercase, trim
function normalizeHeader(h: string): string {
  return String(h).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").toLowerCase().trim();
}

// Maps normalized header → UseCase field. Includes aliases for the real CSV column names.
const COLUMN_MAP: Record<string, keyof UseCase> = {
  // Standard template headers
  "account": "account",
  "project": "project",
  "description": "description",
  "tech stack": "techStack",
  "use case type": "useCaseType",
  "status": "status",
  "use case logged date": "loggedDate",
  "planned end date": "plannedEndDate",
  "ai tech lead": "aiTechLead",
  "pod members": "podMembers",
  "use case owner": "useCaseOwner",
  "use case leader": "useCaseLeader",
  "# pod members required": "podMembersRequired",
  "# pod members assigned": "podMembersAssigned",
  "effort": "effort",
  "comments": "comments",
  // Aliases from the real CSV column names
  "usecase owner": "useCaseOwner",
  "usecase leader": "useCaseLeader",
  "usecase": "useCaseType",          // "Usecase" col holds Unsolicited/Solicited/Internal
  "customer /internal": "useCaseType", // alternate type column (Customer/Internal)
  "#pod members required": "podMembersRequired",
  "#pod members assigned": "podMembersAssigned",
  "pod members allocated": "podMembersAssigned",
  "effort (hrs)": "effort",
};

// Maps raw CSV status strings → canonical UseCaseStatus values
const STATUS_ALIAS_MAP: Record<string, UseCaseStatus> = {
  "use case finalization":          "Use case finalization",
  "usecase finalization":           "Use case finalization",
  "development":                    "Development",
  "ust demo - completed":           "UST demo - completed",
  "demo completed - ust":           "UST demo - completed",
  "demo scheduled - ust":           "UST demo - completed",
  "rework after ust demo":          "Rework after UST demo",
  "client demo - completed":        "Client demo - completed",
  "demo completed - client":        "Client demo - completed",
  "demo scheduled - client":        "Client demo - completed",
  "demo slot awaited - client":     "Client demo - completed",
  "rework after client demo":       "Rework after client demo",
  "on hold":                        "On hold",
  "cancelled":                      "Cancelled",
  "sow approved":                   "SOW approved",
};

// Maps raw CSV usecase-type strings → canonical UseCaseType values
const TYPE_ALIAS_MAP: Record<string, UseCaseType> = {
  "customer solicited":  "Customer solicited",
  "solicited":           "Customer solicited",
  "customer":            "Customer solicited",
  "unsolicited":         "Unsolicited",
  "internal":            "Internal",
};

function resolveStatus(raw: string): UseCaseStatus | string {
  const key = raw.toLowerCase().trim();
  return STATUS_ALIAS_MAP[key] ?? raw;
}

function resolveType(raw: string): UseCaseType | string {
  const key = raw.toLowerCase().trim();
  return TYPE_ALIAS_MAP[key] ?? raw;
}

export const TEMPLATE_HEADERS = [
  "Account",
  "Project",
  "Description",
  "Tech Stack",
  "Use Case Type",
  "Status",
  "Use Case Logged Date",
  "Planned End Date",
  "AI Tech Lead",
  "POD Members",
  "Use Case Owner",
  "Use Case Leader",
  "# POD Members Required",
  "# POD Members Assigned",
  "Effort",
  "Comments",
];

function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().split("T")[0];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ParsedRow {
  data: Partial<UseCase>;
  rowNum: number;
  errors: ValidationError[];
}

export function validateRow(row: Partial<UseCase>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!row.account || row.account === "NA") errors.push({ field: "account", message: "Account required" });
  if (!row.project || row.project === "NA") errors.push({ field: "project", message: "Project required" });
  
  if (row.useCaseType && !USE_CASE_TYPES.includes(row.useCaseType as UseCaseType)) {
    errors.push({ field: "useCaseType", message: `Unknown type: "${row.useCaseType}" — will default to "Unsolicited"` });
  }
  
  if (row.status && !STATUS_OPTIONS.includes(row.status as UseCaseStatus)) {
    errors.push({ field: "status", message: `Unknown status: "${row.status}" — will default to "Use case finalization"` });
  }
  
  return errors;
}

export function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        
        if (raw.length < 2) {
          reject(new Error("File appears empty"));
          return;
        }
        
        const headers = raw[0].map((h: any) => normalizeHeader(String(h)));
        const dataRows = raw.slice(1).filter((r) => r.some((c) => c !== ""));

        // Detect special split-column indices used in the real CSV
        // "Customer /Internal" col → account type context (Customer / Internal)
        // "Usecase" col → Unsolicited / Solicited / Internal
        const custInternalIdx = headers.findIndex((h) => h === "customer /internal" || h === "customer/internal");
        const usecaseTypeIdx   = headers.findIndex((h) => h === "usecase");

        const parsed: ParsedRow[] = dataRows.map((row, idx) => {
          const obj: any = {};
          
          headers.forEach((h, i) => {
            const field = COLUMN_MAP[h];
            if (field) {
              let val = row[i] ?? "";
              
              if (field === "techStack") {
                obj[field] = String(val).trim()
                  ? String(val).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
                  : [];
              } else if (field === "loggedDate" || field === "plannedEndDate") {
                obj[field] = parseExcelDate(val);
              } else if (field === "status") {
                obj[field] = resolveStatus(String(val).trim());
              } else if (field === "useCaseType") {
                // Will be overridden below when both columns are present
                obj[field] = resolveType(String(val).trim());
              } else {
                obj[field] = String(val).trim();
              }
            }
          });

          // Combine "Customer/Internal" + "Usecase" columns into useCaseType
          // CSV logic: if Usecase col says "Internal" → "Internal"
          //            if Customer/Internal col says "Customer" and Usecase col says "Unsolicited" → "Unsolicited"
          //            if Customer/Internal col says "Customer" and Usecase col says "Solicited"   → "Customer solicited"
          if (custInternalIdx !== -1 || usecaseTypeIdx !== -1) {
            const custRaw     = custInternalIdx !== -1 ? String(row[custInternalIdx] ?? "").trim().toLowerCase() : "";
            const usecaseRaw  = usecaseTypeIdx  !== -1 ? String(row[usecaseTypeIdx]  ?? "").trim().toLowerCase() : "";
            if (usecaseRaw === "internal" || custRaw === "internal") {
              obj.useCaseType = "Internal";
            } else if (usecaseRaw === "solicited" || custRaw === "customer") {
              obj.useCaseType = "Customer solicited";
            } else if (usecaseRaw === "unsolicited") {
              obj.useCaseType = "Unsolicited";
            }
          }
          
          if (!obj.loggedDate) obj.loggedDate = new Date().toISOString().split("T")[0];
          if (!obj.techStack) obj.techStack = [];
          
          const errors = validateRow(obj);
          
          return {
            data: obj,
            rowNum: idx + 2,
            errors,
          };
        });
        
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function downloadTemplate() {
  const sampleRows = [
    [
      "Acme Corp",
      "Invoice Automation",
      "Automate invoice processing using LLMs",
      "GPT-4, LangChain",
      "Customer solicited",
      "Development",
      "2025-01-15",
      "2025-03-31",
      "John Smith",
      "Alice, Bob",
      "Jane Doe",
      "Mike Lee",
      "3",
      "3",
      "120 hrs",
      "High priority",
    ],
    [
      "GlobalBank",
      "Risk Scoring",
      "AI credit risk assessment",
      "Custom ML",
      "Internal",
      "Use case finalization",
      "2025-02-01",
      "2025-04-15",
      "Sarah K",
      "Dave, Eve",
      "Tom R",
      "Sarah K",
      "2",
      "1",
      "80 hrs",
      "POD understaffed",
    ],
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...sampleRows]);
  
  ws["!cols"] = TEMPLATE_HEADERS.map((_, i) =>
    ({ wch: [20, 20, 40, 20, 22, 26, 20, 15, 15, 25, 18, 18, 10, 10, 12, 30][i] || 20 })
  );
  
  const valData = [
    ["Use Case Type Options", "Status Options"],
    ...Array.from(
      { length: Math.max(USE_CASE_TYPES.length, STATUS_OPTIONS.length) },
      (_, i) => [USE_CASE_TYPES[i] || "", STATUS_OPTIONS[i] || ""]
    ),
  ];
  
  const ws2 = XLSX.utils.aoa_to_sheet(valData);
  ws2["!cols"] = [{ wch: 25 }, { wch: 32 }];
  
  XLSX.utils.book_append_sheet(wb, ws, "Use Cases");
  XLSX.utils.book_append_sheet(wb, ws2, "Valid Options");
  XLSX.writeFile(wb, "AI_Use_Case_Template.xlsx");
}

export function exportToExcel(useCases: UseCase[], filename = "AI_Use_Cases_Export.xlsx") {
  const data = useCases.map((uc) => [
    uc.account,
    uc.project,
    uc.description,
    Array.isArray(uc.techStack) ? uc.techStack.join(", ") : uc.techStack,
    uc.useCaseType,
    uc.status,
    uc.loggedDate,
    uc.plannedEndDate,
    uc.aiTechLead,
    uc.podMembers,
    uc.useCaseOwner,
    uc.useCaseLeader,
    uc.podMembersRequired,
    uc.podMembersAssigned,
    uc.effort,
    uc.comments,
  ]);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...data]);
  
  ws["!cols"] = TEMPLATE_HEADERS.map((_, i) =>
    ({ wch: [20, 20, 40, 20, 22, 26, 20, 15, 15, 25, 18, 18, 10, 10, 12, 30][i] || 20 })
  );
  
  XLSX.utils.book_append_sheet(wb, ws, "Use Cases");
  XLSX.writeFile(wb, filename);
}
