'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import {
  getAllRoles,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type UserRole
} from '@/lib/roles';
import { Shield, Users, Loader2, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';
import type { ExtendedUser } from '@/types/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user as ExtendedUser | undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' as UserRole });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('User role updated successfully');
        setEditingUserId(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([data.user, ...users]);
        toast.success('User created successfully');
        setShowCreateDialog(false);
        setNewUser({ name: '', email: '', password: '', role: 'viewer' });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and user access
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users & Roles
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Role Info
          </TabsTrigger>
        </TabsList>

        {/* Users & Roles Tab */}
        <TabsContent value="users" className="space-y-4">
          <PermissionGuard
            role="admin"
            fallback={
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    You don&apos;t have permission to manage users. Contact an administrator.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user roles and permissions. Only administrators can modify user roles.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {editingUserId === user.id ? (
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                                disabled={updating}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAllRoles().map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {ROLE_LABELS[role]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <RoleBadge role={user.role} showIcon />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingUserId === user.id ? (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingUserId(null)}
                                  disabled={updating}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUserId(user.id)}
                                  disabled={user.id === currentUser?.id || updating}
                                >
                                  {user.id === currentUser?.id ? 'You' : 'Edit Role'}
                                </Button>
                                {user.id !== currentUser?.id && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    disabled={updating}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>

        {/* Role Info Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Descriptions</CardTitle>
              <CardDescription>
                Understanding the different roles and their capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getAllRoles().reverse().map((role) => (
                <div key={role} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} showIcon />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>
                What each role can and cannot do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <PermissionTable />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to login with the credentials you provide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAllRoles().map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionTable() {
  const permissions = [
    { feature: 'View Campaigns', admin: true, editor: true, viewer: true },
    { feature: 'Create/Edit Campaigns', admin: true, editor: true, viewer: false },
    { feature: 'Delete Campaigns', admin: true, editor: true, viewer: false },
    { feature: 'View Scripts', admin: true, editor: true, viewer: true },
    { feature: 'Create/Edit Scripts', admin: true, editor: true, viewer: false },
    { feature: 'Run Scripts', admin: true, editor: true, viewer: false },
    { feature: 'View Data', admin: true, editor: true, viewer: true },
    { feature: 'Edit/Delete Data', admin: true, editor: true, viewer: false },
    { feature: 'Import/Export Data', admin: true, editor: true, viewer: false },
    { feature: 'View Analytics', admin: true, editor: true, viewer: true },
    { feature: 'Manage Users', admin: true, editor: false, viewer: false },
    { feature: 'Edit Settings', admin: true, editor: false, viewer: false },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead className="text-center">Admin</TableHead>
          <TableHead className="text-center">Editor</TableHead>
          <TableHead className="text-center">Viewer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {permissions.map((perm, idx) => (
          <TableRow key={idx}>
            <TableCell className="font-medium">{perm.feature}</TableCell>
            <TableCell className="text-center">
              {perm.admin ? '✓' : '✗'}
            </TableCell>
            <TableCell className="text-center">
              {perm.editor ? '✓' : '✗'}
            </TableCell>
            <TableCell className="text-center">
              {perm.viewer ? '✓' : '✗'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

