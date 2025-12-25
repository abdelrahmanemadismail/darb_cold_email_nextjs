'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Edit, Mail, CheckCircle2, XCircle } from 'lucide-react';
import type { Contact } from '@/db/schema/contacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ContactWithCompany = Contact & {
  company: { id: string; name: string; city: string | null; country: string | null } | null;
};

interface ContactsTableProps {
  contacts: ContactWithCompany[];
  onEdit: (contact: ContactWithCompany) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  visibleColumns?: string[];
}

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  visibleColumns = ['name', 'email', 'phone', 'company', 'tags', 'lastContactedAt', 'isEmailVerified', 'gender', 'linkedinUrl', 'notes', 'createdAt', 'updatedAt', 'createdBy', 'managedBy'],
}: ContactsTableProps) {
  const allColumns: ColumnDef<ContactWithCompany>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
          <div className="text-sm text-muted-foreground">{row.original.position || '-'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.email}</span>
          {row.original.isEmailVerified ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || '-',
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => row.original.company?.name || '-',
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        if (tags.length === 0) return '-';
        return (
          <div className="flex gap-1 flex-wrap">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'lastContactedAt',
      header: 'Last Contacted',
      cell: ({ row }) =>
        row.original.lastContactedAt
          ? format(new Date(row.original.lastContactedAt), 'MMM d, yyyy')
          : '-',
    },
    {
      accessorKey: 'isEmailVerified',
      header: 'Email Verified',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.isEmailVerified ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Verified</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-muted-foreground">Not Verified</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => row.original.gender || '-',
    },
    {
      accessorKey: 'linkedinUrl',
      header: 'LinkedIn',
      cell: ({ row }) => row.original.linkedinUrl ? (
        <a href={row.original.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
          Profile
        </a>
      ) : '-',
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) return '-';
        return (
          <div className="max-w-[200px] truncate text-sm" title={notes}>
            {notes}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => row.original.createdBy || '-',
    },
    {
      accessorKey: 'managedBy',
      header: 'Managed By',
      cell: ({ row }) => row.original.managedBy || '-',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Filter columns based on visibility
  const columns = [
    allColumns[0], // Always include select column
    ...allColumns.slice(1, -1).filter(col => {
      const columnId = col.id || (col as { accessorKey?: string }).accessorKey;
      return visibleColumns.includes(columnId as string);
    }),
    allColumns[allColumns.length - 1], // Always include actions column
  ];

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: {
      rowSelection: selectedIds.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>),
    },
    enableRowSelection: true,
    onRowSelectionChange: (updaterOrValue) => {
      const currentSelection = selectedIds.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      const newSelection =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(currentSelection)
          : updaterOrValue;

      const newSelectedIds = Object.keys(newSelection).filter(
        (id) => newSelection[id]
      );

      onSelectionChange(newSelectedIds);
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No contacts found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
