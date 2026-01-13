'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

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

interface RunningScriptsListProps {
  onScriptComplete?: () => void;
}

export function RunningScriptsList({ }: RunningScriptsListProps) {
  // Fetch script executions from database
  const { data, refetch } = useQuery({
    queryKey: ['script-executions'],
    queryFn: async () => {
      const response = await fetch('/api/script-executions?limit=10');
      return response.json();
    },
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  const getScriptTypeName = (type: string) => {
    switch (type) {
      case 'apollo':
        return 'Apollo.io';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/script-executions/${id}`, {
      method: 'DELETE',
    });
    refetch();
  };

  // Filter to show only running scripts
  const recentScripts = useMemo(() => {
    const scripts: ScriptExecution[] = data?.executions || [];
    return scripts.filter(script => script.status === 'running');
  }, [data?.executions]);

  if (recentScripts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Running Scripts
        </CardTitle>
        <CardDescription>
          Monitor active script executions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentScripts.map((script) => (
            <div
              key={script.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{getScriptTypeName(script.scriptType)} Script</h4>
                    <Badge
                      variant={
                        script.status === 'running' ? 'default' :
                        script.status === 'completed' ? 'default' :
                        script.status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {script.status === 'running' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {script.status === 'completed' && '✓ '}
                      {script.status === 'failed' && '✗ '}
                      {script.status === 'cancelled' && '⊗ '}
                      {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Started {format(new Date(script.startedAt), 'HH:mm:ss')}
                    </span>
                    {script.parameters?.maxPages !== undefined && (
                      <span>Max Pages: {String(script.parameters.maxPages)}</span>
                    )}
                    {script.parameters?.perPage !== undefined && (
                      <span>Per Page: {String(script.parameters.perPage)}</span>
                    )}
                  </div>
                </div>
                {script.status !== 'running' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(script.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search Criteria */}
              {(script.parameters?.personTitles || script.parameters?.personLocations || script.parameters?.companyLocations) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {Array.isArray(script.parameters.personTitles) && script.parameters.personTitles.map((title: unknown, idx: number) => (
                    <Badge key={`title-${idx}-${String(title)}`} variant="outline" className="font-normal">
                      Title: {String(title) as string}
                    </Badge>
                  ))}
                  {Array.isArray(script.parameters.personLocations) && script.parameters.personLocations.map((loc: unknown, idx: number) => (
                    <Badge key={`person-${idx}-${String(loc)}`} variant="outline" className="font-normal">
                      Person: {String(loc) as string}
                    </Badge>
                  ))}
                  {Array.isArray(script.parameters.companyLocations) && script.parameters.companyLocations.map((loc: unknown, idx: number) => (
                    <Badge key={`company-${idx}-${String(loc)}`} variant="outline" className="font-normal">
                      Company: {String(loc) as string}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              {script.status === 'running' && script.totalPages > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{script.progressStatus}</span>
                    <span className="font-medium">
                      {script.currentPage} / {script.totalPages} pages
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{
                        width: `${script.totalPages > 0 ? (script.currentPage / script.totalPages) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {script.results && script.status === 'completed' && (
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Results: <span className="font-medium text-foreground">{script.results.totalRawResults || 0}</span> raw results,{' '}
                    <span className="font-medium text-foreground">{script.results.totalContacts || 0}</span> contacts,{' '}
                    <span className="font-medium text-foreground">{script.results.totalCompanies || 0}</span> companies
                  </span>
                </div>
              )}

              {/* Error Message */}
              {script.errorMessage && script.status === 'failed' && (
                <div className="text-sm text-destructive">
                  Error: {script.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
