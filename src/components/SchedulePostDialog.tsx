import React, { useState } from 'react';
import { Calendar, Clock, Send, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSchedulePost } from '@/hooks/useSchedulePost';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { toast } from '@/hooks/useToast';

interface SchedulePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulePostDialog({ isOpen, onClose }: SchedulePostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { user } = useCurrentUser();
  const { createScheduledPost, isCreating } = useSchedulePost();
  const { mutateAsync: uploadFile } = useUploadFile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some content for your post.',
        variant: 'destructive',
      });
      return;
    }

    if (!publishDate || !publishTime) {
      toast({
        title: 'Schedule required',
        description: 'Please select a date and time to publish your post.',
        variant: 'destructive',
      });
      return;
    }

    // Combine date and time
    const publishAt = new Date(`${publishDate}T${publishTime}`);
    
    // Check if the date is in the future
    if (publishAt <= new Date()) {
      toast({
        title: 'Invalid date',
        description: 'Please select a future date and time.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createScheduledPost.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        publishAt,
        targetKind: 1, // Text note
        images: images.length > 0 ? images : undefined,
      });
      
      // Reset form and close dialog
      setTitle('');
      setContent('');
      setImages([]);
      setPublishDate('');
      setPublishTime('');
      onClose();
    } catch (error) {
      // Error is handled by the hook
      console.error('Failed to schedule post:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const [[, url]] = await uploadFile(file);
      setImages(prev => [...prev, url]);
      toast({
        title: 'Image uploaded',
        description: 'Image has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinTime = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // If selected date is today, set minimum time to current time + 1 minute
    if (publishDate === today) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes() + 1).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return '00:00';
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Post
          </DialogTitle>
          <DialogDescription>
            Write your post and choose when to publish it. Your content will be encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Post Title</Label>
            <Input
              id="title"
              placeholder="Give your post a title for organization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This title is for your organization only and won't be published
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-y min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              {content.length} characters • No limit
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploadingImage}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  {isUploadingImage ? 'Uploading...' : 'Add Image'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Max 10MB • JPG, PNG, GIF, WebP
                </span>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
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
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule</CardTitle>
              <CardDescription>
                Choose when to publish your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    min={getMinDateTime()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    min={getMinTime()}
                  />
                </div>
              </div>

              {publishDate && publishTime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Will publish:</strong>{' '}
                    {new Date(`${publishDate}T${publishTime}`).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                'Scheduling...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Schedule Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 