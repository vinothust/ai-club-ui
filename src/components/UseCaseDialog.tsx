import { useState, useEffect } from "react";
import { UseCase, STATUS_OPTIONS, USE_CASE_TYPES } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCase?: UseCase | null;
  onSave: (data: Omit<UseCase, "id">) => void;
}

export function UseCaseDialog({ open, onOpenChange, useCase, onSave }: Props) {
  const [form, setForm] = useState<Partial<UseCase>>({
    account: "",
    project: "",
    description: "",
    techStack: "",
    usecase: "Customer solicited",
    status: "Use case finalization",
    useCaseLoggedDate: new Date().toISOString().split("T")[0],
    plannedEndDate: "",
    aiTechLead: "",
    podMembers: "",
    usecaseOwner: "",
    usecaseLeader: "",
    podMembersRequired: 0,
    podMembersAllocated: 0,
    effort: "",
    comments: "",
  });

  const [techStackInput, setTechStackInput] = useState("");

  useEffect(() => {
    if (useCase) {
      setForm({ ...useCase });
    } else {
      setForm({
        account: "",
        project: "",
        description: "",
        techStack: "",
        usecase: "Customer solicited",
        status: "Use case finalization",
        useCaseLoggedDate: new Date().toISOString().split("T")[0],
        plannedEndDate: "",
        aiTechLead: "",
        podMembers: "",
        usecaseOwner: "",
        usecaseLeader: "",
        podMembersRequired: 0,
        podMembersAllocated: 0,
        effort: "",
        comments: "",
      });
    }
  }, [useCase, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account || !form.project || !form.status || !form.usecase) {
      alert("Please fill in required fields: Account, Project, Type, and Status");
      return;
    }
    onSave(form as Omit<UseCase, "id">);
    onOpenChange(false);
  };

  const updateField = (field: keyof UseCase, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{useCase ? "Edit Use Case" : "New Use Case"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">
                Account <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account"
                value={form.account}
                onChange={(e) => updateField("account", e.target.value)}
                placeholder="Client / Account name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project"
                value={form.project}
                onChange={(e) => updateField("project", e.target.value)}
                placeholder="Project name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description..."
              rows={3}
            />
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usecase">
                Use Case Type <span className="text-destructive">*</span>
              </Label>
              <Select value={form.usecase} onValueChange={(v) => updateField("usecase", v)}>
                <SelectTrigger id="usecase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <Label htmlFor="techStack">Tech Stack</Label>
            <Input
              id="techStack"
              value={form.techStack as string}
              onChange={(e) => updateField("techStack", e.target.value)}
              placeholder="e.g. React, AWS Bedrock, GPT-4"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="useCaseLoggedDate">Logged Date</Label>
              <Input
                id="useCaseLoggedDate"
                type="date"
                value={form.useCaseLoggedDate}
                onChange={(e) => updateField("useCaseLoggedDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plannedEndDate">Planned End Date</Label>
              <Input
                id="plannedEndDate"
                type="date"
                value={form.plannedEndDate}
                onChange={(e) => updateField("plannedEndDate", e.target.value)}
              />
            </div>
          </div>

          {/* Team Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aiTechLead">AI Tech Lead</Label>
              <Input
                id="aiTechLead"
                value={form.aiTechLead}
                onChange={(e) => updateField("aiTechLead", e.target.value)}
                placeholder="Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usecaseOwner">Use Case Owner</Label>
              <Input
                id="usecaseOwner"
                value={form.usecaseOwner}
                onChange={(e) => updateField("usecaseOwner", e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usecaseLeader">Use Case Leader</Label>
              <Input
                id="usecaseLeader"
                value={form.usecaseLeader}
                onChange={(e) => updateField("usecaseLeader", e.target.value)}
                placeholder="Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effort">Effort</Label>
              <Input
                id="effort"
                value={form.effort}
                onChange={(e) => updateField("effort", e.target.value)}
                placeholder="e.g. 120 hrs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="podMembers">POD Members (comma separated)</Label>
            <Input
              id="podMembers"
              value={form.podMembers}
              onChange={(e) => updateField("podMembers", e.target.value)}
              placeholder="Name1, Name2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="podMembersRequired"># POD Members Required</Label>
              <Input
                id="podMembersRequired"
                type="number"
                min="0"
                value={form.podMembersRequired}
                onChange={(e) => updateField("podMembersRequired", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="podMembersAllocated"># POD Members Allocated</Label>
              <Input
                id="podMembersAllocated"
                type="number"
                min="0"
                value={form.podMembersAllocated}
                onChange={(e) => updateField("podMembersAllocated", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(e) => updateField("comments", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{useCase ? "Update" : "Add Use Case"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
