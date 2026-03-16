import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Package, Sparkles, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { STATUS_OPTIONS, USE_CASE_TYPES, STATUS_COLORS, TYPE_COLORS, UseCase } from "@/types";
import { useUseCases } from "@/hooks/useUseCases";

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { data: response, isLoading, error } = useUseCases();
  const useCases = response?.data ?? [];

  const analytics = useMemo(() => {
    if (!useCases || useCases.length === 0) {
      return {
        total: 0,
        newThisWeek: 0,
        stuckThisWeek: 0,
        overdue: 0,
        aging: [],
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const terminal = ["Client demo - completed", "SOW approved", "Cancelled"];

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    STATUS_OPTIONS.forEach((s) => (byStatus[s] = 0));
    USE_CASE_TYPES.forEach((t) => (byType[t] = 0));

    useCases.forEach((uc) => {
      if (uc.status) byStatus[uc.status] = (byStatus[uc.status] || 0) + 1;
      if (uc.useCaseType) byType[uc.useCaseType] = (byType[uc.useCaseType] || 0) + 1;
    });

    const aging = useCases.filter(
      (uc) => !terminal.includes(uc.status) && daysSince(uc.loggedDate) > 30
    );

    return {
      total: useCases.length,
      newThisWeek: useCases.filter((uc) => new Date(uc.loggedDate) >= weekAgo).length,
      stuckThisWeek: useCases.filter(
        (uc) => daysSince(uc.loggedDate) > 7 && !terminal.includes(uc.status)
      ).length,
      overdue: useCases.filter(
        (uc) =>
          uc.plannedEndDate &&
          new Date(uc.plannedEndDate) < now &&
          !terminal.includes(uc.status)
      ).length,
      aging,
      byStatus,
      byType,
    };
  }, [useCases]);

  const statusChartData = useMemo(
    () => STATUS_OPTIONS.map((s) => ({ name: s, value: analytics.byStatus[s] || 0 })),
    [analytics]
  );

  const typeChartData = useMemo(
    () => USE_CASE_TYPES.map((t) => ({ name: t, value: analytics.byType[t] || 0 })),
    [analytics]
  );

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Dashboard">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const statCards = [
    {
      label: "Total",
      value: analytics.total,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "New This Week",
      value: analytics.newThisWeek,
      icon: Sparkles,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Stuck 7+ days",
      value: analytics.stuckThisWeek,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Overdue",
      value: analytics.overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Aging 30+ days",
      value: analytics.aging.length,
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-t-4" style={{ borderTopColor: stat.color.replace("text-", "") }}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis className="text-xs" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 h-[350px] content-center">
                {typeChartData.map((type) => (
                  <div
                    key={type.name}
                    className="flex flex-col items-center justify-center p-6 rounded-lg border"
                    style={{ borderColor: `${TYPE_COLORS[type.name as keyof typeof TYPE_COLORS]}22` }}
                  >
                    <p
                      className="text-4xl font-bold mb-2"
                      style={{ color: TYPE_COLORS[type.name as keyof typeof TYPE_COLORS] }}
                    >
                      {type.value}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">{type.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aging Cases & Recent Use Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aging Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Aging Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.aging.length === 0 ? (
                <p className="text-sm text-green-600 dark:text-green-400">✓ No aging use cases</p>
              ) : (
                <div className="space-y-3">
                  {analytics.aging.slice(0, 5).map((uc) => {
                    const age = daysSince(uc.loggedDate);
                    const ageColor = age > 60 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : 
                                     age > 45 ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200" : 
                                     "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
                    
                    return (
                      <div key={uc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uc.account} — {uc.project}</p>
                          <p className="text-xs text-muted-foreground">{uc.status}</p>
                        </div>
                        <Badge className={ageColor}>{age}d</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {useCases.slice(0, 5).map((uc) => (
                  <div key={uc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uc.account}</p>
                      <p className="text-xs text-muted-foreground">{uc.project}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${STATUS_COLORS[uc.status]}22`,
                          color: STATUS_COLORS[uc.status],
                          borderColor: STATUS_COLORS[uc.status],
                        }}
                      >
                        {uc.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{uc.loggedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}