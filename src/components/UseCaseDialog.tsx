import { useState, useEffect } from "react";
import { UseCase, UseCaseStatus, UseCasePriority, UseCaseCategory } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories: UseCaseCategory[] = ["Customer Service", "Operations", "Marketing", "Finance", "HR", "IT", "Sales", "Product", "Legal"];
const statuses: UseCaseStatus[] = ["Draft", "Active", "In Review", "Completed", "Archived"];
const priorities: UseCasePriority[] = ["Low", "Medium", "High", "Critical"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCase?: UseCase | null;
  onSave: (data: Omit<UseCase, "id" | "dateCreated">) => void;
}

export function UseCaseDialog({ open, onOpenChange, useCase, onSave }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Operations" as UseCaseCategory,
    status: "Draft" as UseCaseStatus,
    priority: "Medium" as UseCasePriority,
    owner: "",
    department: "",
    estimatedImpact: "",
  });

  useEffect(() => {
    if (useCase) {
      setForm({
        title: useCase.title,
        description: useCase.description,
        category: useCase.category,
        status: useCase.status,
        priority: useCase.priority,
        owner: useCase.owner,
        department: useCase.department,
        estimatedImpact: useCase.estimatedImpact,
      });
    } else {
      setForm({ title: "", description: "", category: "Operations", status: "Draft", priority: "Medium", owner: "", department: "", estimatedImpact: "" });
    }
  }, [useCase, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card">
        <DialogHeader>
          <DialogTitle>{useCase ? "Edit Use Case" : "Create New Use Case"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as UseCaseCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card z-50">{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as UseCaseStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card z-50">{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as UseCasePriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card z-50">{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="owner">Owner</Label>
                <Input id="owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="impact">Estimated Impact</Label>
                <Input id="impact" value={form.estimatedImpact} onChange={(e) => setForm({ ...form, estimatedImpact: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{useCase ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
