import { useState, useEffect } from "react";
import { UseCase, STATUS_OPTIONS, USE_CASE_TYPES, TECH_STACK_OPTIONS } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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
    techStack: [],
    useCaseType: "Customer solicited",
    status: "Use case finalization",
    loggedDate: new Date().toISOString().split("T")[0],
    plannedEndDate: "",
    aiTechLead: "",
    podMembers: "",
    useCaseOwner: "",
    useCaseLeader: "",
    podMembersRequired: "",
    podMembersAssigned: "",
    effort: "",
    comments: "",
  });

  const [techStackInput, setTechStackInput] = useState("");
  const [showTechOptions, setShowTechOptions] = useState(false);

  useEffect(() => {
    if (useCase) {
      setForm({ ...useCase });
    } else {
      setForm({
        account: "",
        project: "",
        description: "",
        techStack: [],
        useCaseType: "Customer solicited",
        status: "Use case finalization",
        loggedDate: new Date().toISOString().split("T")[0],
        plannedEndDate: "",
        aiTechLead: "",
        podMembers: "",
        useCaseOwner: "",
        useCaseLeader: "",
        podMembersRequired: "",
        podMembersAssigned: "",
        effort: "",
        comments: "",
      });
    }
  }, [useCase, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.account || !form.project || !form.status || !form.useCaseType) {
      alert("Please fill in required fields: Account, Project, Type, and Status");
      return;
    }
    onSave(form as Omit<UseCase, "id">);
    onOpenChange(false);
  };

  const updateField = (field: keyof UseCase, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTechStack = (tech: string) => {
    const currentStack = form.techStack || [];
    if (currentStack.includes(tech)) {
      updateField(
        "techStack",
        currentStack.filter((t) => t !== tech)
      );
    } else {
      updateField("techStack", [...currentStack, tech]);
    }
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
              <Label htmlFor="useCaseType">
                Use Case Type <span className="text-destructive">*</span>
              </Label>
              <Select value={form.useCaseType} onValueChange={(v) => updateField("useCaseType", v)}>
                <SelectTrigger id="useCaseType">
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
            <Label>Tech Stack</Label>
            <div className="relative">
              <div
                className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md cursor-pointer"
                onClick={() => setShowTechOptions(!showTechOptions)}
              >
                {form.techStack && form.techStack.length > 0 ? (
                  form.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="gap-1">
                      {tech}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTechStack(tech);
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Select tech stack...</span>
                )}
              </div>
              {showTechOptions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  {TECH_STACK_OPTIONS.map((tech) => {
                    const isSelected = form.techStack?.includes(tech);
                    return (
                      <div
                        key={tech}
                        className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                        onClick={() => toggleTechStack(tech)}
                      >
                        <div className={`w-4 h-4 border rounded ${isSelected ? "bg-primary border-primary" : ""}`}>
                          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                        </div>
                        <span className="text-sm">{tech}</span>
                      </div>
                    );
                  })}
                  <div className="p-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowTechOptions(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loggedDate">Logged Date</Label>
              <Input
                id="loggedDate"
                type="date"
                value={form.loggedDate}
                onChange={(e) => updateField("loggedDate", e.target.value)}
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
              <Label htmlFor="useCaseOwner">Use Case Owner</Label>
              <Input
                id="useCaseOwner"
                value={form.useCaseOwner}
                onChange={(e) => updateField("useCaseOwner", e.target.value)}
                placeholder="Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="useCaseLeader">Use Case Leader</Label>
              <Input
                id="useCaseLeader"
                value={form.useCaseLeader}
                onChange={(e) => updateField("useCaseLeader", e.target.value)}
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
                onChange={(e) => updateField("podMembersRequired", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="podMembersAssigned"># POD Members Assigned</Label>
              <Input
                id="podMembersAssigned"
                type="number"
                min="0"
                value={form.podMembersAssigned}
                onChange={(e) => updateField("podMembersAssigned", e.target.value)}
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
