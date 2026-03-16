import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useRole } from "@/contexts/RoleContext";
import { AppUser } from "@/types";
import { UserStatusBadge } from "@/components/StatusBadge";
import { UserDialog } from "@/components/UserDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ShieldAlert, Search } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";

export default function UserManagement() {
  const { canManageUsers } = useRole();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // API hooks
  const { data: response, isLoading } = useUsers();
  const users = response?.data ?? [];

  const createMutation = useCreateUser({
    onSuccess: () => {
      toast({ title: "User created!" });
      setDialogOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      toast({ title: "Failed to create user", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useUpdateUser({
    onSuccess: () => {
      toast({ title: "User updated!" });
      setDialogOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      toast({ title: "Failed to update user", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast({ title: "User deleted", variant: "destructive" });
      setDeleteId(null);
    },
    onError: (err) => {
      toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
    },
  });

  if (!canManageUsers) return <Navigate to="/" replace />;

  const handleSave = (data: Omit<AppUser, "id" | "dateAdded">) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      // Check for duplicate email client-side
      if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        toast({ title: "A user with this email already exists.", variant: "destructive" });
        return;
      }
      createMutation.mutate({
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const target = users.find((u) => u.id === deleteId);
    // Prevent deleting the last admin
    if (target?.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin" && u.status === "Active").length;
      if (adminCount <= 1) {
        toast({ title: "Cannot delete the last active admin.", variant: "destructive" });
        setDeleteId(null);
        return;
      }
    }
    deleteMutation.mutate(deleteId);
  };

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Active").length,
    admins: users.filter((u) => u.role === "admin").length,
    editors: users.filter((u) => u.role === "editor").length,
    viewers: users.filter((u) => u.role === "viewer").length,
  };

  return (
    <AppLayout title="User Management">
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="py-1.5 px-3 text-sm">
            {stats.total} Total
          </Badge>
          <Badge variant="outline" className="py-1.5 px-3 text-sm bg-green-50 text-green-700 border-green-200">
            {stats.active} Active
          </Badge>
          <Badge variant="outline" className="py-1.5 px-3 text-sm bg-red-50 text-red-700 border-red-200">
            {stats.admins} Admin{stats.admins !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="py-1.5 px-3 text-sm bg-blue-50 text-blue-700 border-blue-200">
            {stats.editors} Editor{stats.editors !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="py-1.5 px-3 text-sm bg-slate-50 text-slate-700 border-slate-200">
            {stats.viewers} Viewer{stats.viewers !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm" onClick={() => { setEditingUser(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add User
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
        <>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 capitalize text-sm">
                          <ShieldAlert className="h-3 w-3" />
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell><UserStatusBadge status={user.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.dateAdded}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUser(user); setDialogOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(user.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length} users
        </p>
        </>
        )}
      </div>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} onSave={handleSave} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this user? They will no longer be able to sign in.</AlertDialogDescription>
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
