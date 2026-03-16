import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Building2, Users, AlertTriangle, TrendingUp, Clock,
} from "lucide-react";
import {
  STATUS_OPTIONS, STATUS_COLORS, TYPE_COLORS, USE_CASE_TYPES,
  UseCase, UseCaseStatus,
} from "@/types";
import { useUseCases } from "@/hooks/useUseCases";

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

const TERMINAL: UseCaseStatus[] = ["Client demo - completed", "SOW approved", "Cancelled"];

// ── Account Summary ──────────────────────────────────────────────────
interface AccountSummary {
  account: string;
  total: number;
  active: number;
  completed: number;
  onHold: number;
  cancelled: number;
  overdue: number;
  avgAge: number;
  types: Record<string, number>;
}

function buildAccountSummaries(useCases: UseCase[]): AccountSummary[] {
  const map = new Map<string, UseCase[]>();
  useCases.forEach((uc) => {
    const key = uc.account || "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(uc);
  });

  const now = new Date();
  return Array.from(map.entries())
    .map(([account, ucs]) => {
      const active = ucs.filter((u) => !TERMINAL.includes(u.status) && u.status !== "On hold");
      const completed = ucs.filter((u) => u.status === "Client demo - completed" || u.status === "SOW approved");
      const onHold = ucs.filter((u) => u.status === "On hold");
      const cancelled = ucs.filter((u) => u.status === "Cancelled");
      const overdue = ucs.filter(
        (u) => u.plannedEndDate && new Date(u.plannedEndDate) < now && !TERMINAL.includes(u.status)
      );
      const ages = active.map((u) => daysSince(u.loggedDate)).filter(Boolean);
      const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
      const types: Record<string, number> = {};
      ucs.forEach((u) => {
        types[u.useCaseType] = (types[u.useCaseType] || 0) + 1;
      });
      return { account, total: ucs.length, active: active.length, completed: completed.length, onHold: onHold.length, cancelled: cancelled.length, overdue: overdue.length, avgAge, types };
    })
    .sort((a, b) => b.total - a.total);
}

// ── POD Workload ─────────────────────────────────────────────────────
interface LeadWorkload {
  name: string;
  totalCases: number;
  activeCases: number;
  accounts: string[];
  overdue: number;
}

function buildLeadWorkloads(useCases: UseCase[]): LeadWorkload[] {
  const map = new Map<string, UseCase[]>();
  useCases.forEach((uc) => {
    const lead = uc.aiTechLead?.trim();
    if (!lead || lead === "NA" || lead === "TBD") return;
    if (!map.has(lead)) map.set(lead, []);
    map.get(lead)!.push(uc);
  });

  const now = new Date();
  return Array.from(map.entries())
    .map(([name, ucs]) => {
      const activeCases = ucs.filter((u) => !TERMINAL.includes(u.status)).length;
      const accounts = [...new Set(ucs.map((u) => u.account))];
      const overdue = ucs.filter(
        (u) => u.plannedEndDate && new Date(u.plannedEndDate) < now && !TERMINAL.includes(u.status)
      ).length;
      return { name, totalCases: ucs.length, activeCases, accounts, overdue };
    })
    .sort((a, b) => b.activeCases - a.activeCases);
}

// ── Risk Items ───────────────────────────────────────────────────────
interface RiskItem {
  uc: UseCase;
  risks: string[];
  severity: "high" | "medium" | "low";
}

function identifyRisks(useCases: UseCase[]): RiskItem[] {
  const now = new Date();
  const items: RiskItem[] = [];

  useCases.forEach((uc) => {
    if (TERMINAL.includes(uc.status)) return;
    const risks: string[] = [];

    // Overdue
    if (uc.plannedEndDate && new Date(uc.plannedEndDate) < now) {
      const days = daysSince(uc.plannedEndDate);
      risks.push(`Overdue by ${days} day${days !== 1 ? "s" : ""}`);
    }

    // Aging without progress
    const age = daysSince(uc.loggedDate);
    if (age > 60 && uc.status === "Use case finalization") {
      risks.push(`In finalization for ${age} days`);
    }

    // Under-staffed
    const required = parseInt(uc.podMembersRequired) || 0;
    const assigned = parseInt(uc.podMembersAssigned) || 0;
    if (required > 0 && assigned < required) {
      risks.push(`Under-staffed: ${assigned}/${required} POD members`);
    }

    // No owner
    if (!uc.useCaseOwner || uc.useCaseOwner === "NA") {
      risks.push("No owner assigned");
    }

    // No tech lead
    if (!uc.aiTechLead || uc.aiTechLead === "TBD" || uc.aiTechLead === "NA") {
      risks.push("No AI tech lead assigned");
    }

    // In rework
    if (uc.status.startsWith("Rework")) {
      risks.push("Requires rework");
    }

    if (risks.length > 0) {
      const severity = risks.length >= 3 ? "high" : risks.length >= 2 ? "medium" : "low";
      items.push({ uc, risks, severity });
    }
  });

  return items.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// ── Velocity ─────────────────────────────────────────────────────────
interface WeekBucket {
  label: string;
  added: number;
  completed: number;
}

function buildVelocity(useCases: UseCase[]): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  const now = new Date();

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
    const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
    const label = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const added = useCases.filter((uc) => {
      const d = new Date(uc.loggedDate);
      return d >= weekStart && d < weekEnd;
    }).length;
    // completed = moved to terminal status (approximate — we check logged date for demo)
    const completed = useCases.filter((uc) => {
      if (!TERMINAL.includes(uc.status) || uc.status === "Cancelled") return false;
      const d = new Date(uc.loggedDate);
      return d >= weekStart && d < weekEnd;
    }).length;
    buckets.push({ label, added, completed });
  }

  return buckets;
}

// ── Page ─────────────────────────────────────────────────────────────
export default function ManagerInsights() {
  const { data: response } = useUseCases();
  const useCases = response?.data ?? [];

  const accounts = useMemo(() => buildAccountSummaries(useCases), [useCases]);
  const leads = useMemo(() => buildLeadWorkloads(useCases), [useCases]);
  const risks = useMemo(() => identifyRisks(useCases), [useCases]);
  const velocity = useMemo(() => buildVelocity(useCases), [useCases]);

  const topStats = useMemo(() => {
    const active = useCases.filter((u) => !TERMINAL.includes(u.status));
    const totalRequired = active.reduce((s, u) => s + (parseInt(u.podMembersRequired) || 0), 0);
    const totalAssigned = active.reduce((s, u) => s + (parseInt(u.podMembersAssigned) || 0), 0);
    return {
      totalAccounts: accounts.length,
      totalLeads: leads.length,
      highRisks: risks.filter((r) => r.severity === "high").length,
      staffingGap: Math.max(0, totalRequired - totalAssigned),
    };
  }, [accounts, leads, risks, useCases]);

  return (
    <AppLayout title="📊 Manager Insights">
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="accounts">Account Summary</TabsTrigger>
          <TabsTrigger value="workload">POD Workload</TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="velocity">Velocity</TabsTrigger>
        </TabsList>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accounts</p>
                  <p className="text-3xl font-bold text-blue-600">{topStats.totalAccounts}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50"><Building2 className="h-5 w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tech Leads</p>
                  <p className="text-3xl font-bold text-purple-600">{topStats.totalLeads}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50"><Users className="h-5 w-5 text-purple-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk Items</p>
                  <p className="text-3xl font-bold text-red-600">{topStats.highRisks}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staffing Gap</p>
                  <p className="text-3xl font-bold text-amber-600">{topStats.staffingGap}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50"><Clock className="h-5 w-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Account Summary ─────────────────────────── */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Account-Level Summary</CardTitle></CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No use cases loaded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-center">Completed</TableHead>
                        <TableHead className="text-center">On Hold</TableHead>
                        <TableHead className="text-center">Cancelled</TableHead>
                        <TableHead className="text-center">Overdue</TableHead>
                        <TableHead className="text-center">Avg Age (d)</TableHead>
                        <TableHead>Type Breakdown</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((a) => (
                        <TableRow key={a.account}>
                          <TableCell className="font-medium">{a.account}</TableCell>
                          <TableCell className="text-center">{a.total}</TableCell>
                          <TableCell className="text-center font-medium text-blue-600">{a.active}</TableCell>
                          <TableCell className="text-center text-green-600">{a.completed}</TableCell>
                          <TableCell className="text-center text-slate-500">{a.onHold}</TableCell>
                          <TableCell className="text-center text-red-500">{a.cancelled}</TableCell>
                          <TableCell className="text-center">
                            {a.overdue > 0 ? (
                              <Badge variant="destructive" className="text-xs">{a.overdue}</Badge>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{a.avgAge}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(a.types).map(([t, c]) => (
                                <Badge key={t} variant="outline" className="text-[10px] py-0" style={{ borderColor: TYPE_COLORS[t as keyof typeof TYPE_COLORS], color: TYPE_COLORS[t as keyof typeof TYPE_COLORS] }}>
                                  {t}: {c}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── POD Workload ────────────────────────────── */}
        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>AI Tech Lead Workload</CardTitle></CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No tech lead assignments found.</p>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => {
                    const maxCases = Math.max(...leads.map((l) => l.activeCases), 1);
                    return (
                      <div key={lead.name} className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.accounts.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span>{lead.activeCases} active / {lead.totalCases} total</span>
                            {lead.overdue > 0 && (
                              <Badge variant="destructive" className="text-xs">{lead.overdue} overdue</Badge>
                            )}
                          </div>
                        </div>
                        <Progress
                          value={(lead.activeCases / maxCases) * 100}
                          className="h-2"
                          style={{ "--progress-background": lead.overdue > 0 ? "#ef4444" : "#3b82f6" } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Register ───────────────────────────── */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Risk Register ({risks.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length === 0 ? (
                <p className="text-center py-8 text-green-600">✓ No risk items detected!</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Risk Factors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {risks.map((item, idx) => (
                        <TableRow key={idx} className={
                          item.severity === "high"
                            ? "bg-red-50/50"
                            : item.severity === "medium"
                            ? "bg-amber-50/50"
                            : ""
                        }>
                          <TableCell>
                            <Badge
                              variant={item.severity === "high" ? "destructive" : "outline"}
                              className={
                                item.severity === "medium"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : item.severity === "low"
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : ""
                              }
                            >
                              {item.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.uc.account}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.uc.project}</TableCell>
                          <TableCell><StatusBadge status={item.uc.status} /></TableCell>
                          <TableCell className="text-muted-foreground">{item.uc.useCaseOwner || "—"}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              {item.risks.map((r, j) => (
                                <p key={j} className="text-xs text-muted-foreground">• {r}</p>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Velocity ────────────────────────────────── */}
        <TabsContent value="velocity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Weekly Intake Velocity (last 8 weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week of</TableHead>
                      <TableHead className="text-center">New Added</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                      <TableHead>Intake Bar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {velocity.map((w, i) => {
                      const max = Math.max(...velocity.map((v) => v.added), 1);
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{w.label}</TableCell>
                          <TableCell className="text-center">
                            {w.added > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{w.added}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {w.completed > 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{w.completed}</Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="w-[40%]">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(w.added / max) * 100}
                                className="h-3 flex-1"
                                style={{ "--progress-background": "#3b82f6" } as React.CSSProperties}
                              />
                              <span className="text-xs text-muted-foreground w-8">{w.added}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
