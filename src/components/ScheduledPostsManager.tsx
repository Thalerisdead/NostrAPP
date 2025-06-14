import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useSchedulePost } from '@/hooks/useSchedulePost';
import { useSchedulerStatus } from '@/hooks/usePostScheduler';
import { SchedulePostDialog } from './SchedulePostDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export function ScheduledPostsManager() {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [previewPost, setPreviewPost] = useState<{ title: string; content: string; publishAt: Date; images?: string[] } | null>(null);
  const { data: scheduledPosts = [], isLoading, error, refetch: refetchScheduledPosts } = useScheduledPosts();
  const { cancelScheduledPost, isCancelling } = useSchedulePost();
  const { isRunning: isSchedulerRunning } = useSchedulerStatus();

  // Refetch scheduled posts when component mounts to ensure fresh data
  useEffect(() => {
    refetchScheduledPosts();
  }, [refetchScheduledPosts]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      return 'Past due';
    }

    if (diffMins < 60) {
      return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }

    if (diffHours < 24) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  const handleCancelPost = async (post: { id: string; title: string; publishAt: Date; targetKind: number; createdAt: Date }) => {
    try {
      await cancelScheduledPost.mutateAsync({
        id: post.id,
        title: post.title,
        publishAt: post.publishAt,
        targetKind: post.targetKind,
        createdAt: post.createdAt,
      });
    } catch (error) {
      console.error('Failed to cancel post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Failed to load scheduled posts</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Posts</h2>
          <p className="text-muted-foreground">
            Manage your scheduled posts. 
            {isSchedulerRunning ? (
              <span className="text-green-600 ml-1">Scheduler is running</span>
            ) : (
              <span className="text-orange-600 ml-1">Scheduler is stopped</span>
            )}
          </p>
        </div>
        
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      {scheduledPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No scheduled posts</h3>
            <p className="text-muted-foreground mb-4">
              Schedule your first post to get started with automated publishing.
            </p>
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scheduledPosts.map((post) => {
            const config = statusConfig[post.status];
            const Icon = config.icon;
            const isScheduled = post.status === 'scheduled';
            const isPastDue = isScheduled && post.publishAt < new Date();

            return (
              <Card key={post.id} className={isPastDue ? 'border-orange-200 bg-orange-50/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        
                        {isScheduled && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatRelativeTime(post.publishAt)}
                          </Badge>
                        )}
                        
                        {isPastDue && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Past Due
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{post.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content || 'No content'}
                        </p>
                        
                        {post.images && post.images.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Image className="h-3 w-3" />
                            <span>{post.images.length} image{post.images.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <strong>Publish at:</strong> {post.publishAt.toLocaleString()}
                        </p>
                        <p>
                          <strong>Created:</strong> {post.createdAt.toLocaleString()}
                        </p>
                        {post.error && (
                          <p className="text-destructive">
                            <strong>Error:</strong> {post.error}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewPost({ 
                          title: post.title, 
                          content: post.content, 
                          publishAt: post.publishAt,
                          images: post.images 
                        })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {isScheduled && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={isCancelling}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel scheduled post?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel the scheduled post and prevent it from being published.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelPost(post)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Cancel Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SchedulePostDialog
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
      />

      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewPost?.title || 'Post Preview'}</DialogTitle>
            <DialogDescription>
              {previewPost && `Scheduled for ${previewPost.publishAt.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{previewPost?.content}</p>
            </div>
            
            {previewPost?.images && previewPost.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Images ({previewPost.images.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {previewPost.images.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        console.error('Failed to load image:', imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 