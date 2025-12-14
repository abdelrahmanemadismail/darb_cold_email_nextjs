'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Play,
  Pause,
  Mail,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const mockCampaigns = [
  {
    id: 1,
    name: 'Q4 Tech Outreach',
    status: 'active',
    sent: 245,
    opened: 89,
    clicked: 34,
    replied: 12,
    scheduled: '2025-01-15',
    recipients: 500,
  },
  {
    id: 2,
    name: 'Enterprise SaaS Campaign',
    status: 'paused',
    sent: 150,
    opened: 67,
    clicked: 23,
    replied: 8,
    scheduled: '2025-01-20',
    recipients: 300,
  },
  {
    id: 3,
    name: 'Product Launch Announcement',
    status: 'completed',
    sent: 1200,
    opened: 456,
    clicked: 189,
    replied: 45,
    scheduled: '2024-12-01',
    recipients: 1200,
  },
  {
    id: 4,
    name: 'Follow-up Campaign',
    status: 'draft',
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    scheduled: '2025-02-01',
    recipients: 250,
  },
];

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500' },
  paused: { label: 'Paused', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-blue-500' },
  draft: { label: 'Draft', color: 'bg-gray-500' },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleStatusChange = (campaignId: number, newStatus: string) => {
    setCampaigns(campaigns.map(c =>
      c.id === campaignId ? { ...c, status: newStatus } : c
    ));
  };

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return 0;
    return ((opened / sent) * 100).toFixed(1);
  };

  const calculateClickRate = (clicked: number, sent: number) => {
    if (sent === 0) return 0;
    return ((clicked / sent) * 100).toFixed(1);
  };

  const calculateReplyRate = (replied: number, sent: number) => {
    if (sent === 0) return 0;
    return ((replied / sent) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and monitor your email campaigns
          </p>
        </div>
        <PermissionGuard permission="campaign:create">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new email campaign to reach your contacts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" placeholder="Enter campaign name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled">Schedule Date</Label>
                <Input id="scheduled" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients</Label>
                <Input id="recipients" type="number" placeholder="Number of recipients" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </PermissionGuard>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.sent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Open Rate
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                campaigns.reduce((sum, c) => sum + (c.sent > 0 ? (c.opened / c.sent) * 100 : 0), 0) /
                campaigns.filter(c => c.sent > 0).length
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on sent emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Reply Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                campaigns.reduce((sum, c) => sum + (c.sent > 0 ? (c.replied / c.sent) * 100 : 0), 0) /
                campaigns.filter(c => c.sent > 0).length
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on sent emails
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            View and manage all your email campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Open Rate</TableHead>
                <TableHead className="text-right">Click Rate</TableHead>
                <TableHead className="text-right">Reply Rate</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          statusConfig[campaign.status as keyof typeof statusConfig].color
                        }`}
                      />
                      {statusConfig[campaign.status as keyof typeof statusConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.sent}/{campaign.recipients}
                  </TableCell>
                  <TableCell className="text-right">
                    {calculateOpenRate(campaign.opened, campaign.sent)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {calculateClickRate(campaign.clicked, campaign.sent)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {calculateReplyRate(campaign.replied, campaign.sent)}%
                  </TableCell>
                  <TableCell>{campaign.scheduled}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGuard permission="campaign:start">
                          {campaign.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(campaign.id, 'paused')}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'paused' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(campaign.id, 'active')}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(campaign.id, 'active')}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Start
                            </DropdownMenuItem>
                          )}
                        </PermissionGuard>
                        <PermissionGuard permission="campaign:edit">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard permission="campaign:delete">
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
