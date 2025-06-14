import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Campaign } from '@/types/campaign';
import { NostrEvent } from '@nostrify/nostrify';

// Campaign kind - using 30402 for addressable campaign events
const CAMPAIGN_KIND = 30402;

// Convert Nostr event to Campaign object
function eventToCampaign(event: NostrEvent): Campaign | null {
  try {
    const d = event.tags.find(([name]) => name === 'd')?.[1];
    const title = event.tags.find(([name]) => name === 'title')?.[1];
    const description = event.tags.find(([name]) => name === 'description')?.[1];
    const start = event.tags.find(([name]) => name === 'start')?.[1];
    const end = event.tags.find(([name]) => name === 'end')?.[1];
    const status = event.tags.find(([name]) => name === 'status')?.[1] as Campaign['status'];
    const targetAudience = event.tags.find(([name]) => name === 'audience')?.[1];
    const totalPosts = parseInt(event.tags.find(([name]) => name === 'total_posts')?.[1] || '0');
    const completedPosts = parseInt(event.tags.find(([name]) => name === 'completed_posts')?.[1] || '0');

    if (!d || !title || !start || !end || !status) {
      return null;
    }

    const tags = event.tags
      .filter(([name]) => name === 't')
      .map(([, value]) => value)
      .filter(Boolean);

    const posts = event.tags
      .filter(([name]) => name === 'post')
      .map(([, value]) => value)
      .filter(Boolean);

    return {
      id: d,
      title,
      description: description || '',
      startDate: new Date(parseInt(start) * 1000),
      endDate: new Date(parseInt(end) * 1000),
      status,
      createdAt: new Date(event.created_at * 1000),
      createdBy: event.pubkey,
      targetAudience,
      tags,
      posts,
      publishedEventId: event.id,
      totalPosts,
      completedPosts,
    };
  } catch (error) {
    console.error('Error converting event to campaign:', error);
    return null;
  }
}

// Convert Campaign object to Nostr event tags
function campaignToTags(campaign: Omit<Campaign, 'createdAt' | 'publishedEventId'>): string[][] {
  const tags: string[][] = [
    ['d', campaign.id],
    ['title', campaign.title],
    ['description', campaign.description],
    ['start', Math.floor(campaign.startDate.getTime() / 1000).toString()],
    ['end', Math.floor(campaign.endDate.getTime() / 1000).toString()],
    ['status', campaign.status],
    ['total_posts', campaign.totalPosts.toString()],
    ['completed_posts', campaign.completedPosts.toString()],
  ];

  if (campaign.targetAudience) {
    tags.push(['audience', campaign.targetAudience]);
  }

  // Add campaign tags
  campaign.tags.forEach(tag => {
    tags.push(['t', tag]);
  });

  // Add post references
  campaign.posts.forEach(postId => {
    tags.push(['post', postId]);
  });

  return tags;
}

export function useCampaigns() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['campaigns', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query([
        {
          kinds: [CAMPAIGN_KIND],
          authors: [user.pubkey],
        }
      ], { signal });

      const campaigns = events
        .map(eventToCampaign)
        .filter((campaign): campaign is Campaign => campaign !== null)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return campaigns;
    },
    enabled: !!user?.pubkey,
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateCampaign() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'createdAt' | 'createdBy' | 'publishedEventId' | 'posts' | 'completedPosts'>) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to create campaigns');
      }

      const campaign: Omit<Campaign, 'createdAt' | 'publishedEventId'> = {
        ...campaignData,
        createdBy: user.pubkey,
        posts: [],
        completedPosts: 0,
      };

      const tags = campaignToTags(campaign);

      const event = await user.signer.signEvent({
        kind: CAMPAIGN_KIND,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);
      return { ...campaign, publishedEventId: event.id, createdAt: new Date() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: Campaign) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to update campaigns');
      }

      const tags = campaignToTags(campaign);

      const event = await user.signer.signEvent({
        kind: CAMPAIGN_KIND,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);
      return { ...campaign, publishedEventId: event.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to delete campaigns');
      }

      // Create a deletion event by setting status to 'cancelled'
      const tags = [
        ['d', campaignId],
        ['status', 'cancelled'],
      ];

      const event = await user.signer.signEvent({
        kind: CAMPAIGN_KIND,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);
      return campaignId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
} 