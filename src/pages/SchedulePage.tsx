import React from 'react';
import { ScheduledPostsManager } from '@/components/ScheduledPostsManager';
import { SchedulerDebugPanel } from '@/components/SchedulerDebugPanel';
import { PageHeader } from '@/components/PageHeader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePostScheduler } from '@/hooks/usePostScheduler';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent } from '@/components/ui/card';

export function SchedulePage() {
  const { user } = useCurrentUser();
  
  // Initialize the scheduler when component mounts
  usePostScheduler();

  if (!user) {
    return (
      <div>
        <PageHeader 
          title="Schedule Posts" 
          description="Schedule your Nostr posts and track their performance"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Schedule Posts' }
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <p className="text-muted-foreground mb-6">
                  Please log in to access the post scheduling feature
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Schedule Posts" 
        description="Manage your scheduled posts and track their performance"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Schedule Posts' }
        ]}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <SchedulerDebugPanel />
          <ScheduledPostsManager />
        </div>
      </div>
    </div>
  );
} 