import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useDeleteScheduledPost, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { X, Plus, Upload, Image as ImageIcon, GripVertical, Clock, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CampaignPostDraft } from '@/types/campaign';

interface CampaignPostFormProps {
  post: CampaignPostDraft;
  onUpdate: (post: CampaignPostDraft) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isExisting?: boolean;
  existingPostData?: ScheduledPost; // The original scheduled post data for deletion
}

export function CampaignPostForm({ 
  post, 
  onUpdate, 
  onRemove, 
  isFirst, 
  isLast, 
  onMoveUp, 
  onMoveDown,
  isExisting = false,
  existingPostData
}: CampaignPostFormProps) {
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: deleteScheduledPost, isPending: isDeleting } = useDeleteScheduledPost();

  const handleInputChange = (field: keyof CampaignPostDraft, value: string) => {
    onUpdate({
      ...post,
      [field]: value,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      const imageUrls = results.map(result => result[0][1]); // Extract URLs from NIP-94 tags
      
      onUpdate({
        ...post,
        images: [...(post.images || []), ...imageUrls],
      });
      
      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to upload images:', error);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = post.images?.filter((_, index) => index !== indexToRemove) || [];
    onUpdate({
      ...post,
      images: updatedImages.length > 0 ? updatedImages : undefined,
    });
  };

  const handleDeleteExistingPost = () => {
    if (isExisting && existingPostData) {
      deleteScheduledPost(existingPostData, {
        onSuccess: () => {
          onRemove(); // Remove from the UI
        },
      });
    } else {
      onRemove(); // Just remove from UI for new posts
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              Post #{post.order}
            </CardTitle>
            {isExisting && (
              <Badge variant="secondary" className="text-xs">
                Existing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Move buttons */}
            <div className="flex items-center gap-1">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {!isFirst && onMoveUp && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onMoveUp}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
              )}
              {!isLast && onMoveDown && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onMoveDown}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
              )}
            </div>
            
            {isExisting ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete scheduled post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the scheduled post "{post.title}" and prevent it from being published.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteExistingPost}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Post
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Title */}
        <div className="space-y-2">
          <Label htmlFor={`post-title-${post.id}`}>Post Title</Label>
          <Input
            id={`post-title-${post.id}`}
            placeholder="Enter post title..."
            value={post.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </div>

        {/* Post Content */}
        <div className="space-y-2">
          <Label htmlFor={`post-content-${post.id}`}>Content</Label>
          <Textarea
            id={`post-content-${post.id}`}
            placeholder="Write your post content..."
            rows={4}
            value={post.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
          />
          <div className="text-xs text-muted-foreground">
            {post.content.length} characters
          </div>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Images</Label>
          
          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => document.getElementById(`image-upload-${post.id}`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Add Images'}
            </Button>
            <input
              id={`image-upload-${post.id}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Image Preview */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish Date/Time */}
        <div className="space-y-2">
          <Label>Publish Date & Time (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !post.publishAt && "text-muted-foreground"
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {post.publishAt ? format(post.publishAt, "PPP 'at' p") : "Auto-schedule or pick date/time"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={post.publishAt}
                onSelect={(date) => {
                  if (date) {
                    // If no time is set, default to current time
                    const now = new Date();
                    const publishDate = new Date(date);
                    publishDate.setHours(now.getHours(), now.getMinutes());
                    onUpdate({ ...post, publishAt: publishDate });
                  } else {
                    onUpdate({ ...post, publishAt: undefined });
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              <div className="p-3 border-t">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="time"
                    value={post.publishAt ? format(post.publishAt, "HH:mm") : ""}
                    onChange={(e) => {
                      if (post.publishAt && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(post.publishAt);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        onUpdate({ ...post, publishAt: newDate });
                      }
                    }}
                    className="text-sm"
                  />
                  {post.publishAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate({ ...post, publishAt: undefined })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-schedule evenly across campaign duration
          </p>
        </div>

        {/* Post Stats */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            <ImageIcon className="h-3 w-3 mr-1" />
            {post.images?.length || 0} images
          </Badge>
          {post.publishAt && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Scheduled
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CampaignPostsManagerProps {
  posts: CampaignPostDraft[];
  onPostsChange: (posts: CampaignPostDraft[]) => void;
  totalPosts: number;
  existingPostsData?: ScheduledPost[]; // Original scheduled post data for existing posts
}

export function CampaignPostsManager({ posts, onPostsChange, totalPosts, existingPostsData = [] }: CampaignPostsManagerProps) {
  const addPost = () => {
    const newPost: CampaignPostDraft = {
      id: `post-${Date.now()}`,
      title: '',
      content: '',
      order: posts.length + 1,
    };
    onPostsChange([...posts, newPost]);
  };

  const updatePost = (index: number, updatedPost: CampaignPostDraft) => {
    const updatedPosts = [...posts];
    updatedPosts[index] = updatedPost;
    onPostsChange(updatedPosts);
  };

  const removePost = (index: number) => {
    const updatedPosts = posts.filter((_, i) => i !== index);
    // Reorder the remaining posts
    const reorderedPosts = updatedPosts.map((post, i) => ({
      ...post,
      order: i + 1,
    }));
    onPostsChange(reorderedPosts);
  };

  const movePost = (fromIndex: number, toIndex: number) => {
    const updatedPosts = [...posts];
    const [movedPost] = updatedPosts.splice(fromIndex, 1);
    updatedPosts.splice(toIndex, 0, movedPost);
    
    // Reorder all posts
    const reorderedPosts = updatedPosts.map((post, i) => ({
      ...post,
      order: i + 1,
    }));
    onPostsChange(reorderedPosts);
  };

  const canAddMore = posts.length < totalPosts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Campaign Posts</Label>
          <p className="text-sm text-muted-foreground">
            Create the posts for your campaign ({posts.length}/{totalPosts})
          </p>
        </div>
        {canAddMore && (
          <Button type="button" variant="outline" onClick={addPost}>
            <Plus className="h-4 w-4 mr-2" />
            Add Post
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground mb-4">
              No posts created yet
            </div>
            <Button type="button" variant="outline" onClick={addPost}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {posts.map((post, index) => {
            // Find the corresponding existing post data
            const existingPost = existingPostsData.find(existing => existing.id === post.id);
            const isExisting = !!existingPost;
            
            return (
              <CampaignPostForm
                key={post.id}
                post={post}
                onUpdate={(updatedPost) => updatePost(index, updatedPost)}
                onRemove={() => removePost(index)}
                isFirst={index === 0}
                isLast={index === posts.length - 1}
                onMoveUp={index > 0 ? () => movePost(index, index - 1) : undefined}
                onMoveDown={index < posts.length - 1 ? () => movePost(index, index + 1) : undefined}
                isExisting={isExisting}
                existingPostData={existingPost}
              />
            );
          })}
        </div>
      )}

      {!canAddMore && posts.length < totalPosts && (
        <div className="text-center text-sm text-muted-foreground">
          You've reached the maximum number of posts for this campaign.
        </div>
      )}
    </div>
  );
} 