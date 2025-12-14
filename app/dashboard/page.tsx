'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Users, Mail, TrendingUp, Play, FileUp, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  // Mock data - will be replaced with real API calls
  const stats = {
    totalCompanies: 1234,
    totalContacts: 5678,
    activeCampaigns: 12,
    emailsSent30d: 4500,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'script_run',
      title: 'Data Collection Completed',
      description: 'Apollo_TechCompanies collected 45 new contacts',
      timestamp: '2 minutes ago',
    },
    {
      id: 2,
      type: 'campaign_started',
      title: 'Campaign Started',
      description: 'Q1 Outreach campaign has been launched',
      timestamp: '1 hour ago',
    },
    {
      id: 3,
      type: 'data_imported',
      title: 'Data Imported',
      description: 'Successfully imported 120 contacts from CSV',
      timestamp: '3 hours ago',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your campaigns.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              3 scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent (30d)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent30d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+25%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 rounded-lg border p-3"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/data')}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/campaigns')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/scripts')}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Scripts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaign Performance Overview</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/analytics')}
          >
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">42.3%</div>
                <div className="text-xs text-muted-foreground">Open Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold">8.7%</div>
                <div className="text-xs text-muted-foreground">Click Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold">3.2%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </div>
            </div>
            <div className="h-48 flex items-center justify-center border rounded-md bg-muted/10">
              <div className="text-center space-y-2">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Campaign analytics chart will be displayed here
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
