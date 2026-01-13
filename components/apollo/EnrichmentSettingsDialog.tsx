'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Alert } from '@/components/ui/alert';
import { Sparkles, AlertCircle } from 'lucide-react';

export interface EnrichmentSettings {
  limit: number;
  revealPersonalEmails: boolean;
  revealPhoneNumbers: boolean;
  webhookUrl?: string;
  autoEnrich?: boolean;
}

interface EnrichmentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (settings: EnrichmentSettings) => void;
  isPending?: boolean;
}

export function EnrichmentSettingsDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: EnrichmentSettingsDialogProps) {
  const [limit, setLimit] = useState<number>(100);
  const [revealPersonalEmails, setRevealPersonalEmails] = useState<boolean>(true);
  const [revealPhoneNumbers, setRevealPhoneNumbers] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [autoEnrich, setAutoEnrich] = useState<boolean>(false);

  const handleConfirm = () => {
    onConfirm({
      limit,
      revealPersonalEmails,
      revealPhoneNumbers,
      webhookUrl: webhookUrl.trim() || undefined,
      autoEnrich,
    });
  };

  const canSubmit = !revealPhoneNumbers || (revealPhoneNumbers && webhookUrl.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Enrichment Settings
          </DialogTitle>
          <DialogDescription>
            Configure how you want to enrich your Apollo search results. This will consume Apollo API credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Limit */}
          <div className="space-y-2">
            <Label htmlFor="limit">Number of Results to Process</Label>
            <Input
              id="limit"
              type="number"
              min="1"
              max="500"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              placeholder="100"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of unprocessed results to enrich (1-500)
            </p>
          </div>

          {/* Auto Enrich */}
          <div className="space-y-2">
            <Label htmlFor="auto-enrich">Automatic Enrichment</Label>
            <Select
              value={autoEnrich.toString()}
              onValueChange={(value) => setAutoEnrich(value === 'true')}
            >
              <SelectTrigger id="auto-enrich">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes - Auto-enrich new results</SelectItem>
                <SelectItem value="false">No - Manual enrichment only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When enabled, new Apollo search results will be automatically enriched with the settings below.
            </p>
          </div>

          {/* Reveal Personal Emails */}
          <div className="space-y-2">
            <Label htmlFor="reveal-emails">Reveal Personal Emails</Label>
            <Select
              value={revealPersonalEmails.toString()}
              onValueChange={(value) => setRevealPersonalEmails(value === 'true')}
            >
              <SelectTrigger id="reveal-emails">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes - Reveal emails (uses credits)</SelectItem>
                <SelectItem value="false">No - Skip emails</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Retrieve personal email addresses for contacts. This consumes API credits.
            </p>
          </div>

          {/* Reveal Phone Numbers */}
          <div className="space-y-2">
            <Label htmlFor="reveal-phones">Reveal Phone Numbers</Label>
            <Select
              value={revealPhoneNumbers.toString()}
              onValueChange={(value) => setRevealPhoneNumbers(value === 'true')}
            >
              <SelectTrigger id="reveal-phones">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes - Reveal phones (requires webhook)</SelectItem>
                <SelectItem value="false">No - Skip phones</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Retrieve phone numbers for contacts. Requires a webhook URL for async delivery.
            </p>
          </div>

          {/* Webhook URL - Only show if revealing phone numbers */}
          {revealPhoneNumbers && (
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                Webhook URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-webhook.com/apollo-phones"
              />
              <p className="text-xs text-muted-foreground">
                Apollo will send phone numbers to this URL asynchronously. Must be a valid HTTPS URL.
              </p>
              {!webhookUrl.trim() && (
                <Alert className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">Webhook URL is required when revealing phone numbers</p>
                </Alert>
              )}
            </div>
          )}

          {/* Credit Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div className="text-sm">
              <strong>Credit Usage:</strong> This operation will consume Apollo API credits based on the number of contacts enriched and data types requested.
              <a
                href="https://www.apollo.io/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View pricing
              </a>
            </div>
          </Alert>

          {/* GDPR Notice */}
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Apollo respects GDPR compliance and will not reveal personal emails
            for contacts in GDPR-compliant regions, even if requested.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !canSubmit}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isPending ? 'Enriching...' : 'Start Enrichment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
