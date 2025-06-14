import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSchedulerStatus } from '@/hooks/usePostScheduler';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { debugScheduler } from '@/lib/postScheduler';
import { RefreshCw, Bug, Clock } from 'lucide-react';

interface DebugInfo {
  isRunning: boolean;
  scheduledPostsCount: number;
  activeTimersCount: number;
  scheduledPosts: Array<{
    id: string;
    publishAt: string;
    timeUntilPublish: number;
    content: string;
  }>;
}

export function SchedulerDebugPanel() {
  const { isRunning, scheduler } = useSchedulerStatus();
  const { data: scheduledPosts = [], refetch } = useScheduledPosts();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const updateDebugInfo = useCallback(() => {
    if (scheduler) {
      setDebugInfo(scheduler.getDebugInfo());
    }
  }, [scheduler]);

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateDebugInfo]);

  const handleRefresh = () => {
    refetch();
    updateDebugInfo();
  };

  const handleConsoleDebug = () => {
    debugScheduler();
  };

  return (
    <Card className="border-dashed border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Scheduler Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? "default" : "destructive"}>
              {isRunning ? "Running" : "Stopped"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Scheduler Status
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleConsoleDebug}>
              Console Log
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Scheduled Posts:</span> {debugInfo.scheduledPostsCount}
              </div>
              <div>
                <span className="font-medium">Active Timers:</span> {debugInfo.activeTimersCount}
              </div>
            </div>

            {debugInfo.scheduledPosts.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium">Posts in Scheduler:</div>
                {debugInfo.scheduledPosts.map((post, index: number) => (
                  <div key={index} className="pl-2 border-l-2 border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono text-xs">{post.id.substring(0, 8)}...</span>
                      <Badge variant={post.timeUntilPublish <= 0 ? "destructive" : "secondary"} className="text-xs">
                        {post.timeUntilPublish <= 0 
                          ? `Overdue by ${Math.abs(Math.round(post.timeUntilPublish / 1000))}s`
                          : `In ${Math.round(post.timeUntilPublish / 1000)}s`
                        }
                      </Badge>
                    </div>
                    <div className="text-gray-600 text-xs mt-1">
                      {post.publishAt} • {post.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <div>Total scheduled posts from query: {scheduledPosts.length}</div>
          <div>
            Scheduled posts: {scheduledPosts.filter(p => p.status === 'scheduled').length} | 
            Published: {scheduledPosts.filter(p => p.status === 'published').length} | 
            Failed: {scheduledPosts.filter(p => p.status === 'failed').length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 