import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { toast } from './useToast';

export interface CreateScheduledPostData {
  title: string;
  content: string;
  publishAt: Date;
  targetKind?: number;
  images?: string[]; // Array of image URLs
}

export interface UpdateScheduledPostData {
  id: string;
  status: 'published' | 'failed' | 'cancelled';
  publishedEventId?: string;
  error?: string;
  // Include original metadata for proper event replacement
  publishAt?: Date;
  targetKind?: number;
  createdAt?: Date;
}

export function useSchedulePost() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  const createScheduledPost = useMutation({
    mutationFn: async (data: CreateScheduledPostData) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      if (!user.signer.nip44) {
        throw new Error('NIP-44 encryption not supported by your signer');
      }

      // Generate unique ID for this scheduled post
      const id = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      // Encrypt just the text content (images are stored separately in tags)
      const encryptedContent = await user.signer.nip44.encrypt(user.pubkey, data.content);

      // Create tags for the scheduled post event
      const tags: string[][] = [
        ['d', id],
        ['publish_at', Math.floor(data.publishAt.getTime() / 1000).toString()],
        ['target_kind', (data.targetKind || 1).toString()],
        ['status', 'scheduled'],
        ['created_at', Math.floor(Date.now() / 1000).toString()],
        ['title', data.title], // Add title for organization
      ];

      // Add image tags if any
      if (data.images && data.images.length > 0) {
        data.images.forEach(imageUrl => {
          tags.push(['image', imageUrl]);
        });
      }

      // Create the scheduled post event
      await publishEvent({
        kind: 30401,
        content: encryptedContent,
        tags,
      });

      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({
        title: 'Post scheduled',
        description: 'Your post has been scheduled successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to schedule post:', error);
      toast({
        title: 'Failed to schedule post',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const updateScheduledPost = useMutation({
    mutationFn: async (data: UpdateScheduledPostData) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      // Create tags for the update - include all required metadata
      const tags: string[][] = [
        ['d', data.id],
        ['status', data.status],
      ];

      // Include original metadata if provided
      if (data.publishAt) {
        tags.push(['publish_at', Math.floor(data.publishAt.getTime() / 1000).toString()]);
      }
      
      if (data.targetKind) {
        tags.push(['target_kind', data.targetKind.toString()]);
      }
      
      if (data.createdAt) {
        tags.push(['created_at', Math.floor(data.createdAt.getTime() / 1000).toString()]);
      }

      if (data.publishedEventId) {
        tags.push(['published_event', data.publishedEventId]);
      }

      if (data.error) {
        tags.push(['error', data.error]);
      }

      // Update the scheduled post status
      await publishEvent({
        kind: 30401,
        content: '', // Empty content for status updates
        tags,
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      
      if (data.status === 'published') {
        toast({
          title: 'Post published',
          description: 'Your scheduled post has been published successfully.',
        });
      } else if (data.status === 'cancelled') {
        toast({
          title: 'Post cancelled',
          description: 'Your scheduled post has been cancelled.',
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update scheduled post:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const cancelScheduledPost = useMutation({
    mutationFn: async (id: string) => {
      return updateScheduledPost.mutateAsync({
        id,
        status: 'cancelled',
      });
    },
  });

  return {
    createScheduledPost,
    updateScheduledPost,
    cancelScheduledPost,
    isCreating: createScheduledPost.isPending,
    isUpdating: updateScheduledPost.isPending,
    isCancelling: cancelScheduledPost.isPending,
  };
} 