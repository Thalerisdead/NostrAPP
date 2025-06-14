import React from 'react';
import { BarChart3, TrendingUp, Calendar, Zap, Heart, Repeat2, MessageCircle, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';
import { PostAnalytics } from '@/components/PostAnalytics';
import { RelaySelector } from '@/components/RelaySelector';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOverallAnalytics } from '@/hooks/useOverallAnalytics';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { cn } from '@/lib/utils';

export function AnalyticsPage() {
  const { user } = useCurrentUser();
  const { data: analytics, isLoading: analyticsLoading } = useOverallAnalytics();
  const { data: scheduledPosts = [] } = useScheduledPosts();

  if (!user) {
    return (
      <div>
        <PageHeader 
          title="Analytics" 
          description="Track your Nostr post performance and engagement metrics"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Analytics' }
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground mb-6">
                  Please log in to view your post performance metrics
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const publishedPosts = scheduledPosts.filter(post => 
    post.status === 'published' && post.publishedEventId
  );

  return (
    <div>
      <PageHeader 
        title="Analytics" 
        description="Track your Nostr post performance and engagement metrics"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Analytics' }
        ]}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Total Posts"
              value={analytics?.totalPosts ?? 0}
              icon={Calendar}
              color="text-blue-500"
              bgColor="bg-blue-50"
              isLoading={analyticsLoading}
            />
            <OverviewCard
              title="Published"
              value={analytics?.publishedPosts ?? 0}
              icon={CheckCircle}
              color="text-green-500"
              bgColor="bg-green-50"
              isLoading={analyticsLoading}
            />
            <OverviewCard
              title="Scheduled"
              value={analytics?.scheduledPosts ?? 0}
              icon={Clock}
              color="text-yellow-500"
              bgColor="bg-yellow-50"
              isLoading={analyticsLoading}
            />
            <OverviewCard
              title="Failed"
              value={analytics?.failedPosts ?? 0}
              icon={XCircle}
              color="text-red-500"
              bgColor="bg-red-50"
              isLoading={analyticsLoading}
            />
          </div>

          {/* Engagement Overview */}
          {analytics && analytics.publishedPosts > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Total Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg border">
                    <Heart className="h-6 w-6 text-red-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalEngagement.likes}</div>
                    <div className="text-sm text-muted-foreground">Total Likes</div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg border">
                    <Repeat2 className="h-6 w-6 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalEngagement.reposts}</div>
                    <div className="text-sm text-muted-foreground">Total Reposts</div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border">
                    <MessageCircle className="h-6 w-6 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalEngagement.comments}</div>
                    <div className="text-sm text-muted-foreground">Total Comments</div>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg border">
                    <Zap className="h-6 w-6 text-yellow-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalEngagement.zaps.count}</div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.totalEngagement.zaps.totalSats} sats
                    </div>
                    <div className="text-xs text-muted-foreground">Total Zaps</div>
                  </div>
                </div>
                
                {analytics.totalEngagement.zaps.averageSats > 0 && (
                  <div className="mt-4 pt-4 border-t text-center">
                    <div className="text-sm text-muted-foreground">
                      Average zap amount: <span className="font-medium">{analytics.totalEngagement.zaps.averageSats} sats</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Performing Post */}
          {analytics && analytics.topPerformingPost && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{analytics.topPerformingPost.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      Engagement Score: {Math.round(analytics.topPerformingPost.engagementScore)}
                    </Badge>
                  </div>
                  <PostAnalytics 
                    eventId={analytics.topPerformingPost.id} 
                    showTitle={false}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State for No Published Posts */}
          {publishedPosts.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No Published Posts Yet</h3>
                    <p className="text-muted-foreground">
                      Publish some posts to see your analytics here. Try switching relays to discover more engagement.
                    </p>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface OverviewCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  isLoading: boolean;
}

function OverviewCard({ title, value, icon: Icon, color, bgColor, isLoading }: OverviewCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

 