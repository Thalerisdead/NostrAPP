import React from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCampaignPosts } from '@/hooks/useScheduledPosts';

const statusConfig = {
  scheduled: {
    icon: Clock,
    color: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
    label: 'Scheduled',
  },
  published: {
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
    label: 'Published',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
    label: 'Failed',
  },
  cancelled: {
    icon: AlertCircle,
    color: 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20',
    label: 'Cancelled',
  },
} as const;

interface CampaignPostsListProps {
  campaignId: string;
}

export function CampaignPostsList({ campaignId }: CampaignPostsListProps) {
  const { data: posts, isLoading, error } = useCampaignPosts(campaignId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load campaign posts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No posts created for this campaign yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Campaign Posts ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => {
          const config = statusConfig[post.status];
          const Icon = config.icon;
          const isScheduled = post.status === 'scheduled';
          const isPastDue = isScheduled && post.publishAt < new Date();

          return (
            <div
              key={post.id}
              className={`p-4 border rounded-lg space-y-3 ${
                isPastDue ? 'bg-orange-50/50 border-orange-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate" title={post.title}>
                    {post.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2" title={post.content}>
                    {post.content}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <Badge variant="secondary" className={config.color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {isPastDue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Past Due
                    </Badge>
                  )}
                </div>
              </div>

              {post.images && post.images.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Image className="h-3 w-3" />
                  {post.images.length} image{post.images.length !== 1 ? 's' : ''}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {post.publishAt.toLocaleDateString()} at{' '}
                    {post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {isScheduled && (
                  <div className="text-xs">
                    {post.publishAt > new Date()
                      ? `in ${Math.ceil((post.publishAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                      : 'Past due'}
                  </div>
                )}
              </div>

              {post.error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {post.error}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 