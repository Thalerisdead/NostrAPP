import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

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

      const scheduledPosts: ScheduledPost[] = [];

      for (const event of events) {
        try {
          const dTag = event.tags.find(([name]) => name === 'd')?.[1];
          const publishAtTag = event.tags.find(([name]) => name === 'publish_at')?.[1];
          const statusTag = event.tags.find(([name]) => name === 'status')?.[1];
          const targetKindTag = event.tags.find(([name]) => name === 'target_kind')?.[1];
          const createdAtTag = event.tags.find(([name]) => name === 'created_at')?.[1];
          const publishedEventIdTag = event.tags.find(([name]) => name === 'published_event')?.[1];
          const errorTag = event.tags.find(([name]) => name === 'error')?.[1];
          const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
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