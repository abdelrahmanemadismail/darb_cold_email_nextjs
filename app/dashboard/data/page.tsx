'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Download, Upload, MoreVertical, Filter, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/db/schema/companies';
import type { Contact } from '@/db/schema/contacts';

interface ContactWithCompany extends Contact {
  companyName: string | null;
  companyDomain: string | null;
}

export default function DataPage() {
  const [selectedTab, setSelectedTab] = useState('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    industry: 'all',
    size: 'all',
    status: 'all',
    source: 'all',
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactWithCompany | null>(null);
  const [editForm, setEditForm] = useState<Partial<Company | ContactWithCompany>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic filter options
  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[];
  const uniqueSizes = Array.from(new Set(companies.map(c => c.size).filter(Boolean))) as string[];
  const uniqueSources = Array.from(new Set(companies.map(c => c.source).filter(Boolean))) as string[];
  const uniqueStatuses = Array.from(new Set(contacts.map(c => c.status).filter(Boolean))) as string[];

  const fetchCompanies = useCallback(async (search?: string) => {
    try {
      setLoadingCompanies(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.industry && filters.industry !== 'all') params.append('industry', filters.industry);
      if (filters.size && filters.size !== 'all') params.append('size', filters.size);
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);

      const response = await fetch(`/api/companies?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [filters.industry, filters.size, filters.source]);

  const fetchContacts = useCallback(async (search?: string) => {
    try {
      setLoadingContacts(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`/api/contacts?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch contacts');
      }

      const data = await response.json();
      setContacts(data.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load contacts');
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [filters.status]);

  // Fetch companies and contacts on mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Debounced search with proper cleanup
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedTab === 'companies') {
        fetchCompanies(searchQuery);
      } else {
        fetchContacts(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedTab, fetchCompanies, fetchContacts]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ industry: 'all', size: 'all', status: 'all', source: 'all' });
  };



  const handleDelete = async (id: string, type: 'companies' | 'contacts') => {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }

    try {
      const endpoint = type === 'companies' ? `/api/companies/${id}` : `/api/contacts/${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success(`${type.slice(0, -1)} deleted successfully`);

      if (type === 'companies') {
        fetchCompanies(searchQuery);
      } else {
        fetchContacts(searchQuery);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setSelectedContact(null);
    setViewDialogOpen(true);
  };

  const handleViewContact = (contact: ContactWithCompany) => {
    setSelectedContact(contact);
    setSelectedCompany(null);
    setViewDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setSelectedContact(null);
    setEditForm(company);
    setEditDialogOpen(true);
  };

  const handleEditContact = (contact: ContactWithCompany) => {
    setSelectedContact(contact);
    setSelectedCompany(null);
    setEditForm(contact);
    setEditDialogOpen(true);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setSelectedContact(null);
    setEditForm({ name: '', source: 'manual' });
    setEditDialogOpen(true);
  };

  const handleAddContact = () => {
    setSelectedContact(null);
    setSelectedCompany(null);
    setEditForm({ firstName: '', lastName: '', email: '', status: 'active' });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      // Determine if we're editing an existing item or creating new
      const isEditing = selectedCompany !== null || selectedContact !== null;
      const isCompany = selectedCompany !== null || (editForm as Partial<Company>).name !== undefined;

      // Validation
      if (isCompany) {
        if (!(editForm as Partial<Company>).name?.trim()) {
          toast.error('Company name is required');
          setIsSaving(false);
          return;
        }
      } else {
        const contact = editForm as Partial<ContactWithCompany>;
        if (!contact.firstName?.trim() || !contact.lastName?.trim()) {
          toast.error('First name and last name are required');
          setIsSaving(false);
          return;
        }
        if (!contact.email?.trim()) {
          toast.error('Email is required');
          setIsSaving(false);
          return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          toast.error('Please enter a valid email address');
          setIsSaving(false);
          return;
        }
      }

      const itemId = isCompany ? selectedCompany?.id : selectedContact?.id;
      const endpoint = isEditing
        ? (isCompany ? `/api/companies/${itemId}` : `/api/contacts/${itemId}`)
        : (isCompany ? '/api/companies' : '/api/contacts');
      const method = isEditing ? 'PUT' : 'POST';

      // Remove readonly fields before sending
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, createdBy, ...updateData } = editForm as Record<string, unknown>;
      // Remove contact-specific computed fields if present
      delete (updateData as Record<string, unknown>).companyName;
      delete (updateData as Record<string, unknown>).companyDomain;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success(`${isCompany ? 'Company' : 'Contact'} ${isEditing ? 'updated' : 'created'} successfully`);
      setEditDialogOpen(false);

      if (isCompany) {
        fetchCompanies(searchQuery);
      } else {
        fetchContacts(searchQuery);
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const dataType = selectedTab;
      const data = dataType === 'companies' ? companies : contacts;

      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Convert data to CSV
      const csvContent = convertToCSV(data, dataType);

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} ${dataType}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: (Company | ContactWithCompany)[], type: string): string => {
    if (data.length === 0) return '';

    // Define headers based on type
    const headers = type === 'companies'
      ? ['Name', 'Domain', 'Industry', 'Size', 'City', 'Country', 'Website', 'Phone', 'Source', 'Created At']
      : ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Department', 'Company Name', 'Status', 'Created At'];

    // Create header row
    const csvRows = [headers.join(',')];

    // Add data rows
    data.forEach((item) => {
      if (type === 'companies') {
        const company = item as Company;
        const row = [
          escapeCSV(company.name),
          escapeCSV(company.domain),
          escapeCSV(company.industry),
          escapeCSV(company.size),
          escapeCSV(company.city),
          escapeCSV(company.country),
          escapeCSV(company.website),
          escapeCSV(company.phone),
          escapeCSV(company.source),
          new Date(company.createdAt).toISOString(),
        ];
        csvRows.push(row.join(','));
      } else {
        const contact = item as ContactWithCompany;
        const row = [
          escapeCSV(contact.firstName),
          escapeCSV(contact.lastName),
          escapeCSV(contact.email),
          escapeCSV(contact.phone),
          escapeCSV(contact.jobTitle),
          escapeCSV(contact.department),
          escapeCSV(contact.companyName),
          escapeCSV(contact.status),
          new Date(contact.createdAt).toISOString(),
        ];
        csvRows.push(row.join(','));
      }
    });

    return csvRows.join('\n');
  };

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleImport = () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        const text = await file.text();
        const { data: parsedData, detectedType } = parseCSV(text, selectedTab);

        if (parsedData.length === 0) {
          toast.error('No valid data found in CSV file');
          return;
        }

        // Import data via API using detected type
        await importData(parsedData, detectedType);

      } catch (error) {
        console.error('Error importing data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to import data');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const parseCSV = (text: string, type: string): { data: Record<string, string>[], detectedType: string } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { data: [], detectedType: type };

    const headers = parseCSVLine(lines[0]).map(h => h.trim());

    // Auto-detect type based on headers
    const hasContactHeaders = headers.some(h =>
      h === 'First Name' || h === 'Last Name' || h === 'Email'
    );
    const hasCompanyHeaders = headers.some(h =>
      h === 'Name' || h === 'Domain' || h === 'Industry'
    );

    let detectedType = type;
    if (hasContactHeaders && !hasCompanyHeaders) {
      detectedType = 'contacts';
      console.log('Auto-detected CSV type: contacts');
    } else if (hasCompanyHeaders && !hasContactHeaders) {
      detectedType = 'companies';
      console.log('Auto-detected CSV type: companies');
    }

    console.log('CSV Headers:', headers);
    console.log('Using type:', detectedType);
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const item: Record<string, string> = {};
      headers.forEach((header, index) => {
        // Remove quotes and trim whitespace
        let value = values[index] || '';
        value = value.trim().replace(/^"(.*)"$/, '$1');

        // Map CSV headers to database fields
        if (detectedType === 'companies') {
          const fieldMap: Record<string, string> = {
            'Name': 'name',
            'Domain': 'domain',
            'Industry': 'industry',
            'Size': 'size',
            'City': 'city',
            'Country': 'country',
            'Website': 'website',
            'Phone': 'phone',
            'Source': 'source',
          };
          const field = fieldMap[header];
          if (field && value) item[field] = value;
        } else {
          const fieldMap: Record<string, string> = {
            'First Name': 'firstName',
            'Last Name': 'lastName',
            'Email': 'email',
            'Phone': 'phone',
            'Job Title': 'jobTitle',
            'Department': 'department',
            'Status': 'status',
          };
          const field = fieldMap[header];
          if (field && value) item[field] = value;
        }
      });

      // Validate required fields
      if (detectedType === 'companies') {
        if (item.name) {
          data.push(item);
        } else {
          console.warn('Skipping company - missing name:', item);
        }
      } else {
        if (item.firstName && item.lastName && item.email) {
          data.push(item);
        } else {
          console.warn('Skipping contact - missing required fields:', item, 'Required: firstName, lastName, email');
        }
      }
    }

    console.log(`Parsed ${data.length} valid ${detectedType} from CSV`);
    return { data, detectedType };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const importData = async (data: Record<string, string>[], type: string) => {
    const endpoint = type === 'companies' ? '/api/companies' : '/api/contacts';
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    toast.info(`Importing ${data.length} ${type}...`);

    for (const item of data) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const error = await response.json();
          const errorMsg = error.error || 'Unknown error';
          errors.push(errorMsg);
          console.error(`Failed to import ${type.slice(0, -1)}:`, error, 'Item:', item);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error importing ${type.slice(0, -1)}:`, error, 'Item:', item);
        errors.push(error instanceof Error ? error.message : 'Network error');
      }
    }

    // Refresh data
    if (type === 'companies') {
      await fetchCompanies();
    } else {
      await fetchContacts();
    }

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} ${type}`);
    }
    if (errorCount > 0) {
      const uniqueErrors = [...new Set(errors)];
      console.error('Import errors:', uniqueErrors);
      toast.error(`Failed to import ${errorCount} ${type}. Check console for details.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            View and manage your collected data
          </p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="data:export">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || (selectedTab === 'companies' ? companies.length === 0 : contacts.length === 0)}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="data:import">
            <Button
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Companies ({companies.length})</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <PermissionGuard permission="data:create">
                    <Button onClick={handleAddCompany}>
                      Add Company
                    </Button>
                  </PermissionGuard>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-2 mt-4 p-4 bg-muted/50 rounded-md">
                  <Select value={filters.industry} onValueChange={(v) => handleFilterChange('industry', v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {uniqueIndustries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.size} onValueChange={(v) => handleFilterChange('size', v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Company Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {uniqueSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.source} onValueChange={(v) => handleFilterChange('source', v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {uniqueSources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(filters.industry !== 'all' || filters.size !== 'all' || filters.source !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No companies found. {searchQuery || Object.values(filters).some(v => v !== 'all') ? 'Try adjusting your filters.' : 'Import data to get started.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                  </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{company.name}</span>
                              {company.domain && (
                                <a
                                  href={`https://${company.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {company.domain}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{company.industry || '-'}</TableCell>
                          <TableCell>
                            {[company.city, company.country].filter(Boolean).join(', ') || '-'}
                          </TableCell>
                          <TableCell>{company.size || '-'}</TableCell>
                          <TableCell className="text-sm">{company.phone || '-'}</TableCell>
                          <TableCell>
                            {company.linkedinUrl ? (
                              <a
                                href={company.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {company.source && <Badge variant="secondary">{company.source}</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(company.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                  View Details
                                </DropdownMenuItem>
                                <PermissionGuard permission="data:edit">
                                  <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                    Edit
                                  </DropdownMenuItem>
                                </PermissionGuard>
                                <PermissionGuard permission="data:delete">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(company.id, 'companies')}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </PermissionGuard>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contacts ({contacts.length})</CardTitle>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <PermissionGuard permission="data:create">
                    <Button onClick={handleAddContact}>
                      Add Contact
                    </Button>
                  </PermissionGuard>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-2 mt-4 p-4 bg-muted/50 rounded-md">
                  <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {filters.status !== 'all' && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingContacts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No contacts found. {searchQuery || filters.status !== 'all' ? 'Try adjusting your filters.' : 'Import data to get started.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{contact.firstName} {contact.lastName}</span>
                              {contact.isVerified && (
                                <Badge variant="outline" className="text-xs">Verified</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {contact.email}
                            </a>
                          </TableCell>
                          <TableCell className="text-sm">{contact.phone || '-'}</TableCell>
                          <TableCell className="text-sm">{contact.jobTitle || '-'}</TableCell>
                          <TableCell className="text-sm">{contact.department || '-'}</TableCell>
                          <TableCell className="text-sm">{contact.companyName || '-'}</TableCell>
                          <TableCell>
                            {contact.linkedinUrl ? (
                              <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={contact.status === 'active' ? 'default' : 'secondary'}
                            >
                              {contact.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(contact.createdAt)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewContact(contact)}>
                                  View Details
                                </DropdownMenuItem>
                                <PermissionGuard permission="data:edit">
                                  <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                    Edit
                                  </DropdownMenuItem>
                                </PermissionGuard>
                                <PermissionGuard permission="campaign:create">
                                  <DropdownMenuItem onClick={() => {
                                    toast.info('Campaign feature coming soon');
                                  }}>
                                    Add to Campaign
                                  </DropdownMenuItem>
                                </PermissionGuard>
                                <PermissionGuard permission="data:delete">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(contact.id, 'contacts')}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </PermissionGuard>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? 'Company Details' : 'Contact Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany ? 'View all information about this company' : 'View all information about this contact'}
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Company Name</Label>
                  <p className="mt-1">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Domain</Label>
                  <p className="mt-1">{selectedCompany.domain || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Industry</Label>
                  <p className="mt-1">{selectedCompany.industry || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Company Size</Label>
                  <p className="mt-1">{selectedCompany.size || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">City</Label>
                  <p className="mt-1">{selectedCompany.city || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Country</Label>
                  <p className="mt-1">{selectedCompany.country || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Phone</Label>
                  <p className="mt-1">{selectedCompany.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Source</Label>
                  <p className="mt-1">{selectedCompany.source || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Website</Label>
                  <p className="mt-1">
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedCompany.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">LinkedIn</Label>
                  <p className="mt-1">
                    {selectedCompany.linkedinUrl ? (
                      <a href={selectedCompany.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedCompany.linkedinUrl}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{selectedCompany.description || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Created At</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedCompany.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Updated At</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedCompany.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}

          {selectedContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">First Name</Label>
                  <p className="mt-1">{selectedContact.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Last Name</Label>
                  <p className="mt-1">{selectedContact.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                  <p className="mt-1">
                    <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">
                      {selectedContact.email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Phone</Label>
                  <p className="mt-1">{selectedContact.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Job Title</Label>
                  <p className="mt-1">{selectedContact.jobTitle || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Department</Label>
                  <p className="mt-1">{selectedContact.department || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Gender</Label>
                  <p className="mt-1">{selectedContact.gender || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Status</Label>
                  <p className="mt-1">
                    <Badge variant={selectedContact.status === 'active' ? 'default' : 'secondary'}>
                      {selectedContact.status || 'active'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Company</Label>
                  <p className="mt-1">{selectedContact.companyName || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Verified</Label>
                  <p className="mt-1">{selectedContact.isVerified ? '✓ Yes' : '✗ No'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">LinkedIn</Label>
                  <p className="mt-1">
                    {selectedContact.linkedinUrl ? (
                      <a href={selectedContact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedContact.linkedinUrl}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Twitter</Label>
                  <p className="mt-1">
                    {selectedContact.twitterUrl ? (
                      <a href={selectedContact.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedContact.twitterUrl}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{selectedContact.notes || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Created At</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedContact.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Last Contacted</Label>
                  <p className="mt-1 text-sm">{selectedContact.lastContactedAt ? formatDate(selectedContact.lastContactedAt) : '-'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? 'Edit Company' : selectedContact ? 'Edit Contact' : (editForm as Partial<Company>).name !== undefined ? 'Add Company' : 'Add Contact'}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany ? 'Update company information' : selectedContact ? 'Update contact information' : (editForm as Partial<Company>).name !== undefined ? 'Create a new company' : 'Create a new contact'}
            </DialogDescription>
          </DialogHeader>

          {(selectedCompany || (editForm as Partial<Company>).name !== undefined) && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={(editForm as Partial<Company>).name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={(editForm as Company).domain || ''}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={(editForm as Company).industry || ''}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    value={(editForm as Company).size || ''}
                    onValueChange={(v) => setEditForm({ ...editForm, size: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501+">501+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={(editForm as Company).city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={(editForm as Company).country || ''}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={(editForm as Company).phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={(editForm as Company).source || ''}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={(editForm as Company).website || ''}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={(editForm as Company).linkedinUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={(editForm as Company).description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {(selectedContact || (editForm as Partial<ContactWithCompany>).email !== undefined) && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={(editForm as ContactWithCompany).firstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={(editForm as ContactWithCompany).lastName || ''}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={(editForm as ContactWithCompany).email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={(editForm as ContactWithCompany).phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={(editForm as ContactWithCompany).jobTitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={(editForm as ContactWithCompany).department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={(editForm as ContactWithCompany).gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <Select
                    value={(editForm as ContactWithCompany).companyId || 'none'}
                    onValueChange={(v) => setEditForm({ ...editForm, companyId: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={(editForm as ContactWithCompany).status || 'active'}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={(editForm as ContactWithCompany).linkedinUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    value={(editForm as ContactWithCompany).twitterUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, twitterUrl: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={(editForm as ContactWithCompany).notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
