import { useEffect, useRef, useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { useSchedulePost } from './useSchedulePost';
import { useScheduledPosts } from './useScheduledPosts';
import { PostScheduler, setScheduler, getScheduler, type ScheduledPostEvent } from '@/lib/postScheduler';

export function usePostScheduler() {
  const { user } = useCurrentUser();
  const nostrPublish = useNostrPublish();
  const { updateScheduledPost } = useSchedulePost();
  const { data: scheduledPosts = [] } = useScheduledPosts();
  const schedulerRef = useRef<PostScheduler | null>(null);

  // Use refs to store latest functions without causing effect dependencies
  const publishEventRef = useRef<typeof nostrPublish.mutateAsync>();
  const updateWrapperRef = useRef<typeof updateScheduledPost.mutateAsync>();

  // Update refs with latest functions
  publishEventRef.current = nostrPublish.mutateAsync;
  updateWrapperRef.current = updateScheduledPost.mutateAsync;

  // Stable functions that use the refs
  const publishEvent = useCallback(async (event: Omit<import('@nostrify/nostrify').NostrEvent, 'id' | 'pubkey' | 'sig'>) => {
    if (!publishEventRef.current) throw new Error('Publish function not available');
    return await publishEventRef.current(event);
  }, []);

  const updateWrapper = useCallback(async (data: { id: string; status: 'published' | 'failed'; publishedEventId?: string; error?: string; publishAt?: Date; targetKind?: number; createdAt?: Date }) => {
    if (!updateWrapperRef.current) throw new Error('Update function not available');
    await updateWrapperRef.current(data);
  }, []);

  // Initialize scheduler when user logs in (only depend on user)
  useEffect(() => {
    if (!user) {
      // Stop and cleanup scheduler when user logs out
      if (schedulerRef.current) {
        schedulerRef.current.stop();
        schedulerRef.current = null;
        setScheduler(null);
      }
      return;
    }

    // Create new scheduler if none exists OR if user changed
    if (!schedulerRef.current) {
      console.log(`Creating new scheduler for user ${user.pubkey.slice(0, 8)}...`);
      schedulerRef.current = new PostScheduler(
        user,
        publishEvent,
        updateWrapper
      );
      
      schedulerRef.current.start();
      setScheduler(schedulerRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (schedulerRef.current) {
        console.log('Cleaning up scheduler on unmount');
        schedulerRef.current.stop();
        schedulerRef.current = null;
        setScheduler(null);
      }
    };
  }, [user]); // Only depend on user, not on functions

  // Update scheduler with latest scheduled posts
  useEffect(() => {
    if (!schedulerRef.current) return;

    // Convert scheduled posts to scheduler format - only include posts that are actually scheduled
    const schedulerPosts: ScheduledPostEvent[] = scheduledPosts
      .filter(post => post.status === 'scheduled')
      .map(post => {
        return {
          id: post.id,
          publishAt: post.publishAt,
          content: post.content,
          targetKind: post.targetKind,
          images: post.images,
          event: post.event,
          title: post.title,
        };
      });

    console.log(`[SCHEDULER_UPDATE] Updating scheduler with ${schedulerPosts.length} scheduled posts (filtered from ${scheduledPosts.length} total posts)`);
    
    // Log the statuses of all posts for debugging
    const statusCounts = scheduledPosts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`[SCHEDULER_STATUS] Post status counts:`, statusCounts);

    // Always update the scheduler, even with empty array to clear old posts
    schedulerRef.current.updateScheduledPosts(schedulerPosts);
    
    // Log individual scheduled posts for debugging
    schedulerPosts.forEach(post => {
      console.log(`[SCHEDULED_POST] ${post.id}: publishes at ${post.publishAt.toISOString()}, content length: ${post.content.length}`);
    });
  }, [scheduledPosts]);

  return {
    scheduler: schedulerRef.current,
    isRunning: !!schedulerRef.current,
  };
}

// Hook for components that just need to check if scheduler is running
export function useSchedulerStatus() {
  const scheduler = getScheduler();
  return {
    isRunning: !!scheduler,
    scheduler,
  };
} 