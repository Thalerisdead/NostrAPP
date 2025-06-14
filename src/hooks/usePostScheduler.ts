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

  // Initialize scheduler when user logs in (only depend on user, not functions)
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
  }, [user, publishEvent, updateWrapper]); // Functions are now stable

  // Update scheduler with latest scheduled posts
  useEffect(() => {
    if (!schedulerRef.current || !scheduledPosts.length) return;

    // Convert scheduled posts to scheduler format
    const schedulerPosts: ScheduledPostEvent[] = scheduledPosts
      .filter(post => post.status === 'scheduled')
      .map(post => {
        console.log(`Converting scheduled post ${post.id} to scheduler format:`, {
          id: post.id,
          images: post.images,
          imagesCount: post.images?.length || 0
        });
        return {
          id: post.id,
          publishAt: post.publishAt,
          content: post.content,
          targetKind: post.targetKind,
          images: post.images,
          event: post.event,
        };
      });

    schedulerRef.current.updateScheduledPosts(schedulerPosts);
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