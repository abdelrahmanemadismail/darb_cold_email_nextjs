'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { ApolloScriptDialog } from '@/components/scripts/ApolloScriptDialog';
import { RunningScriptsList } from '@/components/scripts/RunningScriptsList';
import { ScriptHistory } from '@/components/scripts/ScriptHistory';
import { ScriptTemplates } from '@/components/scripts/ScriptTemplates';
import { ScriptAnalytics } from '@/components/scripts/ScriptAnalytics';
import { Plus, Play } from 'lucide-react';

export default function ScriptsPage() {
  const [apolloDialogOpen, setApolloDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scripts Manager</h1>
          <p className="text-muted-foreground">
            Configure, monitor, and manage automation scripts
          </p>
        </div>
        <PermissionGuard permission="script:create">
          <Button onClick={() => setApolloDialogOpen(true)} size="lg">
            <Play className="mr-2 h-4 w-4" />
            New Script
          </Button>
        </PermissionGuard>
      </div>

      {/* Apollo Script Dialog */}
      <ApolloScriptDialog
        open={apolloDialogOpen}
        onOpenChange={setApolloDialogOpen}
        onSuccess={() => {
          console.log('Apollo script completed successfully');
        }}
      />

      {/* Analytics */}
      <ScriptAnalytics />

      {/* Running Scripts */}
      <RunningScriptsList />

      {/* Tabbed Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <ScriptHistory />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ScriptTemplates
            onRunTemplate={(template) => {
              // Would populate the dialog with template data
              setApolloDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="quickstart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Get started with automation scripts in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Select Script Type</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose from available scripts like Apollo.io data collection
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Configure Parameters</h4>
                    <p className="text-sm text-muted-foreground">
                      Set up filters, search criteria, and execution settings
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Monitor Execution</h4>
                    <p className="text-sm text-muted-foreground">
                      Track real-time progress with visual indicators and control execution
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Review Results</h4>
                    <p className="text-sm text-muted-foreground">
                      View execution history, analytics, and collected data
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <PermissionGuard permission="script:create">
                  <Button onClick={() => setApolloDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Script
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
