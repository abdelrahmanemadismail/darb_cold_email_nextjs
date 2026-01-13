'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ScriptExecution {
  status: string;
  startedAt: string;
  completedAt: string | null;
  results?: {
    totalRawResults?: number;
  };
}

export function ScriptAnalytics() {
  const { data } = useQuery({
    queryKey: ['script-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/script-executions?limit=100');
      const { executions }: { executions: ScriptExecution[] } = await response.json();

      const total = executions.length;
      const completed = executions.filter((e) => e.status === 'completed').length;
      const failed = executions.filter((e) => e.status === 'failed').length;
      const running = executions.filter((e) => e.status === 'running').length;

      const totalResults = executions
        .filter((e) => e.results?.totalRawResults)
        .reduce((sum: number, e) => sum + (e.results?.totalRawResults || 0), 0);

      const completedScripts = executions.filter((e) =>
        e.status === 'completed' && e.startedAt && e.completedAt
      );

      const avgDuration = completedScripts.length > 0
        ? completedScripts.reduce((sum: number, e) => {
            const start = new Date(e.startedAt).getTime();
            const end = new Date(e.completedAt!).getTime();
            return sum + (end - start);
          }, 0) / completedScripts.length / 1000 // Convert to seconds
        : 0;

      const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

      return {
        total,
        completed,
        failed,
        running,
        totalResults,
        avgDuration,
        successRate,
      };
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const stats = data || {
    total: 0,
    completed: 0,
    failed: 0,
    running: 0,
    totalResults: 0,
    avgDuration: 0,
    successRate: 0,
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.completed} of {stats.total} scripts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
          <p className="text-xs text-muted-foreground">
            Per completed script
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Results</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalResults.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across all executions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Scripts</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.running}</div>
          <p className="text-xs text-muted-foreground">
            Currently running
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
