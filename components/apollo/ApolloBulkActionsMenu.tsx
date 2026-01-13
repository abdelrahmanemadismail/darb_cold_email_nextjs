'use client';

import { MoreVertical, Trash2, Download, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApolloBulkActionsMenuProps {
  selectedCount: number;
  onDelete: () => void;
  onMarkProcessed: () => void;
  onMarkUnprocessed: () => void;
  onExport: () => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function ApolloBulkActionsMenu({
  selectedCount,
  onDelete,
  onMarkProcessed,
  onMarkUnprocessed,
  onExport,
  isDeleting = false,
  isUpdating = false,
}: ApolloBulkActionsMenuProps) {
  const isLoading = isDeleting || isUpdating;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          <MoreVertical className="h-4 w-4 mr-2" />
          Bulk Actions ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onMarkProcessed} disabled={isLoading}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Processed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMarkUnprocessed} disabled={isLoading}>
          <XCircle className="mr-2 h-4 w-4" />
          Mark as Unprocessed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export Selected
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600" disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
