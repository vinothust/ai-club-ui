import { useState, useMemo, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { UseCase, STATUS_OPTIONS, USE_CASE_TYPES, UseCaseStatus, UseCaseType } from "@/types";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { UseCaseDialog } from "@/components/UseCaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Upload, Download, FileDown } from "lucide-react";
import { parseExcelFile, downloadTemplate, exportToExcel, ParsedRow } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import { useUseCases, useCreateUseCase, useUpdateUseCase, useDeleteUseCase } from "@/hooks/useUseCases";
import { Skeleton } from "@/components/ui/skeleton";

export default function UseCases() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkPreview, setBulkPreview] = useState<ParsedRow[] | null>(null);
  const [bulkMode, setBulkMode] = useState<"append" | "replace">("append");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // API hooks
  const { data: response, isLoading } = useUseCases();
  const useCases = response?.data ?? [];
  
  const createMutation = useCreateUseCase({
    onSuccess: () => {
      toast({ title: "Use case added!" });
      setDialogOpen(false);
      setEditingUseCase(null);
    },
    onError: (err) => {
      toast({ title: "Failed to create use case", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useUpdateUseCase({
    onSuccess: () => {
      toast({ title: "Use case updated!" });
      setDialogOpen(false);
      setEditingUseCase(null);
    },
    onError: (err) => {
      toast({ title: "Failed to update use case", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useDeleteUseCase({
    onSuccess: () => {
      toast({ title: "Use case deleted", variant: "destructive" });
      setDeleteId(null);
    },
    onError: (err) => {
      toast({ title: "Failed to delete use case", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = (data: Omit<UseCase, "id">) => {
    if (editingUseCase) {
      updateMutation.mutate({ id: editingUseCase.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (uc: UseCase) => {
    setEditingUseCase(uc);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseExcelFile(file);
      setBulkPreview(parsed);
    } catch (error: any) {
      toast({ title: "Failed to parse file", description: error.message, variant: "destructive" });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!bulkPreview) return;

    // Import all rows that have at least account OR project — skip only fully empty rows.
    // Apply fallback defaults for unknown status/type values.
    const importableRows = bulkPreview
      .filter((row) => row.data.account || row.data.project)
      .map((row) => {
        const data = { ...row.data };
        // Fallback: if status is unknown/missing, default to first valid status
        if (!data.status || !STATUS_OPTIONS.includes(data.status as any)) {
          data.status = "Use case finalization";
        }
        // Fallback: if usecase type is unknown/missing, default to "Unsolicited"
        if (!data.usecase || !USE_CASE_TYPES.includes(data.usecase as any)) {
          data.usecase = "Unsolicited";
        }
        return data;
      }) as Omit<UseCase, "id">[];

    // Create each use case via API
    importableRows.forEach((row) => {
      createMutation.mutate(row);
    });

    setBulkPreview(null);

    const skippedCount = bulkPreview.length - importableRows.length;
    toast({
      title: `Importing ${importableRows.length} use cases${skippedCount > 0 ? ` (${skippedCount} empty rows skipped)` : ""}`,
    });
  };

  const accountOptions = useMemo(
    () => [...new Set(useCases.map((uc) => uc.account).filter(Boolean))].sort(),
    [useCases]
  );

  const filtered = useMemo(() => {
    return useCases.filter((uc) => {
      const matchesSearch =
        !search ||
        [uc.account, uc.project, uc.description, uc.usecaseOwner].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase())
        );
      const matchesStatus = filterStatus === "all" || uc.status === filterStatus;
      const matchesType = filterType === "all" || uc.usecase === filterType;
      const matchesAccount = filterAccount === "all" || uc.account === filterAccount;
      return matchesSearch && matchesStatus && matchesType && matchesAccount;
    });
  }, [useCases, search, filterStatus, filterType, filterAccount]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterType, filterAccount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppLayout title="Use Cases">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search use cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {USE_CASE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accountOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(useCases)}
              disabled={useCases.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingUseCase(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Use Case
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
        <>
        {/* Table — horizontally scrollable, sticky action column */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1600px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Account</TableHead>
                  <TableHead className="min-w-[220px]">Project</TableHead>
                  <TableHead className="min-w-[160px]">Description</TableHead>
                  <TableHead className="min-w-[120px]">Type</TableHead>
                  <TableHead className="min-w-[170px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Priority</TableHead>
                  <TableHead className="min-w-[120px]">Tech Stack</TableHead>
                  <TableHead className="min-w-[110px]">Logged Date</TableHead>
                  <TableHead className="min-w-[80px]">Aging (d)</TableHead>
                  <TableHead className="min-w-[110px]">End Date</TableHead>
                  <TableHead className="min-w-[180px]">AI Tech Lead</TableHead>
                  <TableHead className="min-w-[160px]">POD Members</TableHead>
                  <TableHead className="min-w-[140px]">Owner</TableHead>
                  <TableHead className="min-w-[140px]">Leader</TableHead>
                  <TableHead className="min-w-[80px]">Req</TableHead>
                  <TableHead className="min-w-[80px]">Alloc</TableHead>
                  <TableHead className="min-w-[90px]">Effort</TableHead>
                  <TableHead className="min-w-[200px]">Comments</TableHead>
                  <TableHead className="sticky right-0 bg-background border-l min-w-[90px] text-center z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={19} className="text-center py-8 text-muted-foreground">
                      No use cases found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((uc) => (
                    <TableRow key={uc.id}>
                      <TableCell className="font-medium whitespace-nowrap">{uc.account}</TableCell>
                      <TableCell>
                        <div className="max-w-[220px] truncate" title={uc.project}>{uc.project}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[160px] truncate text-muted-foreground text-xs" title={uc.description}>{uc.description}</div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={uc.usecase} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={uc.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{uc.priority || "—"}</TableCell>
                      <TableCell>
                        <div className="max-w-[120px] truncate text-muted-foreground text-xs" title={uc.techStack}>{uc.techStack || "—"}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{uc.useCaseLoggedDate}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{uc.aging ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{uc.plannedEndDate || "—"}</TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate text-muted-foreground text-xs" title={uc.aiTechLead}>{uc.aiTechLead || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[160px] text-muted-foreground text-xs whitespace-pre-line line-clamp-3" title={uc.podMembers}>{uc.podMembers || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[140px] truncate text-muted-foreground text-xs" title={uc.usecaseOwner}>{uc.usecaseOwner || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[140px] truncate text-muted-foreground text-xs" title={uc.usecaseLeader}>{uc.usecaseLeader || "—"}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center">{uc.podMembersRequired ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{uc.podMembersAllocated ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{uc.effort || "—"}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] text-muted-foreground text-xs whitespace-pre-line line-clamp-3" title={uc.comments}>{uc.comments || "—"}</div>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background border-l z-10">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(uc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(uc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} use cases
            {filtered.length !== useCases.length && ` (filtered from ${useCases.length} total)`}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <span className="sr-only">First page</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <span className="sr-only">Previous page</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="sr-only">Next page</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <span className="sr-only">Last page</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              </Button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Dialog */}
      <UseCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        useCase={editingUseCase}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this use case?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Preview */}
      {bulkPreview && (
        <AlertDialog open={!!bulkPreview} onOpenChange={() => setBulkPreview(null)}>
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Import Preview</AlertDialogTitle>
              <AlertDialogDescription>
                {bulkPreview.filter((r) => r.data.account || r.data.project).length} importable rows,{" "}
                {bulkPreview.filter((r) => !r.data.account && !r.data.project).length} empty rows skipped
                {bulkPreview.some((r) => r.errors.length > 0) && (
                  <span className="text-yellow-600">
                    {" "}· {bulkPreview.filter((r) => r.errors.length > 0).length} rows have warnings (will be imported with defaults)
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={bulkMode === "append" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode("append")}
                >
                  Append ({useCases.length} existing)
                </Button>
                <Button
                  variant={bulkMode === "replace" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode("replace")}
                >
                  Replace All
                </Button>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkPreview.map((row, idx) => (
                      <TableRow key={idx} className={row.errors.length > 0 ? "bg-destructive/10" : ""}>
                        <TableCell>{row.rowNum}</TableCell>
                        <TableCell>{row.data.account || "—"}</TableCell>
                        <TableCell>{row.data.project || "—"}</TableCell>
                        <TableCell>{row.data.usecase || "—"}</TableCell>
                        <TableCell>{row.data.status || "—"}</TableCell>
                        <TableCell>
                          {row.errors.length === 0 ? (
                            <span className="text-green-600">✓ OK</span>
                          ) : (
                            <span className="text-destructive text-xs">
                              {row.errors.map((e) => e.message).join(", ")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmImport}>
                Import {bulkPreview.filter((r) => r.data.account || r.data.project).length} Records
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
