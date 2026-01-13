'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import type { ApolloConfig } from '@/types/apollo';

interface ApolloScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface HeadcountRange {
  label: string;
  min: number;
  max: number;
}

export function ApolloScriptDialog({ open, onOpenChange, onSuccess }: ApolloScriptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [options, setOptions] = useState<ApolloConfig['options'] | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [executionId, setExecutionId] = useState<string | null>(null);

  // Form state
  const [personTitles, setPersonTitles] = useState<string[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [personLocations, setPersonLocations] = useState<string[]>([]);
  const [companyLocations, setCompanyLocations] = useState<string[]>([]);
  const [headcountRanges, setHeadcountRanges] = useState<string[]>([]);
  const [contactEmailStatus, setContactEmailStatus] = useState<string[]>([]);
  const [maxPages, setMaxPages] = useState('1');
  const [perPage, setPerPage] = useState('100');

  // Enrichment settings
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [revealPersonalEmails, setRevealPersonalEmails] = useState(true);
  const [revealPhoneNumbers, setRevealPhoneNumbers] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Fetch configuration on mount
  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/scripts/apollo');
      const data = await response.json();
      setConfigured(data.configured);
      setOptions(data.options);
    } catch (error) {
      console.error('Failed to fetch Apollo config:', error);
      toast.error('Failed to load Apollo configuration');
    }
  };

  const handleAddTitle = (title: string) => {
    if (title && !personTitles.includes(title)) {
      setPersonTitles([...personTitles, title]);
      setTitleInput('');
    }
  };

  const handleRemoveTitle = (title: string) => {
    setPersonTitles(personTitles.filter(t => t !== title));
  };

  const handleAddPersonLocation = (location: string) => {
    if (location && !personLocations.includes(location)) {
      setPersonLocations([...personLocations, location]);
    }
  };

  const handleRemovePersonLocation = (location: string) => {
    setPersonLocations(personLocations.filter(l => l !== location));
  };

  const handleAddCompanyLocation = (location: string) => {
    if (location && !companyLocations.includes(location)) {
      setCompanyLocations([...companyLocations, location]);
    }
  };

  const handleRemoveCompanyLocation = (location: string) => {
    setCompanyLocations(companyLocations.filter(l => l !== location));
  };

  const handleAddHeadcountRange = (range: string) => {
    if (range && !headcountRanges.includes(range)) {
      setHeadcountRanges([...headcountRanges, range]);
    }
  };

  const handleRemoveHeadcountRange = (range: string) => {
    setHeadcountRanges(headcountRanges.filter(r => r !== range));
  };

  const handleAddEmailStatus = (status: string) => {
    if (status && !contactEmailStatus.includes(status)) {
      setContactEmailStatus([...contactEmailStatus, status]);
    }
  };

  const handleRemoveEmailStatus = (status: string) => {
    setContactEmailStatus(contactEmailStatus.filter(s => s !== status));
  };

  const handleSubmit = async () => {
    if (!personTitles.length && !personLocations.length && !companyLocations.length) {
      toast.error('Please add at least one search criteria');
      return;
    }

    // Validate enrichment settings if auto-enrich is enabled
    if (autoEnrich && revealPhoneNumbers && !webhookUrl.trim()) {
      toast.error('Webhook URL is required when revealing phone numbers');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    setAbortController(controller);
    const totalPages = parseInt(maxPages) || 1;
    setProgress({ current: 0, total: totalPages, status: 'Starting...' });

    try {
      const employeeRanges = headcountRanges.length > 0 && options
        ? headcountRanges.map(label => {
            const range = options.headcountRanges.find((r: HeadcountRange) => r.label === label);
            return range ? `${range.min},${range.max}` : null;
          }).filter(Boolean) as string[]
        : undefined;

      // Create database record for script execution
      const executionResponse = await fetch('/api/script-executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptType: 'apollo',
          totalPages,
          parameters: {
            personTitles,
            personLocations,
            companyLocations,
            employeeRanges: headcountRanges,
            contactEmailStatus,
            maxPages: totalPages,
            perPage: parseInt(perPage) || 25,
          },
        }),
      });

      const { execution } = await executionResponse.json();
      setExecutionId(execution.id);

      setProgress({ current: 0, total: totalPages, status: 'Sending request...' });

      // Update progress in database
      await fetch(`/api/script-executions/${execution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressStatus: 'Sending request...',
        }),
      });

      const response = await fetch('/api/scripts/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personTitles: personTitles.length > 0 ? personTitles : undefined,
          personLocations: personLocations.length > 0 ? personLocations : undefined,
          companyLocations: companyLocations.length > 0 ? companyLocations : undefined,
          employeeRanges: employeeRanges,
          contactEmailStatus: contactEmailStatus.length > 0 ? contactEmailStatus : undefined,
          maxPages: totalPages,
          perPage: parseInt(perPage) || 25,
          autoEnrich,
          enrichmentSettings: autoEnrich ? {
            revealPersonalEmails,
            revealPhoneNumbers,
            webhookUrl: webhookUrl.trim() || undefined,
          } : undefined,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Script execution failed');
      }

      setProgress({ current: totalPages, total: totalPages, status: 'Completed!' });

      // Show enrichment results if available
      const enrichmentInfo = data.enrichment
        ? ` Enriched: ${data.enrichment.contactsCreated} contacts from ${data.enrichment.companiesCreated} companies.`
        : '';

      // Update database with completion status
      await fetch(`/api/script-executions/${execution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          currentPage: totalPages,
          progressStatus: 'Completed!',
          results: data.data,
        }),
      });

      toast.success((data.message || 'Apollo script completed successfully') + enrichmentInfo);
      onSuccess?.();

      // Reset after a short delay to show completion
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Script execution cancelled');
        setProgress({ current: 0, total: 0, status: 'Cancelled' });

        // Update database with cancelled status
        if (executionId) {
          await fetch(`/api/script-executions/${executionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'cancelled',
              progressStatus: 'Cancelled by user',
            }),
          });
        }
      } else {
        console.error('Apollo script error:', error);
        const message = error instanceof Error ? error.message : 'Failed to run Apollo script';
        toast.error(message);
        setProgress({ current: 0, total: 0, status: 'Failed' });

        // Update database with failed status
        if (executionId) {
          await fetch(`/api/script-executions/${executionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'failed',
              errorMessage: message,
              progressStatus: 'Failed',
            }),
          });
        }
      }
    } finally {
      setLoading(false);
      setAbortController(null);
      setExecutionId(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPersonTitles([]);
    setPersonLocations([]);
    setCompanyLocations([]);
    setHeadcountRanges([]);
    setContactEmailStatus([]);
    setMaxPages('1');
    setPerPage('100');
    setProgress({ current: 0, total: 0, status: '' });
  };

  if (!configured) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apollo.io Not Configured</DialogTitle>
            <DialogDescription>
              Apollo.io API key is not configured. Please add APOLLO_API_KEY to your environment variables.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Apollo.io Script</DialogTitle>
          <DialogDescription>
            Search for contacts and companies on Apollo.io and import them to your database.
            Note: Contacts are saved with placeholder emails since the API returns obfuscated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Person Titles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Job Titles</Label>
              {personTitles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setPersonTitles([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., CEO, CTO, Founder"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTitle(titleInput);
                  }
                }}
              />
              <Button type="button" onClick={() => handleAddTitle(titleInput)}>
                Add
              </Button>
            </div>
            {options?.commonTitles && (
              <div className="flex flex-wrap gap-1 mt-2">
                {options.commonTitles.map((title: string) => (
                  <Badge
                    key={title}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAddTitle(title)}
                  >
                    {title}
                  </Badge>
                ))}
              </div>
            )}
            {personTitles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {personTitles.map((title) => (
                  <Badge key={title} variant="default" className="gap-1">
                    {title}
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-sm"
                      onClick={() => handleRemoveTitle(title)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Person Locations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Person Locations</Label>
              {personLocations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setPersonLocations([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(value) => {
                if (value === 'custom') {
                  // Allow custom input
                  const custom = prompt('Enter custom location:');
                  if (custom) handleAddPersonLocation(custom);
                } else {
                  handleAddPersonLocation(value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or add location" />
                </SelectTrigger>
                <SelectContent>
                  {options?.commonLocations?.map((location: string) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Location...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {personLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {personLocations.map((location) => (
                  <Badge key={location} variant="default" className="gap-1">
                    {location}
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-sm"
                      onClick={() => handleRemovePersonLocation(location)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Company Locations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Company Locations</Label>
              {companyLocations.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setCompanyLocations([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(value) => {
                if (value === 'custom') {
                  // Allow custom input
                  const custom = prompt('Enter custom location:');
                  if (custom) handleAddCompanyLocation(custom);
                } else {
                  handleAddCompanyLocation(value);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or add location" />
                </SelectTrigger>
                <SelectContent>
                  {options?.commonLocations?.map((location: string) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Location...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {companyLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {companyLocations.map((location) => (
                  <Badge key={location} variant="default" className="gap-1">
                    {location}
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-sm"
                      onClick={() => handleRemoveCompanyLocation(location)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Email Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contact Email Status</Label>
              {contactEmailStatus.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setContactEmailStatus([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            <Select onValueChange={handleAddEmailStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select email statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="likely_to_engage">Likely to Engage</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            {contactEmailStatus.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {contactEmailStatus.map((status) => (
                  <Badge key={status} variant="default" className="gap-1">
                    {status.replace('_', ' ')}
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-sm"
                      onClick={() => handleRemoveEmailStatus(status)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Company Size (Employee Count)</Label>
              {headcountRanges.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setHeadcountRanges([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            {options?.headcountRanges && (
              <Select onValueChange={handleAddHeadcountRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company sizes" />
                </SelectTrigger>
                <SelectContent>
                  {options.headcountRanges.map((range: HeadcountRange) => (
                    <SelectItem key={range.label} value={range.label}>
                      {range.label} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {headcountRanges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {headcountRanges.map((range) => (
                  <Badge key={range} variant="default" className="gap-1">
                    {range} employees
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-foreground/20 rounded-sm"
                      onClick={() => handleRemoveHeadcountRange(range)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enrichment Settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Auto-Enrichment (Optional)</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically enrich collected results with full contact details including emails. This will consume Apollo API credits.
            </p>

            <div className="space-y-2">
              <Label htmlFor="auto-enrich">Enable Auto-Enrichment</Label>
              <Select
                value={autoEnrich.toString()}
                onValueChange={(value) => setAutoEnrich(value === 'true')}
              >
                <SelectTrigger id="auto-enrich">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes - Auto-enrich after collection</SelectItem>
                  <SelectItem value="false">No - Manual enrichment later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {autoEnrich && (
              <>
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
                </div>

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
                </div>

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
                      Required for phone number enrichment
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Max Pages and Per Page */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Pages</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of pages to fetch maximum is 500
              </p>
            </div>
            <div className="space-y-2">
              <Label>Results Per Page</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Results returned per page maximum is 100
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {loading && progress.total > 0 && (
          <div className="space-y-2 px-6 pb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.status}</span>
              <span className="font-medium">
                {progress.current} / {progress.total} pages
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (loading) {
                handleCancel();
              } else {
                onOpenChange(false);
              }
            }}
          >
            {loading ? 'Cancel' : 'Close'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Running...' : 'Run Script'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
