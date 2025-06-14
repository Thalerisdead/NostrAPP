import React from 'react';
import { ScheduledPostsManager } from '@/components/ScheduledPostsManager';
import { SchedulerDebugPanel } from '@/components/SchedulerDebugPanel';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Schedule Posts</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Schedule your Nostr posts and track their performance
            </p>
            
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <SchedulerDebugPanel />
          <ScheduledPostsManager />
        </div>
      </div>
    </div>
  );
} 