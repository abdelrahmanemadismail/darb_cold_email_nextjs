'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Square,
  Plus,
  Settings,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function ScriptsPage() {
  const [selectedTab, setSelectedTab] = useState('all');

  // Mock data
  const mockScripts = [
    {
      id: '1',
      name: 'Apollo Tech Companies',
      type: 'Apollo',
      status: 'completed',
      lastRun: '2024-12-11 10:30',
      recordsCollected: 45,
      schedule: { enabled: true, frequency: 'daily', time: '09:00' },
    },
    {
      id: '2',
      name: 'Apify LinkedIn Scraper',
      type: 'Apify',
      status: 'running',
      lastRun: '2024-12-11 13:45',
      recordsCollected: 12,
      schedule: { enabled: false },
    },
    {
      id: '3',
      name: 'SaaS Companies Hunter',
      type: 'Apollo',
      status: 'idle',
      lastRun: '2024-12-10 15:20',
      recordsCollected: 78,
      schedule: { enabled: true, frequency: 'weekly', time: '08:00' },
    },
    {
      id: '4',
      name: 'Marketing Contacts',
      type: 'Apify',
      status: 'failed',
      lastRun: '2024-12-11 11:00',
      recordsCollected: 0,
      schedule: { enabled: false },
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      idle: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scripts Manager</h1>
          <p className="text-muted-foreground">
            Configure and run data collection scripts
          </p>
        </div>
        <PermissionGuard permission="script:create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Script
          </Button>
        </PermissionGuard>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Scripts ({mockScripts.length})</TabsTrigger>
          <TabsTrigger value="running">
            Running ({mockScripts.filter((s) => s.status === 'running').length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({mockScripts.filter((s) => s.schedule.enabled).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockScripts.map((script) => (
              <Card key={script.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{script.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">{script.type}</Badge>
                        {script.schedule.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {script.schedule.frequency}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusIcon(script.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(script.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Run:</span>
                      <span>{script.lastRun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Records:</span>
                      <span className="font-medium">{script.recordsCollected}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <PermissionGuard permission="script:run">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={script.status === 'running'}
                      >
                        {script.status === 'running' ? (
                          <>
                            <Square className="mr-2 h-3 w-3" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-3 w-3" />
                            Start
                          </>
                        )}
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="script:edit">
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="script:delete">
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockScripts
              .filter((s) => s.status === 'running')
              .map((script) => (
                <Card key={script.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{script.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Currently collecting data...
                    </p>
                    <PermissionGuard permission="script:run">
                      <Button size="sm" className="mt-4 w-full" variant="destructive">
                        <Square className="mr-2 h-3 w-3" />
                        Stop Script
                      </Button>
                    </PermissionGuard>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockScripts
              .filter((s) => s.schedule.enabled)
              .map((script) => (
                <Card key={script.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{script.name}</CardTitle>
                    <CardDescription>
                      Runs {script.schedule.frequency} at {script.schedule.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <PermissionGuard permission="script:run">
                        <Button size="sm" className="flex-1">
                          <Play className="mr-2 h-3 w-3" />
                          Run Now
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="script:edit">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
          <CardDescription>Real-time script execution logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            <div className="text-muted-foreground">
              [2024-12-11 13:45:23] <span className="text-blue-500">INFO</span> Apify
              LinkedIn Scraper started
            </div>
            <div className="text-muted-foreground">
              [2024-12-11 13:45:24] <span className="text-blue-500">INFO</span> Fetching
              data from LinkedIn...
            </div>
            <div className="text-muted-foreground">
              [2024-12-11 13:45:30] <span className="text-green-500">SUCCESS</span>{' '}
              Collected 12 records
            </div>
            <div className="text-muted-foreground">
              [2024-12-11 13:45:31] <span className="text-blue-500">INFO</span> Saving
              to database...
            </div>
            <div className="text-muted-foreground">
              [2024-12-11 10:30:45] <span className="text-green-500">SUCCESS</span>{' '}
              Apollo Tech Companies completed - 45 records collected
            </div>
            <div className="text-muted-foreground">
              [2024-12-11 11:00:15] <span className="text-red-500">ERROR</span>{' '}
              Marketing Contacts failed - API key invalid
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
