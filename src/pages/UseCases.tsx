import { useState, useMemo, useRef } from "react";
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
        // Fallback: if useCaseType is unknown/missing, default to "Unsolicited"
        if (!data.useCaseType || !USE_CASE_TYPES.includes(data.useCaseType as any)) {
          data.useCaseType = "Unsolicited";
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

  const filtered = useMemo(() => {
    return useCases.filter((uc) => {
      const matchesSearch =
        !search ||
        [uc.account, uc.project, uc.description, uc.useCaseOwner].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase())
        );
      const matchesStatus = filterStatus === "all" || uc.status === filterStatus;
      const matchesType = filterType === "all" || uc.useCaseType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [useCases, search, filterStatus, filterType]);

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
        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Logged</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Effort</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No use cases found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((uc) => (
                  <TableRow key={uc.id}>
                    <TableCell className="font-medium">{uc.account}</TableCell>
                    <TableCell>{uc.project}</TableCell>
                    <TableCell>
                      <TypeBadge type={uc.useCaseType} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={uc.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{uc.loggedDate}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {uc.plannedEndDate || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{uc.useCaseOwner}</TableCell>
                    <TableCell className="text-muted-foreground">{uc.effort}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
        </Card>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {useCases.length} use cases
        </p>
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
                        <TableCell>{row.data.useCaseType || "—"}</TableCell>
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
