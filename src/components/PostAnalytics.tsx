import React from 'react';
import { Heart, Repeat2, MessageCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostAnalytics } from '@/hooks/usePostAnalytics';
import { cn } from '@/lib/utils';

interface PostAnalyticsProps {
  eventId: string;
  className?: string;
  showTitle?: boolean;
}

export function PostAnalytics({ eventId, className, showTitle = true }: PostAnalyticsProps) {
  const { data: analytics, isLoading, error } = usePostAnalytics(eventId);

  if (isLoading) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post Analytics</CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? "pt-0" : "p-4"}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3 space-y-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post Analytics</CardTitle>
          </CardHeader>
        )}
        <CardContent className={showTitle ? "pt-0" : "p-4"}>
          <div className="text-center text-muted-foreground py-4">
            <p className="text-sm">Unable to load analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Likes',
      value: analytics.likes,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Reposts',
      value: analytics.reposts,
      icon: Repeat2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Comments',
      value: analytics.comments,
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Zaps',
      value: analytics.zaps.count,
      subValue: analytics.zaps.totalSats > 0 ? `${analytics.zaps.totalSats} sats` : undefined,
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Post Analytics</CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "pt-0" : "p-4"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ label, value, subValue, icon: Icon, color, bgColor }) => (
            <div 
              key={label} 
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border",
                bgColor
              )}
            >
              <Icon className={cn("h-5 w-5 mb-2", color)} />
              <div className="text-lg font-semibold text-center">{value}</div>
              {subValue && (
                <div className="text-xs text-muted-foreground text-center">{subValue}</div>
              )}
              <div className="text-xs text-muted-foreground text-center mt-1">{label}</div>
            </div>
          ))}
        </div>
        
        {analytics.zaps.count > 0 && analytics.zaps.averageSats > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Average zap: <span className="font-medium">{analytics.zaps.averageSats} sats</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 