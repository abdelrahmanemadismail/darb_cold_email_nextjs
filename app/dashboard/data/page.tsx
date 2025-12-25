'use client';

import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/data/useCompanies';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useBulkOperation } from '@/hooks/data/useContacts';
import { CompaniesTable } from '@/components/data/CompaniesTable';
import { ContactsTable } from '@/components/data/ContactsTable';
import { CompanyForm } from '@/components/data/CompanyForm';
import { ContactForm } from '@/components/data/ContactForm';
import { ImportDialog } from '@/components/data/ImportDialog';
import { BulkActionsMenu } from '@/components/data/BulkActionsMenu';
import { ColumnSelector, type ColumnConfig } from '@/components/data/ColumnSelector';
import { SearchBar } from '@/components/data/SearchBar';
import { Pagination } from '@/components/data/Pagination';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import type { Company } from '@/db/schema/companies';
import type { Contact } from '@/db/schema/contacts';
import type { CreateCompanyInput } from '@/types/company';
import type { CreateContactInput } from '@/types/contact';

export default function DataPage() {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('companies');

  // Rows per page state (stored in localStorage)
  const [companiesRowsPerPage, setCompaniesRowsPerPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('companiesRowsPerPage');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [contactsRowsPerPage, setContactsRowsPerPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('contactsRowsPerPage');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });

  // Column visibility state (stored in localStorage)
  const [companiesVisibleColumns, setCompaniesVisibleColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCompaniesColumns = localStorage.getItem('companiesVisibleColumns');
      if (savedCompaniesColumns) {
        const saved = JSON.parse(savedCompaniesColumns) as ColumnConfig[];
        const defaultCols = [
          { id: 'name', label: 'Company Name', visible: true },
          { id: 'size', label: 'Size', visible: true },
          { id: 'location', label: 'Location', visible: true },
          { id: 'contactsCount', label: 'Contacts', visible: true },
          { id: 'createdAt', label: 'Created', visible: true },
          { id: 'updatedAt', label: 'Updated', visible: false },
          { id: 'keywords', label: 'Keywords', visible: false },
          { id: 'source', label: 'Source', visible: false },
          { id: 'createdBy', label: 'Created By', visible: false },
        ];
        // Merge: keep saved visibility but add any new columns
        return defaultCols.map(defaultCol => {
          const savedCol = saved.find(s => s.id === defaultCol.id);
          return savedCol || defaultCol;
        });
      }
    }
    return [
      { id: 'name', label: 'Company Name', visible: true },
      { id: 'size', label: 'Size', visible: true },
      { id: 'location', label: 'Location', visible: true },
      { id: 'contactsCount', label: 'Contacts', visible: true },
      { id: 'createdAt', label: 'Created', visible: true },
      { id: 'updatedAt', label: 'Updated', visible: false },
      { id: 'keywords', label: 'Keywords', visible: false },
      { id: 'source', label: 'Source', visible: false },
      { id: 'createdBy', label: 'Created By', visible: false },
    ];
  });

  const [contactsVisibleColumns, setContactsVisibleColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const savedContactsColumns = localStorage.getItem('contactsVisibleColumns');
      if (savedContactsColumns) {
        const saved = JSON.parse(savedContactsColumns) as ColumnConfig[];
        const defaultCols = [
          { id: 'name', label: 'Name', visible: true },
          { id: 'email', label: 'Email', visible: true },
          { id: 'phone', label: 'Phone', visible: true },
          { id: 'company', label: 'Company', visible: true },
          { id: 'tags', label: 'Tags', visible: true },
          { id: 'lastContactedAt', label: 'Last Contacted', visible: true },
          { id: 'isEmailVerified', label: 'Email Verified', visible: true },
          { id: 'gender', label: 'Gender', visible: false },
          { id: 'linkedinUrl', label: 'LinkedIn', visible: false },
          { id: 'notes', label: 'Notes', visible: false },
          { id: 'createdAt', label: 'Created', visible: false },
          { id: 'updatedAt', label: 'Updated', visible: false },
          { id: 'createdBy', label: 'Created By', visible: false },
          { id: 'managedBy', label: 'Managed By', visible: false },
        ];
        // Merge: keep saved visibility but add any new columns
        return defaultCols.map(defaultCol => {
          const savedCol = saved.find(s => s.id === defaultCol.id);
          return savedCol || defaultCol;
        });
      }
    }
    return [
      { id: 'name', label: 'Name', visible: true },
      { id: 'email', label: 'Email', visible: true },
      { id: 'phone', label: 'Phone', visible: true },
      { id: 'company', label: 'Company', visible: true },
      { id: 'tags', label: 'Tags', visible: true },
      { id: 'lastContactedAt', label: 'Last Contacted', visible: true },
      { id: 'isEmailVerified', label: 'Email Verified', visible: true },
      { id: 'gender', label: 'Gender', visible: false },
      { id: 'linkedinUrl', label: 'LinkedIn', visible: false },
      { id: 'notes', label: 'Notes', visible: false },
      { id: 'createdAt', label: 'Created', visible: false },
      { id: 'updatedAt', label: 'Updated', visible: false },
      { id: 'createdBy', label: 'Created By', visible: false },
      { id: 'managedBy', label: 'Managed By', visible: false },
    ];
  });

  // Save companies rows per page to localStorage
  const handleCompaniesRowsPerPageChange = (value: number) => {
    setCompaniesRowsPerPage(value);
    localStorage.setItem('companiesRowsPerPage', value.toString());
    setCompaniesPage(1); // Reset to first page when changing limit
  };

  // Save contacts rows per page to localStorage
  const handleContactsRowsPerPageChange = (value: number) => {
    setContactsRowsPerPage(value);
    localStorage.setItem('contactsRowsPerPage', value.toString());
    setContactsPage(1); // Reset to first page when changing limit
  };

  // Column visibility handlers
  const handleCompaniesColumnsChange = (columns: ColumnConfig[]) => {
    setCompaniesVisibleColumns(columns);
    localStorage.setItem('companiesVisibleColumns', JSON.stringify(columns));
  };

  const handleContactsColumnsChange = (columns: ColumnConfig[]) => {
    setContactsVisibleColumns(columns);
    localStorage.setItem('contactsVisibleColumns', JSON.stringify(columns));
  };

  // Companies state
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companyDialog, setCompanyDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: Company }>({
    open: false,
    mode: 'create',
  });

  // Contacts state
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactDialog, setContactDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: Contact }>({
    open: false,
    mode: 'create',
  });

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Queries and mutations
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = useCompanies({
    page: companiesPage,
    limit: companiesRowsPerPage,
    search: companiesSearch || undefined,
  });

  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } = useContacts({
    page: contactsPage,
    limit: contactsRowsPerPage,
    search: contactsSearch || undefined,
  });

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const bulkOperationCompanies = useBulkOperation('companies');
  const bulkOperationContacts = useBulkOperation('contacts');

  // Company handlers
  const handleCreateCompany = async (data: CreateCompanyInput) => {
    try {
      await createCompany.mutateAsync(data);
      toast.success('Company created successfully');
      setCompanyDialog({ open: false, mode: 'create' });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to create company');
    }
  };

  const handleUpdateCompany = async (data: CreateCompanyInput) => {
    if (!companyDialog.data) return;
    try {
      await updateCompany.mutateAsync({ id: companyDialog.data.id, data });
      toast.success('Company updated successfully');
      setCompanyDialog({ open: false, mode: 'create' });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update company');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await deleteCompany.mutateAsync(id);
      toast.success('Company deleted successfully');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete company');
    }
  };

  // Contact handlers
  const handleCreateContact = async (data: CreateContactInput) => {
    try {
      await createContact.mutateAsync(data);
      toast.success('Contact created successfully');
      setContactDialog({ open: false, mode: 'create' });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to create contact');
    }
  };

  const handleUpdateContact = async (data: CreateContactInput) => {
    if (!contactDialog.data) return;
    try {
      await updateContact.mutateAsync({ id: contactDialog.data.id, data });
      toast.success('Contact updated successfully');
      setContactDialog({ open: false, mode: 'create' });
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteContact.mutateAsync(id);
      toast.success('Contact deleted successfully');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete contact');
    }
  };

  // Bulk operations
  const handleBulkDelete = async (type: 'companies' | 'contacts') => {
    const ids = type === 'companies' ? selectedCompanies : selectedContacts;
    if (ids.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${ids.length} ${type}?`)) return;

    try {
      const operation = type === 'companies' ? bulkOperationCompanies : bulkOperationContacts;
      await operation.mutateAsync({ ids, operation: 'delete' });
      toast.success(`Successfully deleted ${ids.length} ${type}`);
      if (type === 'companies') {
        setSelectedCompanies([]);
      } else {
        setSelectedContacts([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || `Failed to delete ${type}`);
    }
  };

  const handleBulkAddTags = async (type: 'companies' | 'contacts', tags: string[]) => {
    const ids = type === 'companies' ? selectedCompanies : selectedContacts;
    if (ids.length === 0 || tags.length === 0) return;

    try {
      const operation = type === 'companies' ? bulkOperationCompanies : bulkOperationContacts;
      if (type === 'companies') {
        await operation.mutateAsync({ ids, operation: 'addKeywords', keywords: tags });
        toast.success(`Successfully added keywords to ${ids.length} companies`);
      } else {
        await operation.mutateAsync({ ids, operation: 'addTags', tags });
        toast.success(`Successfully added tags to ${ids.length} contacts`);
      }
      if (type === 'companies') {
        setSelectedCompanies([]);
      } else {
        setSelectedContacts([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || `Failed to add ${type === 'companies' ? 'keywords' : 'tags'}`);
    }
  };

  const handleBulkRemoveTags = async (type: 'companies' | 'contacts', tags: string[]) => {
    const ids = type === 'companies' ? selectedCompanies : selectedContacts;
    if (ids.length === 0 || tags.length === 0) return;

    try {
      const operation = type === 'companies' ? bulkOperationCompanies : bulkOperationContacts;
      if (type === 'companies') {
        await operation.mutateAsync({ ids, operation: 'removeKeywords', keywords: tags });
        toast.success(`Successfully removed keywords from ${ids.length} companies`);
      } else {
        await operation.mutateAsync({ ids, operation: 'removeTags', tags });
        toast.success(`Successfully removed tags from ${ids.length} contacts`);
      }
      if (type === 'companies') {
        setSelectedCompanies([]);
      } else {
        setSelectedContacts([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || `Failed to remove ${type === 'companies' ? 'keywords' : 'tags'}`);
    }
  };

  const handleBulkExport = async (type: 'companies' | 'contacts') => {
    const ids = type === 'companies' ? selectedCompanies : selectedContacts;
    if (ids.length === 0) return;

    try {
      const operation = type === 'companies' ? bulkOperationCompanies : bulkOperationContacts;
      const result = await operation.mutateAsync({ ids, operation: 'export' });

      // Convert to CSV
      const data = result.data as Record<string, unknown>[];
      if (data.length === 0) {
        toast.error('No data to export');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (Array.isArray(value)) return `"${value.join(';')}"`;
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${ids.length} ${type}`);
      if (type === 'companies') {
        setSelectedCompanies([]);
      } else {
        setSelectedContacts([]);
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || `Failed to export ${type}`);
    }
  };

  const canCreate = can('data:create');
  const canEdit = can('data:edit');
  const canDelete = can('data:delete');
  const canImport = can('data:import');
  const canExport = can('data:export');

  const handleImportComplete = () => {
    refetchCompanies();
    refetchContacts();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">Manage your companies and contacts</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <SearchBar
              value={companiesSearch}
              onChange={setCompaniesSearch}
              placeholder="Search companies..."
            />
            <div className="flex gap-2">
              {selectedCompanies.length > 0 && (canDelete || canEdit || canExport) && (
                <BulkActionsMenu
                  selectedCount={selectedCompanies.length}
                  onDelete={() => handleBulkDelete('companies')}
                  onAddTags={(tags) => handleBulkAddTags('companies', tags)}
                  onRemoveTags={(tags) => handleBulkRemoveTags('companies', tags)}
                  onExport={() => handleBulkExport('companies')}
                  type="companies"
                />
              )}
              <ColumnSelector
                columns={companiesVisibleColumns}
                onColumnsChange={handleCompaniesColumnsChange}
              />
              {canImport && (
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => setCompanyDialog({ open: true, mode: 'create' })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              )}
            </div>
          </div>

          {companiesLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <CompaniesTable
                companies={companiesData?.data || []}
                onEdit={(company) => setCompanyDialog({ open: true, mode: 'edit', data: company })}
                onDelete={handleDeleteCompany}
                selectedIds={selectedCompanies}
                onSelectionChange={setSelectedCompanies}
                visibleColumns={companiesVisibleColumns.filter(col => col.visible).map(col => col.id)}
              />
              {companiesData && (
                <Pagination
                  currentPage={companiesData.pagination.page}
                  totalPages={companiesData.pagination.totalPages}
                  onPageChange={setCompaniesPage}
                  itemsPerPage={companiesData.pagination.limit}
                  totalItems={companiesData.pagination.total}
                  rowsPerPage={companiesRowsPerPage}
                  onRowsPerPageChange={handleCompaniesRowsPerPageChange}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <SearchBar
              value={contactsSearch}
              onChange={setContactsSearch}
              placeholder="Search contacts..."
            />
            <div className="flex gap-2">
              {selectedContacts.length > 0 && (canDelete || canEdit || canExport) && (
                <BulkActionsMenu
                  selectedCount={selectedContacts.length}
                  onDelete={() => handleBulkDelete('contacts')}
                  onAddTags={(tags) => handleBulkAddTags('contacts', tags)}
                  onRemoveTags={(tags) => handleBulkRemoveTags('contacts', tags)}
                  onExport={() => handleBulkExport('contacts')}
                  type="contacts"
                />
              )}
              <ColumnSelector
                columns={contactsVisibleColumns}
                onColumnsChange={handleContactsColumnsChange}
              />
              {canImport && (
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => setContactDialog({ open: true, mode: 'create' })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </div>
          </div>

          {contactsLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <ContactsTable
                contacts={contactsData?.data || []}
                onEdit={(contact) => setContactDialog({ open: true, mode: 'edit', data: contact })}
                onDelete={handleDeleteContact}
                selectedIds={selectedContacts}
                onSelectionChange={setSelectedContacts}
                visibleColumns={contactsVisibleColumns.filter(col => col.visible).map(col => col.id)}
              />
              {contactsData && (
                <Pagination
                  currentPage={contactsData.pagination.page}
                  totalPages={contactsData.pagination.totalPages}
                  onPageChange={setContactsPage}
                  itemsPerPage={contactsData.pagination.limit}
                  totalItems={contactsData.pagination.total}
                  rowsPerPage={contactsRowsPerPage}
                  onRowsPerPageChange={handleContactsRowsPerPageChange}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Company Dialog */}
      <Dialog open={companyDialog.open} onOpenChange={(open) => setCompanyDialog({ ...companyDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {companyDialog.mode === 'create' ? 'Create Company' : 'Edit Company'}
            </DialogTitle>
          </DialogHeader>
          <CompanyForm
            onSubmit={companyDialog.mode === 'create' ? handleCreateCompany : handleUpdateCompany}
            initialData={companyDialog.data}
            isLoading={createCompany.isPending || updateCompany.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialog.open} onOpenChange={(open) => setContactDialog({ ...contactDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {contactDialog.mode === 'create' ? 'Create Contact' : 'Edit Contact'}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            onSubmit={contactDialog.mode === 'create' ? handleCreateContact : handleUpdateContact}
            initialData={contactDialog.data}
            isLoading={createContact.isPending || updateContact.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
