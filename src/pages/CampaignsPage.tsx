import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCampaigns } from '@/hooks/useCampaigns';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignsTable } from '@/components/CampaignsTable';
import { CampaignForm } from '@/components/CampaignForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Target, Calendar, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Campaign } from '@/types/campaign';

export function CampaignsPage() {
  const { user } = useCurrentUser();
  const { data: campaigns, isLoading } = useCampaigns();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  if (!user) {
    return (
      <div>
        <PageHeader 
          title="Campaigns" 
          description="Create and manage marketing campaigns for your Nostr posts"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Campaigns' }
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Campaign Management</h3>
                <p className="text-muted-foreground mb-6">
                  Please log in to create and manage your marketing campaigns
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader 
          title="Campaigns" 
          description="Create and manage marketing campaigns for your Nostr posts"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Campaigns' }
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Table Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  const scheduledCampaigns = campaigns?.filter(c => c.status === 'scheduled') || [];
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed') || [];

  return (
    <div>
      <PageHeader 
        title="Campaigns" 
        description="Create and manage marketing campaigns for your Nostr posts"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Campaigns' }
        ]}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-bold">{activeCampaigns.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold">{scheduledCampaigns.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedCampaigns.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Your Campaigns</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your marketing campaigns and track their performance
                  </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              {campaigns && campaigns.length > 0 ? (
                <CampaignsTable 
                  campaigns={campaigns} 
                  onEditCampaign={setEditingCampaign}
                />
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first campaign to start organizing your content strategy
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <CampaignForm 
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {editingCampaign && (
              <CampaignForm 
                campaign={editingCampaign}
                onSuccess={() => setEditingCampaign(null)}
                onCancel={() => setEditingCampaign(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 