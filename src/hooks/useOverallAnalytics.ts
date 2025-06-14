import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useScheduledPosts } from './useScheduledPosts';
import type { PostAnalytics } from './usePostAnalytics';

export interface OverallAnalytics {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  totalEngagement: {
    likes: number;
    reposts: number;
    comments: number;
    zaps: {
      count: number;
      totalSats: number;
      averageSats: number;
    };
  };
  topPerformingPost?: {
    id: string;
    title: string;
    analytics: PostAnalytics;
    engagementScore: number;
  };
}

export function useOverallAnalytics() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: scheduledPosts = [] } = useScheduledPosts();

  return useQuery<OverallAnalytics>({
    queryKey: ['overall-analytics', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user) {
        return {
          totalPosts: 0,
          publishedPosts: 0,
          scheduledPosts: 0,
          failedPosts: 0,
          totalEngagement: {
            likes: 0,
            reposts: 0,
            comments: 0,
            zaps: {
              count: 0,
              totalSats: 0,
              averageSats: 0,
            },
          },
        };
      }

      const timeoutSignal = AbortSignal.timeout(5000);
      const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

      try {
        // Get published posts from scheduled posts
        const scheduledPublishedPosts = scheduledPosts.filter(post => 
          post.status === 'published' && post.publishedEventId
        );

        const scheduledCount = scheduledPosts.filter(post => post.status === 'scheduled').length;
        const failedCount = scheduledPosts.filter(post => post.status === 'failed').length;

        // Also fetch all posts published directly by the user (not just scheduled ones)
        const allUserPosts = await nostr.query(
          [{ kinds: [1], authors: [user.pubkey], limit: 100 }],
          { signal: combinedSignal }
        );

        console.log('Analytics Debug:', {
          userPubkey: user.pubkey,
          scheduledPosts: scheduledPosts.length,
          scheduledPublishedPosts: scheduledPublishedPosts.length,
          allUserPosts: allUserPosts.length,
          scheduledCount,
          failedCount
        });

        // Combine scheduled published posts with direct posts
        const scheduledEventIds = scheduledPublishedPosts
          .map(post => post.publishedEventId)
          .filter((id): id is string => !!id);

        const allEventIds = allUserPosts.map(post => post.id);
        
        // Get unique event IDs (combine scheduled and direct posts)
        const eventIds = [...new Set([...scheduledEventIds, ...allEventIds])];

        const totalPublishedPosts = eventIds.length;

        console.log('Analytics Event IDs:', {
          scheduledEventIds: scheduledEventIds.length,
          allEventIds: allEventIds.length,
          uniqueEventIds: eventIds.length,
          eventIds: eventIds.slice(0, 3) // Show first 3 for debugging
        });

        if (eventIds.length === 0) {
          return {
            totalPosts: Math.max(scheduledPosts.length, allUserPosts.length),
            publishedPosts: 0,
            scheduledPosts: scheduledCount,
            failedPosts: failedCount,
            totalEngagement: {
              likes: 0,
              reposts: 0,
              comments: 0,
              zaps: {
                count: 0,
                totalSats: 0,
                averageSats: 0,
              },
            },
          };
        }

        // Fetch all engagement data in parallel
        const [allReactions, allReposts, allComments, allZaps] = await Promise.all([
          nostr.query([{ kinds: [7], '#e': eventIds }], { signal: combinedSignal }),
          nostr.query([{ kinds: [6], '#e': eventIds }], { signal: combinedSignal }),
          nostr.query([{ kinds: [1], '#e': eventIds }], { signal: combinedSignal }),
          nostr.query([{ kinds: [9735], '#e': eventIds }], { signal: combinedSignal }),
        ]);

        // Calculate total zap amounts
        const zapAmounts = allZaps.map(zap => {
          const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
          if (amountTag) {
            return parseInt(amountTag) / 1000; // Convert millisats to sats
          }
          return 0;
        }).filter(amount => amount > 0);

        const totalSats = zapAmounts.reduce((sum, amount) => sum + amount, 0);
        const averageSats = zapAmounts.length > 0 ? Math.round(totalSats / zapAmounts.length) : 0;

        // Calculate per-post analytics to find top performer
        const postAnalytics = eventIds.map(eventId => {
          const postReactions = allReactions.filter(r => r.tags.some(([name, value]) => name === 'e' && value === eventId));
          const postReposts = allReposts.filter(r => r.tags.some(([name, value]) => name === 'e' && value === eventId));
          const postComments = allComments.filter(r => r.tags.some(([name, value]) => name === 'e' && value === eventId));
          const postZaps = allZaps.filter(r => r.tags.some(([name, value]) => name === 'e' && value === eventId));

          const postZapAmounts = postZaps.map(zap => {
            const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
            return amountTag ? parseInt(amountTag) / 1000 : 0;
          }).filter(amount => amount > 0);

          const postTotalSats = postZapAmounts.reduce((sum, amount) => sum + amount, 0);
          const postAverageSats = postZapAmounts.length > 0 ? Math.round(postTotalSats / postZapAmounts.length) : 0;

          const analytics: PostAnalytics = {
            likes: postReactions.length,
            reposts: postReposts.length,
            comments: postComments.length,
            zaps: {
              count: postZaps.length,
              totalSats: postTotalSats,
              averageSats: postAverageSats,
            },
          };

          // Calculate engagement score (weighted)
          const engagementScore = 
            analytics.likes * 1 + 
            analytics.reposts * 3 + 
            analytics.comments * 2 + 
            analytics.zaps.count * 5 +
            (analytics.zaps.totalSats * 0.1); // Small weight for sats

          return {
            eventId,
            analytics,
            engagementScore,
          };
        });

        // Find top performing post
        const topPost = postAnalytics.reduce((best, current) => 
          current.engagementScore > best.engagementScore ? current : best
        , postAnalytics[0]);

        const topPerformingPost = topPost ? {
          id: topPost.eventId,
          title: scheduledPublishedPosts.find(p => p.publishedEventId === topPost.eventId)?.title || 'Untitled Post',
          analytics: topPost.analytics,
          engagementScore: topPost.engagementScore,
        } : undefined;

        return {
          totalPosts: Math.max(scheduledPosts.length, allUserPosts.length),
          publishedPosts: totalPublishedPosts,
          scheduledPosts: scheduledCount,
          failedPosts: failedCount,
          totalEngagement: {
            likes: allReactions.length,
            reposts: allReposts.length,
            comments: allComments.length,
            zaps: {
              count: allZaps.length,
              totalSats,
              averageSats,
            },
          },
          topPerformingPost,
        };
      } catch (error) {
        console.warn('Failed to fetch overall analytics:', error);
        return {
          totalPosts: scheduledPosts.length,
          publishedPosts: scheduledPosts.filter(p => p.status === 'published').length,
          scheduledPosts: scheduledPosts.filter(p => p.status === 'scheduled').length,
          failedPosts: scheduledPosts.filter(p => p.status === 'failed').length,
          totalEngagement: {
            likes: 0,
            reposts: 0,
            comments: 0,
            zaps: {
              count: 0,
              totalSats: 0,
              averageSats: 0,
            },
          },
        };
      }
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });
} 