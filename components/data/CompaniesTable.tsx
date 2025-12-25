'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Edit, Building2 } from 'lucide-react';
import type { Company } from '@/db/schema/companies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CompanyWithCount = Company & { contactsCount: number };

interface CompaniesTableProps {
  companies: CompanyWithCount[];
  onEdit: (company: CompanyWithCount) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  visibleColumns?: string[];
}

export function CompaniesTable({
  companies,
  onEdit,
  onDelete,
  selectedIds,
  onSelectionChange,
  visibleColumns = ['name', 'size', 'location', 'contactsCount', 'createdAt', 'updatedAt', 'keywords', 'source', 'createdBy'],
}: CompaniesTableProps) {
  const allColumns: ColumnDef<CompanyWithCount>[] = [
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
      accessorKey: 'name',
      header: 'Company Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => row.original.size || '-',
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const { city, country } = row.original;
        if (!city && !country) return '-';
        return [city, country].filter(Boolean).join(', ');
      },
    },
    {
      accessorKey: 'contactsCount',
      header: 'Contacts',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.contactsCount}</Badge>
      ),
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
      accessorKey: 'keywords',
      header: 'Keywords',
      cell: ({ row }) => {
        const keywords = row.original.keywords || [];
        if (keywords.length === 0) return '-';
        return (
          <div className="flex gap-1 flex-wrap">
            {keywords.slice(0, 2).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {keywords.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{keywords.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => row.original.source || '-',
    },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => row.original.createdBy || '-',
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
    data: companies,
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
                No companies found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
