'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Download, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BulkActionsMenuProps {
  selectedCount: number;
  onDelete: () => void;
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
  onExport: () => void;
  type: 'companies' | 'contacts';
}

export function BulkActionsMenu({
  selectedCount,
  onDelete,
  onAddTags,
  onRemoveTags,
  onExport,
  type,
}: BulkActionsMenuProps) {
  const [tagsDialog, setTagsDialog] = useState<{ open: boolean; mode: 'add' | 'remove' }>({
    open: false,
    mode: 'add',
  });
  const [tagsInput, setTagsInput] = useState('');

  const isCompanies = type === 'companies';
  const fieldLabel = isCompanies ? 'Keywords' : 'Tags';
  const fieldLabelLower = isCompanies ? 'keywords' : 'tags';

  const handleTagsSubmit = () => {
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (tags.length > 0) {
      if (tagsDialog.mode === 'add') {
        onAddTags(tags);
      } else {
        onRemoveTags(tags);
      }
    }

    setTagsDialog({ open: false, mode: 'add' });
    setTagsInput('');
  };

  const openTagsDialog = (mode: 'add' | 'remove') => {
    setTagsDialog({ open: true, mode });
    setTagsInput('');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedCount})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => openTagsDialog('add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add {fieldLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openTagsDialog('remove')}>
            <Minus className="mr-2 h-4 w-4" />
            Remove {fieldLabel}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tags Dialog */}
      <Dialog open={tagsDialog.open} onOpenChange={(open) => setTagsDialog({ ...tagsDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tagsDialog.mode === 'add' ? `Add ${fieldLabel}` : `Remove ${fieldLabel}`}
            </DialogTitle>
            <DialogDescription>
              {tagsDialog.mode === 'add'
                ? `Add ${fieldLabelLower} to ${selectedCount} selected ${type}`
                : `Remove ${fieldLabelLower} from ${selectedCount} selected ${type}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">{fieldLabel} (comma-separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={isCompanies ? "keyword1, keyword2, keyword3" : "tag1, tag2, tag3"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagsSubmit();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Enter {fieldLabelLower} separated by commas
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTagsDialog({ open: false, mode: 'add' })}
              >
                Cancel
              </Button>
              <Button onClick={handleTagsSubmit}>
                {tagsDialog.mode === 'add' ? `Add ${fieldLabel}` : `Remove ${fieldLabel}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
