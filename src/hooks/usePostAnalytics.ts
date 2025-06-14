import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export interface PostAnalytics {
  likes: number;
  reposts: number;
  comments: number;
  zaps: {
    count: number;
    totalSats: number;
    averageSats: number;
  };
}

export function usePostAnalytics(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<PostAnalytics>({
    queryKey: ['post-analytics', eventId],
    queryFn: async ({ signal }) => {
      if (!eventId) {
        return {
          likes: 0,
          reposts: 0,
          comments: 0,
          zaps: {
            count: 0,
            totalSats: 0,
            averageSats: 0,
          },
        };
      }

      const timeoutSignal = AbortSignal.timeout(3000);
      const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

      try {
        // Fetch all analytics data in parallel for better performance
        const [reactions, reposts, comments, zaps] = await Promise.all([
          // Fetch reactions (likes) - kind 7
          nostr.query([{ kinds: [7], '#e': [eventId] }], { signal: combinedSignal }),
          
          // Fetch reposts - kind 6
          nostr.query([{ kinds: [6], '#e': [eventId] }], { signal: combinedSignal }),
          
          // Fetch comments (replies) - kind 1 with e tag
          nostr.query([{ kinds: [1], '#e': [eventId] }], { signal: combinedSignal }),
          
          // Fetch zaps - kind 9735
          nostr.query([{ kinds: [9735], '#e': [eventId] }], { signal: combinedSignal }),
        ]);

        // Calculate zap amounts
        const zapAmounts = zaps.map(zap => {
          // Try to get amount from bolt11 tag or amount tag
          const amountTag = zap.tags.find(([name]) => name === 'amount')?.[1];
          if (amountTag) {
            // Amount is in millisats, convert to sats
            return parseInt(amountTag) / 1000;
          }
          
          // Fallback: try to parse bolt11 for amount (basic implementation)
          const bolt11Tag = zap.tags.find(([name]) => name === 'bolt11')?.[1];
          if (bolt11Tag) {
            // This is a simplified bolt11 parsing - in production you'd use a proper library
            const match = bolt11Tag.match(/(\d+)[mn]?$/);
            if (match) {
              const amount = parseInt(match[1]);
              // Assume it's in sats if no unit specified
              return amount;
            }
          }
          
          return 0;
        }).filter(amount => amount > 0);

        const totalSats = zapAmounts.reduce((sum, amount) => sum + amount, 0);
        const averageSats = zapAmounts.length > 0 ? Math.round(totalSats / zapAmounts.length) : 0;

        return {
          likes: reactions.length,
          reposts: reposts.length,
          comments: comments.length,
          zaps: {
            count: zaps.length,
            totalSats,
            averageSats,
          },
        };
      } catch (error) {
        console.warn('Failed to fetch post analytics:', error);
        // Return empty analytics on error
        return {
          likes: 0,
          reposts: 0,
          comments: 0,
          zaps: {
            count: 0,
            totalSats: 0,
            averageSats: 0,
          },
        };
      }
    },
    enabled: !!eventId,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  });
} 