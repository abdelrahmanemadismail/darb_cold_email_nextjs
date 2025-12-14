'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  TrendingUp,
  TrendingDown,
  MousePointer,
  Reply,
  Activity,
} from 'lucide-react';

// Mock data for analytics
const mockMetrics = {
  emailsSent: 4523,
  emailsSentChange: 12.5,
  openRate: 34.2,
  openRateChange: 3.1,
  clickRate: 12.8,
  clickRateChange: -2.3,
  replyRate: 8.5,
  replyRateChange: 5.7,
};

const mockCampaignPerformance = [
  { name: 'Q4 Tech Outreach', sent: 500, opened: 189, clicked: 78, replied: 32, revenue: 15000 },
  { name: 'Enterprise SaaS Campaign', sent: 300, opened: 112, clicked: 45, replied: 18, revenue: 8500 },
  { name: 'Product Launch Announcement', sent: 1200, opened: 456, clicked: 189, replied: 45, revenue: 22000 },
  { name: 'Follow-up Campaign', sent: 250, opened: 98, clicked: 34, replied: 15, revenue: 5500 },
];

const mockTimeSeriesData = [
  { date: '2025-01-01', sent: 120, opened: 45, clicked: 18, replied: 8 },
  { date: '2025-01-02', sent: 150, opened: 58, clicked: 22, replied: 11 },
  { date: '2025-01-03', sent: 180, opened: 68, clicked: 28, replied: 14 },
  { date: '2025-01-04', sent: 140, opened: 52, clicked: 19, replied: 9 },
  { date: '2025-01-05', sent: 200, opened: 78, clicked: 32, replied: 16 },
  { date: '2025-01-06', sent: 160, opened: 62, clicked: 24, replied: 12 },
  { date: '2025-01-07', sent: 190, opened: 72, clicked: 30, replied: 15 },
];

const mockTopPerformers = [
  { email: 'john.doe@techcorp.com', opens: 45, clicks: 23, replies: 12 },
  { email: 'jane.smith@enterprise.io', opens: 38, clicks: 19, replies: 10 },
  { email: 'mike.johnson@startup.com', opens: 32, clicks: 16, replies: 8 },
  { email: 'sarah.wilson@company.net', opens: 28, clicks: 14, replies: 7 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and insights across your campaigns
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.emailsSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {mockMetrics.emailsSentChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mockMetrics.emailsSentChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mockMetrics.emailsSentChange}%</span>
                </>
              )}
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.openRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {mockMetrics.openRateChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mockMetrics.openRateChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mockMetrics.openRateChange}%</span>
                </>
              )}
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.clickRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {mockMetrics.clickRateChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mockMetrics.clickRateChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mockMetrics.clickRateChange}%</span>
                </>
              )}
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <Reply className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.replyRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {mockMetrics.replyRateChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mockMetrics.replyRateChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mockMetrics.replyRateChange}%</span>
                </>
              )}
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Email Activity Trend</CardTitle>
                <CardDescription>Daily email metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockTimeSeriesData.map((day) => (
                    <div key={day.date} className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm text-muted-foreground">{day.date}</span>
                      <div className="flex gap-4">
                        <span className="text-sm">
                          Sent: <span className="font-medium">{day.sent}</span>
                        </span>
                        <span className="text-sm">
                          Opened: <span className="font-medium">{day.opened}</span>
                        </span>
                        <span className="text-sm">
                          Clicked: <span className="font-medium">{day.clicked}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Most engaged contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTopPerformers.map((performer, index) => (
                    <div key={performer.email} className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        #{index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{performer.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {performer.opens} opens · {performer.clicks} clicks · {performer.replies} replies
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaign Performance Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Detailed metrics for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCampaignPerformance.map((campaign) => (
                  <div key={campaign.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        Revenue: ${campaign.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Sent</p>
                        <p className="text-2xl font-bold">{campaign.sent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Open Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(campaign.opened, campaign.sent)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Click Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(campaign.clicked, campaign.sent)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reply Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(campaign.replied, campaign.sent)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${formatPercentage(campaign.opened, campaign.sent)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Breakdown of user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Opens</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {mockCampaignPerformance.reduce((sum, c) => sum + c.opened, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Clicks</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {mockCampaignPerformance.reduce((sum, c) => sum + c.clicked, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Total Replies</span>
                    </div>
                    <span className="text-2xl font-bold">
                      {mockCampaignPerformance.reduce((sum, c) => sum + c.replied, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey through campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sent</span>
                      <span className="text-sm font-medium">100%</span>
                    </div>
                    <div className="h-3 w-full bg-primary rounded" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Opened</span>
                      <span className="text-sm font-medium">{mockMetrics.openRate}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${mockMetrics.openRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Clicked</span>
                      <span className="text-sm font-medium">{mockMetrics.clickRate}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${mockMetrics.clickRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Replied</span>
                      <span className="text-sm font-medium">{mockMetrics.replyRate}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${mockMetrics.replyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
