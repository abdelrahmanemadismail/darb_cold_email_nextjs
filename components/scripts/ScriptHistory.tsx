'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, XCircle, AlertCircle, Trash2, Eye, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ScriptExecution {
  id: string;
  scriptType: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  currentPage: number;
  totalPages: number;
  progressStatus: string;
  parameters: Record<string, unknown>;
  results: {
    totalCompanies?: number;
    totalContacts?: number;
    totalRawResults?: number;
  } | null;
  errorMessage: string | null;
}

export function ScriptHistory() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScript, setSelectedScript] = useState<ScriptExecution | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['script-history', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all'
        ? '/api/script-executions?limit=50'
        : `/api/script-executions?limit=50&status=${statusFilter}`;
      const response = await fetch(url);
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/script-executions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-history'] });
      toast.success('Script execution deleted');
    },
    onError: () => {
      toast.error('Failed to delete script execution');
    },
  });

  const scripts: ScriptExecution[] = data?.executions || [];

  const filteredScripts = scripts.filter(script => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesParams = JSON.stringify(script.parameters).toLowerCase().includes(searchLower);
      return matchesParams;
    }
    return true;
  });

  const getScriptTypeName = (type: string) => {
    switch (type) {
      case 'apollo':
        return 'Apollo.io';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const calculateDuration = (script: ScriptExecution) => {
    if (!script.completedAt) return 'Running...';
    const start = new Date(script.startedAt);
    const end = new Date(script.completedAt);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Script Execution History</CardTitle>
          <CardDescription>
            View and manage past script executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by parameters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No script executions found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Script Type</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScripts.map((script) => (
                    <TableRow key={script.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(script.status)}
                          <Badge variant={getStatusBadgeVariant(script.status)}>
                            {script.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getScriptTypeName(script.scriptType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(script.startedAt), 'MMM d, HH:mm:ss')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(script.startedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {calculateDuration(script)}
                      </TableCell>
                      <TableCell>
                        {script.status === 'running' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{
                                  width: `${script.totalPages > 0 ? (script.currentPage / script.totalPages) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {script.currentPage}/{script.totalPages}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {script.totalPages} pages
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {script.results ? (
                          <div className="text-sm">
                            <span className="font-medium">{script.results.totalRawResults || 0}</span> results
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedScript(script)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {script.status !== 'running' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(script.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedScript} onOpenChange={(open) => !open && setSelectedScript(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedScript && getScriptTypeName(selectedScript.scriptType)} Script Execution Details</DialogTitle>
            <DialogDescription>
              Detailed information about this script execution
            </DialogDescription>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              {/* Status and Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedScript.status)}
                    <Badge variant={getStatusBadgeVariant(selectedScript.status)}>
                      {selectedScript.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="text-sm mt-1">{calculateDuration(selectedScript)}</p>
                </div>
              </div>

              {/* Parameters */}
              <div>
                <Label>Search Parameters</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selectedScript.parameters, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Results */}
              {selectedScript.results && (
                <div>
                  <Label>Results</Label>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedScript.results.totalRawResults || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Raw Results</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedScript.results.totalContacts || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Contacts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedScript.results.totalCompanies || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Companies</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedScript.errorMessage && (
                <div>
                  <Label className="text-destructive">Error</Label>
                  <p className="text-sm text-destructive mt-1">
                    {selectedScript.errorMessage}
                  </p>
                </div>
              )}

              {/* Progress Status */}
              <div>
                <Label>Progress</Label>
                <p className="text-sm mt-1">{selectedScript.progressStatus}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}
