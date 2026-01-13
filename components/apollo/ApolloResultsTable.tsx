'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, ChevronLeft, ChevronRight, Settings, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { ApolloSearchResult } from '@/db/schema/apollo-search-results';
import { EnrichmentSettingsDialog, type EnrichmentSettings } from './EnrichmentSettingsDialog';
import { ApolloBulkActionsMenu } from './ApolloBulkActionsMenu';

interface ApolloResultsResponse {
  data: ApolloSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ApolloResultsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [processedFilter, setProcessedFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<ApolloSearchResult | null>(null);
  const [showEnrichmentDialog, setShowEnrichmentDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ApolloResultsResponse>({
    queryKey: ['apollo-results', page, search, processedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.append('search', search);
      if (processedFilter !== 'all') params.append('processed', processedFilter);

      const response = await fetch(`/api/apollo-results?${params}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
  });

  const enrichMutation = useMutation({
    mutationFn: async (settings: EnrichmentSettings) => {
      const response = await fetch('/api/apollo-results/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enrich data');
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast.success('Enrichment completed!', {
        description: `Processed ${result.data.totalProcessed} results. Created ${result.data.companiesCreated} companies and ${result.data.contactsCreated} contacts.`,
      });
      queryClient.invalidateQueries({ queryKey: ['apollo-results'] });
      setShowEnrichmentDialog(false);
    },
    onError: (error: Error) => {
      toast.error('Enrichment failed', {
        description: error.message,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/apollo-results', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete results');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`Deleted ${selectedIds.size} results`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['apollo-results'] });
    },
    onError: (error: Error) => {
      toast.error('Delete failed', {
        description: error.message,
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, processed }: { ids: string[]; processed: boolean }) => {
      const response = await fetch('/api/apollo-results/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, processed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update results');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(`Updated ${selectedIds.size} results`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['apollo-results'] });
    },
    onError: (error: Error) => {
      toast.error('Update failed', {
        description: error.message,
      });
    },
  });

  const handleSelectAll = () => {
    if (!data?.data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map(r => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} result(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleBulkMarkProcessed = (processed: boolean) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), processed });
  };

  const handleBulkExport = () => {
    if (!data?.data || selectedIds.size === 0) return;
    const selectedResults = data.data.filter(r => selectedIds.has(r.id));
    const csv = [
      ['Person ID', 'First Name', 'Last Name', 'Title', 'Company', 'Has Email', 'Processed', 'Created At'].join(','),
      ...selectedResults.map(r => [
        r.personId,
        r.firstName || '',
        r.lastNameObfuscated || '',
        r.title || '',
        r.organizationName || '',
        r.hasEmail === true ? 'Yes' : 'No',
        r.processed === true ? 'Yes' : 'No',
        r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd') : '',
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedIds.size} results`);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedIds(new Set()); // Clear selection when filtering
  };

  const handleProcessedFilter = (value: string) => {
    setProcessedFilter(value);
    setPage(1);
    setSelectedIds(new Set()); // Clear selection when filtering
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load Apollo results</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apollo Search Results</CardTitle>
              <CardDescription>
                View raw API responses from Apollo searches ({data?.pagination.total || 0} total results)
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowEnrichmentDialog(true)}
              disabled={enrichMutation.isPending}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {enrichMutation.isPending ? 'Enriching...' : 'Enrich Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters + Bulk Actions (like Data page) */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, or company..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={processedFilter} onValueChange={handleProcessedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="false">Not Processed</SelectItem>
                  <SelectItem value="true">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.size > 0 && (
              <ApolloBulkActionsMenu
                selectedCount={selectedIds.size}
                onDelete={handleBulkDelete}
                onMarkProcessed={() => handleBulkMarkProcessed(true)}
                onMarkUnprocessed={() => handleBulkMarkProcessed(false)}
                onExport={handleBulkExport}
                isDeleting={bulkDeleteMutation.isPending}
                isUpdating={bulkUpdateMutation.isPending}
              />
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center"
                      aria-label="Select all"
                    >
                      {data?.data && selectedIds.size === data.data.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Has Email</TableHead>
                  <TableHead>Processed</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <button
                          onClick={() => handleSelectRow(result.id)}
                          className="flex items-center justify-center"
                          aria-label="Select row"
                        >
                          {selectedIds.has(result.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.firstName}</div>
                          {result.lastNameObfuscated && (
                            <div className="text-xs text-muted-foreground">
                              {result.lastNameObfuscated}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{result.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{result.organizationName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.hasEmail === true ? 'default' : 'secondary'}>
                          {result.hasEmail === true ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.processed === true ? 'default' : 'outline'}>
                          {result.processed === true ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {result.pageNumber || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {result.createdAt ? format(new Date(result.createdAt), 'MMM d, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, data.pagination.total)} of{' '}
                {data.pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apollo Search Result Details</DialogTitle>
            <DialogDescription>
              Person ID: {selectedResult?.personId}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Person Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd>{selectedResult.firstName} {selectedResult.lastNameObfuscated}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Title</dt>
                      <dd>{selectedResult.title}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last Refreshed</dt>
                      <dd>{selectedResult.lastRefreshedAt || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Data Availability</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Has Email:</dt>
                      <dd>
                        <Badge variant={selectedResult.hasEmail === true ? 'default' : 'secondary'}>
                          {selectedResult.hasEmail === true ? 'Yes' : 'No'}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Has Phone:</dt>
                      <dd>
                        <Badge variant={selectedResult.hasDirectPhone === true ? 'default' : 'secondary'}>
                          {selectedResult.hasDirectPhone === true ? 'Yes' : 'No'}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Has Location:</dt>
                      <dd>
                        <Badge variant={selectedResult.hasCity === true ? 'default' : 'secondary'}>
                          {selectedResult.hasCity === true ? 'Yes' : 'No'}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Organization</h4>
                <p className="text-sm">{selectedResult.organizationName}</p>
                {selectedResult.organizationData ? (
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedResult.organizationData, null, 2)}
                  </pre>
                ) : null}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Search Parameters</h4>
                <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedResult.searchParams, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Raw API Response</h4>
                <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-60">
                  {JSON.stringify(selectedResult.rawResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrichment Settings Dialog */}
      <EnrichmentSettingsDialog
        open={showEnrichmentDialog}
        onOpenChange={setShowEnrichmentDialog}
        onConfirm={(settings) => enrichMutation.mutate(settings)}
        isPending={enrichMutation.isPending}
      />
    </>
  );
}
