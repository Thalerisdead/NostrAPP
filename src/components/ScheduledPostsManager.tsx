import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useSchedulePost } from '@/hooks/useSchedulePost';
import { useSchedulerStatus } from '@/hooks/usePostScheduler';
import { SchedulePostDialog } from './SchedulePostDialog';
import { ScheduledPostsTable } from './ScheduledPostsTable';

export function ScheduledPostsManager() {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const { data: scheduledPosts = [], isLoading, error, refetch: refetchScheduledPosts } = useScheduledPosts();
  const { cancelScheduledPost, isCancelling } = useSchedulePost();
  const { isRunning: isSchedulerRunning } = useSchedulerStatus();

  // Refetch scheduled posts when component mounts to ensure fresh data
  useEffect(() => {
    refetchScheduledPosts();
  }, [refetchScheduledPosts]);

  const handleCancelPost = async (post: { id: string; title: string; publishAt: Date; targetKind: number; createdAt: Date }) => {
    try {
      await cancelScheduledPost.mutateAsync({
        id: post.id,
        title: post.title,
        publishAt: post.publishAt,
        targetKind: post.targetKind,
        createdAt: post.createdAt,
      });
    } catch (error) {
      console.error('Failed to cancel post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Scheduled Posts</h2>
            <p className="text-muted-foreground">Loading your scheduled posts...</p>
          </div>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Scheduled Posts</h2>
            <p className="text-muted-foreground text-red-600">
              Error loading posts. Please try refreshing the page.
            </p>
          </div>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Posts</h2>
          <p className="text-muted-foreground">
            Manage your scheduled posts. 
            {isSchedulerRunning ? (
              <span className="text-green-600 ml-1">Scheduler is running</span>
            ) : (
              <span className="text-orange-600 ml-1">Scheduler is stopped</span>
            )}
          </p>
        </div>
        
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      <ScheduledPostsTable 
        posts={scheduledPosts}
        onCancelPost={handleCancelPost}
        isCancelling={isCancelling}
        onSchedulePost={() => setShowScheduleDialog(true)}
      />

      <SchedulePostDialog
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
      />
    </div>
  );
} 