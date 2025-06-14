export interface Campaign {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  createdBy: string; // User's pubkey
  targetAudience?: string;
  tags: string[];
  posts: string[]; // IDs of posts in this campaign
  publishedEventId?: string; // Nostr event ID for the campaign metadata
  totalPosts: number; // Target number of posts
  completedPosts: number; // Number of posts already published
}

export interface CampaignPost {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  publishAt: Date;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  createdAt: Date;
  targetKind: number;
  images?: string[];
  publishedEventId?: string;
  error?: string;
  order: number; // Order within the campaign
}

export interface CampaignPostDraft {
  id: string;
  title: string;
  content: string;
  images?: string[];
  order: number;
  publishAt?: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalPosts: number;
  publishedPosts: number;
  totalLikes: number;
  totalReposts: number;
  totalComments: number;
  totalZaps: number;
  totalSats: number;
  averageEngagement: number;
  topPerformingPost?: {
    id: string;
    title: string;
    engagementScore: number;
  };
  engagementOverTime: Array<{
    date: string;
    likes: number;
    reposts: number;
    comments: number;
    zaps: number;
  }>;
}

export type CampaignStatus = Campaign['status'];
export type CampaignSortField = 'title' | 'startDate' | 'endDate' | 'status' | 'createdAt' | 'totalPosts'; 