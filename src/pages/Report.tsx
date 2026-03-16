import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { STATUS_OPTIONS, USE_CASE_TYPES, STATUS_COLORS, TYPE_COLORS, UseCase } from "@/types";
import { useUseCases } from "@/hooks/useUseCases";

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Report() {
  const { data: response, isLoading, error } = useUseCases();
  const useCases = response?.data ?? [];

  const analytics = useMemo(() => {
    if (!useCases || useCases.length === 0) {
      return {
        newThisWeek: 0,
        stuckThisWeek: 0,
        overdue: 0,
        total: 0,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        aging: [] as UseCase[],
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
      byStatus,
      byType,
      aging,
    };
  }, [useCases]);

  if (isLoading) {
    return (
      <AppLayout title="Weekly Progress Report">
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Weekly Progress Report">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load report data.</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="📈 Weekly Progress Report">
      <div className="space-y-6">
        {/* Weekly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-green-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  New This Week
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {analytics.newThisWeek}
                </p>
                <p className="text-xs text-muted-foreground">use cases added in last 7 days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Stuck This Week
                </p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {analytics.stuckThisWeek}
                </p>
                <p className="text-xs text-muted-foreground">active with no recent progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-red-500">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {analytics.overdue}
                </p>
                <p className="text-xs text-muted-foreground">past planned end date</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Solicitation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitation Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {USE_CASE_TYPES.map((type) => {
                const count = analytics.byType[type] || 0;
                const percentage = analytics.total
                  ? Math.round((count / analytics.total) * 100)
                  : 0;

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-medium"
                        style={{ color: TYPE_COLORS[type] }}
                      >
                        {type}
                      </span>
                      <span className="text-sm">
                        {count} <span className="text-muted-foreground">({percentage}%)</span>
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-3"
                      style={
                        {
                          "--progress-background": TYPE_COLORS[type],
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STATUS_OPTIONS.map((status) => {
                const count = analytics.byStatus[status] || 0;
                if (count === 0) return null;

                const percentage = analytics.total
                  ? Math.round((count / analytics.total) * 100)
                  : 0;

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm"
                        style={{ color: STATUS_COLORS[status] }}
                      >
                        {status}
                      </span>
                      <span className="text-xs">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={
                        {
                          "--progress-background": STATUS_COLORS[status],
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Aging Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔥 Aging Report — Active Cases 30+ Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.aging.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-green-600 dark:text-green-400">
                  ✓ No aging use cases!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Logged</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.aging.map((uc) => {
                      const age = daysSince(uc.loggedDate);
                      const ageColor =
                        age > 60
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                          : age > 45
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";

                      const isOverdue =
                        uc.plannedEndDate && new Date(uc.plannedEndDate) < new Date();

                      return (
                        <TableRow key={uc.id}>
                          <TableCell className="font-medium">{uc.account}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {uc.project}
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: `${STATUS_COLORS[uc.status]}22`,
                                color: STATUS_COLORS[uc.status],
                                borderColor: STATUS_COLORS[uc.status],
                              }}
                            >
                              {uc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {uc.useCaseOwner}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {uc.loggedDate}
                          </TableCell>
                          <TableCell>
                            <Badge className={ageColor}>{age} days</Badge>
                          </TableCell>
                          <TableCell
                            className={isOverdue ? "text-red-600" : "text-muted-foreground"}
                          >
                            {uc.plannedEndDate || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
