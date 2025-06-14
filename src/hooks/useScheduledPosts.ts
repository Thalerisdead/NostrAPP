import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { CampaignPostDraft } from '@/types/campaign';

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  publishAt: Date;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  targetKind: number;
  createdAt: Date;
  publishedEventId?: string;
  error?: string;
  images?: string[];
  campaignId?: string;
  event: NostrEvent;
}

export function useScheduledPosts() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<ScheduledPost[]>({
    queryKey: ['scheduled-posts', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user) {
        return [];
      }

      const events = await nostr.query(
        [{ 
          kinds: [30401], 
          authors: [user.pubkey],
          limit: 100 
        }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      // Deduplicate events by d-tag, keeping only the latest event for each d-tag
      // This is crucial for addressable events (kind 30401) where multiple events
      // with the same d-tag can exist, but only the latest should be processed
      const eventsByDTag = new Map<string, NostrEvent>();
      
      console.log(`[SCHEDULED_POSTS] Found ${events.length} raw events before deduplication`);
      
      for (const event of events) {
        const dTag = event.tags.find(([name]) => name === 'd')?.[1];
        if (!dTag) continue;
        
        const existing = eventsByDTag.get(dTag);
        if (!existing || event.created_at > existing.created_at) {
          if (existing) {
            console.log(`[DEDUPLICATION] Replacing event for d-tag ${dTag}: old created_at=${existing.created_at}, new created_at=${event.created_at}`);
          }
          eventsByDTag.set(dTag, event);
        } else {
          console.log(`[DEDUPLICATION] Keeping existing event for d-tag ${dTag}: existing created_at=${existing.created_at}, ignored created_at=${event.created_at}`);
        }
      }
      
      console.log(`[SCHEDULED_POSTS] After deduplication: ${eventsByDTag.size} unique events`);

      const scheduledPosts: ScheduledPost[] = [];

      for (const event of eventsByDTag.values()) {
        try {
          const dTag = event.tags.find(([name]) => name === 'd')?.[1];
          const publishAtTag = event.tags.find(([name]) => name === 'publish_at')?.[1];
          const statusTag = event.tags.find(([name]) => name === 'status')?.[1];
          const targetKindTag = event.tags.find(([name]) => name === 'target_kind')?.[1];
          const createdAtTag = event.tags.find(([name]) => name === 'created_at')?.[1];
          const publishedEventIdTag = event.tags.find(([name]) => name === 'published_event')?.[1];
          const errorTag = event.tags.find(([name]) => name === 'error')?.[1];
          const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
          const campaignIdTag = event.tags.find(([name]) => name === 'campaign_id')?.[1];
          const imageTags = event.tags.filter(([name]) => name === 'image').map(([, url]) => url);

          if (!dTag || !publishAtTag || !statusTag || !targetKindTag || !createdAtTag) {
            continue;
          }

          // Get content based on status
          let content = '';
          
          if (statusTag === 'scheduled' && event.content) {
            // For scheduled posts, decrypt the encrypted content
            try {
              if (user.signer.nip44) {
                content = await user.signer.nip44.decrypt(user.pubkey, event.content);
              }
            } catch (error) {
              console.warn('Failed to decrypt scheduled post content:', error);
              continue;
            }
          } else if (statusTag === 'published' && publishedEventIdTag) {
            // For published posts, fetch the content from the published event
            try {
              const publishedEvents = await nostr.query(
                [{ ids: [publishedEventIdTag] }],
                { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) }
              );
              
              if (publishedEvents.length > 0) {
                content = publishedEvents[0].content;
              }
            } catch (error) {
              console.warn('Failed to fetch published post content:', error);
              // Don't continue here, just leave content empty
            }
          } else if ((statusTag === 'failed' || statusTag === 'cancelled') && event.content) {
            // For failed or cancelled posts, try to decrypt the original content if it exists
            try {
              if (user.signer.nip44) {
                content = await user.signer.nip44.decrypt(user.pubkey, event.content);
              }
            } catch (error) {
              console.warn('Failed to decrypt failed/cancelled post content:', error);
              // Don't continue here, just leave content empty
            }
          }

          scheduledPosts.push({
            id: dTag,
            title: titleTag || 'Untitled Post',
            content,
            publishAt: new Date(parseInt(publishAtTag) * 1000),
            status: statusTag as ScheduledPost['status'],
            targetKind: parseInt(targetKindTag),
            createdAt: new Date(parseInt(createdAtTag) * 1000),
            publishedEventId: publishedEventIdTag,
            error: errorTag,
            images: imageTags.length > 0 ? imageTags : undefined,
            campaignId: campaignIdTag,
            event,
          });

          // Log content retrieval for debugging
          console.log(`Processed scheduled post ${dTag}: status=${statusTag}, contentLength=${content.length}, publishedEventId=${publishedEventIdTag || 'none'}`);
        } catch (error) {
          console.warn('Failed to parse scheduled post:', error);
        }
      }

      // Sort by publish date
      return scheduledPosts.sort((a, b) => a.publishAt.getTime() - b.publishAt.getTime());
    },
    enabled: !!user,
    retry: 3,
    refetchInterval: 10000, // Refetch every 10 seconds to keep UI in sync
    refetchIntervalInBackground: true, // Keep refreshing even when tab is in background
  });
}

export function useCampaignPosts(campaignId?: string) {
  const { data: allPosts, ...rest } = useScheduledPosts();
  
  const campaignPosts = useMemo(() => {
    if (!campaignId || !allPosts) return [];
    return allPosts.filter(post => post.campaignId === campaignId);
  }, [allPosts, campaignId]);

  return {
    data: campaignPosts,
    ...rest,
  };
}

export function useDeleteScheduledPost() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: ScheduledPost) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to delete scheduled posts');
      }

      // For addressable events (kind 30401), we update the status to 'cancelled'
      // This effectively "deletes" the post by marking it as cancelled
      const tags = [
        ['d', post.id],
        ['title', post.title],
        ['publish_at', Math.floor(post.publishAt.getTime() / 1000).toString()],
        ['status', 'cancelled'],
        ['target_kind', post.targetKind.toString()],
        ['created_at', Math.floor(post.createdAt.getTime() / 1000).toString()],
      ];

      if (post.campaignId) {
        tags.push(['campaign_id', post.campaignId]);
      }

      if (post.images && post.images.length > 0) {
        post.images.forEach(imageUrl => {
          tags.push(['image', imageUrl]);
        });
      }

      // Encrypt the original content (keep it for potential recovery)
      const encryptedContent = await user.signer.nip44!.encrypt(
        user.pubkey,
        post.content
      );

      const cancelEvent = await user.signer.signEvent({
        kind: 30401,
        content: encryptedContent,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(cancelEvent);
      return post.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });
}

export function useCreateScheduledPostsFromCampaign() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      posts, 
      startDate, 
      endDate 
    }: { 
      campaignId: string;
      posts: CampaignPostDraft[];
      startDate: Date;
      endDate: Date;
    }) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to create scheduled posts');
      }

      if (posts.length === 0) {
        return [];
      }

      // Calculate publish times - use custom time if set, otherwise distribute evenly
      const timeSpan = endDate.getTime() - startDate.getTime();
      const interval = timeSpan / posts.length;

      const scheduledPosts: ScheduledPost[] = [];

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // Use custom publish time if set, otherwise auto-schedule
        const publishAt = post.publishAt || new Date(startDate.getTime() + (interval * i));

        const scheduledPostData = {
          id: `scheduled-${Date.now()}-${i}`,
          title: post.title,
          content: post.content,
          publishAt,
          status: 'scheduled' as const,
          createdAt: new Date(),
          targetKind: 1,
          images: post.images,
          campaignId,
        };

        // Encrypt the post content
        const encryptedContent = await user.signer.nip44!.encrypt(
          user.pubkey,
          scheduledPostData.content
        );

        const tags = [
          ['d', scheduledPostData.id],
          ['title', scheduledPostData.title],
          ['publish_at', Math.floor(publishAt.getTime() / 1000).toString()],
          ['status', scheduledPostData.status],
          ['target_kind', scheduledPostData.targetKind.toString()],
          ['created_at', Math.floor(scheduledPostData.createdAt.getTime() / 1000).toString()],
          ['campaign_id', campaignId],
        ];

        if (scheduledPostData.images && scheduledPostData.images.length > 0) {
          scheduledPostData.images.forEach(imageUrl => {
            tags.push(['image', imageUrl]);
          });
        }

        const event = await user.signer.signEvent({
          kind: 30401,
          content: encryptedContent,
          tags,
          created_at: Math.floor(Date.now() / 1000),
        });

        await nostr.event(event);
        
        const scheduledPost: ScheduledPost = {
          ...scheduledPostData,
          event,
        };
        
        scheduledPosts.push(scheduledPost);
      }

      return scheduledPosts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });
} 