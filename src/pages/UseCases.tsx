import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useRole } from "@/contexts/RoleContext";
import { UseCase } from "@/types";
import { seedUseCases } from "@/data/seed-data";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { UseCaseDialog } from "@/components/UseCaseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Columns3, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortDir = "asc" | "desc" | null;

interface ColumnDef {
  key: keyof UseCase;
  label: string;
  visible: boolean;
  width: number;
}

const defaultColumns: ColumnDef[] = [
  { key: "title", label: "Title", visible: true, width: 220 },
  { key: "description", label: "Description", visible: true, width: 280 },
  { key: "category", label: "Category", visible: true, width: 130 },
  { key: "status", label: "Status", visible: true, width: 110 },
  { key: "priority", label: "Priority", visible: true, width: 100 },
  { key: "owner", label: "Owner", visible: true, width: 140 },
  { key: "department", label: "Department", visible: true, width: 140 },
  { key: "estimatedImpact", label: "Est. Impact", visible: true, width: 170 },
  { key: "dateCreated", label: "Date Created", visible: true, width: 120 },
];

export default function UseCases() {
  const { canEdit } = useRole();
  const [useCases, setUseCases] = useState<UseCase[]>(seedUseCases);
  const [columns, setColumns] = useState<ColumnDef[]>(defaultColumns);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof UseCase | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Resizing state
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  const visibleColumns = columns.filter((c) => c.visible);

  const filtered = useMemo(() => {
    let data = useCases;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((uc) =>
        Object.values(uc).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (sortKey && sortDir) {
      data = [...data].sort((a, b) => {
        const av = String(a[sortKey]).toLowerCase();
        const bv = String(b[sortKey]).toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return data;
  }, [useCases, search, sortKey, sortDir]);

  const handleSort = (key: keyof UseCase) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleColumn = (key: keyof UseCase) => {
    setColumns((cols) => cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };

  const handleSave = (data: Omit<UseCase, "id" | "dateCreated">) => {
    if (editingUseCase) {
      setUseCases((prev) => prev.map((uc) => (uc.id === editingUseCase.id ? { ...uc, ...data } : uc)));
    } else {
      const newUc: UseCase = {
        ...data,
        id: `uc-${Date.now()}`,
        dateCreated: new Date().toISOString().split("T")[0],
      };
      setUseCases((prev) => [...prev, newUc]);
    }
    setEditingUseCase(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      setUseCases((prev) => prev.filter((uc) => uc.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columns.findIndex((c) => c.visible && columns.filter((cc) => cc.visible).indexOf(c) === index) >= 0
      ? visibleColumns[index].width
      : 100;

    const colKey = visibleColumns[index].key;

    const handleMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      setColumns((cols) =>
        cols.map((c) => (c.key === colKey ? { ...c, width: Math.max(60, startWidth + diff) } : c))
      );
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setResizing(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    setResizing({ index, startX, startWidth });
  };

  // Drag reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const visKeys = visibleColumns.map((c) => c.key);
    const newCols = [...columns];
    const fromKey = visKeys[dragIndex];
    const toKey = visKeys[index];
    const fromIdx = newCols.findIndex((c) => c.key === fromKey);
    const toIdx = newCols.findIndex((c) => c.key === toKey);
    const [moved] = newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, moved);
    setColumns(newCols);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const renderCell = (uc: UseCase, key: keyof UseCase) => {
    if (key === "status") return <StatusBadge status={uc.status} />;
    if (key === "priority") return <PriorityBadge priority={uc.priority} />;
    if (key === "description") return <span className="line-clamp-2 text-xs">{uc.description}</span>;
    return <span className="text-sm">{String(uc[key])}</span>;
  };

  const SortIcon = ({ colKey }: { colKey: keyof UseCase }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <AppLayout title="Use Cases">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search use cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-1.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card z-50 w-48">
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={col.visible}
                    onCheckedChange={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditingUseCase(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Use Case
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((col, i) => (
                    <TableHead
                      key={col.key}
                      style={{ width: col.width, minWidth: col.width }}
                      className="relative select-none group"
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                    >
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium w-full"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        <SortIcon colKey={col.key} />
                      </button>
                      {/* Resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30"
                        onMouseDown={(e) => handleResizeStart(e, i)}
                      />
                    </TableHead>
                  ))}
                  {canEdit && <TableHead className="w-[80px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (canEdit ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                      No use cases found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((uc) => (
                    <TableRow key={uc.id} className="hover:bg-muted/50">
                      {visibleColumns.map((col) => (
                        <TableCell key={col.key} style={{ maxWidth: col.width }} className="truncate">
                          {renderCell(uc, col.key)}
                        </TableCell>
                      ))}
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUseCase(uc); setDialogOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(uc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {useCases.length} use cases • Drag column headers to reorder • Drag column edges to resize
        </p>
      </div>

      <UseCaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        useCase={editingUseCase}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Use Case</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg bg-card shadow-sm ${className || ""}`} {...props}>{children}</div>;
}
