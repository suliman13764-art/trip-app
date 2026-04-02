import { useState } from "react";
import { PlusCircle, ShieldCheck, UserCog, UserMinus, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const AdminUserManagement = ({ users, onCreateUser, onToggleUser, loading }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      return;
    }
    await onCreateUser({ username: username.trim(), password, role });
    setUsername("");
    setPassword("");
    setRole("user");
  };

  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Admin access management</CardTitle>
          <p className="text-sm text-muted-foreground">Create users and soft deactivate access centrally. Regular users cannot see or use these controls.</p>
        </div>
        <Badge variant="secondary">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Owner/Admin only
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 rounded-2xl border bg-[hsl(var(--surface-2))] p-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="create-user-username">Username</Label>
            <Input id="create-user-username" value={username} onChange={(event) => setUsername(event.target.value)} data-testid="admin-create-username-input" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="create-user-password">Password</Label>
            <Input id="create-user-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="admin-create-password-input" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="admin-create-role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Regular User</SelectItem>
                <SelectItem value="admin">Owner/Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleCreate} className="w-full" data-testid="admin-create-user-button">
              <PlusCircle className="h-4 w-4" />
              Create user
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role === "user" ? "Regular User" : "Owner/Admin"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "secondary" : "outline"}>{user.is_active ? "Active" : "Deactivated"}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.last_login_at ? user.last_login_at.replace("T", " ").slice(0, 16) : "Never"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant={user.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => onToggleUser(user)}
                      disabled={loading}
                      data-testid={`admin-toggle-user-${user.username}`}
                    >
                      {user.is_active ? <UserMinus className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
                      {user.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
