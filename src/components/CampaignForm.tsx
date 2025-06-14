import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { useCreateScheduledPostsFromCampaign, useCampaignPosts } from '@/hooks/useScheduledPosts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, X, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CampaignPostsManager } from '@/components/CampaignPostForm';
import type { Campaign, CampaignPostDraft } from '@/types/campaign';

interface CampaignFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  totalPosts: number;
  targetAudience?: string;
  tags: string[];
}

interface CampaignFormProps {
  campaign?: Campaign;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CampaignForm({ campaign, onSuccess, onCancel }: CampaignFormProps) {
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(campaign?.tags || []);
  const [startDate, setStartDate] = useState<Date | undefined>(campaign?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(campaign?.endDate);
  const [posts, setPosts] = useState<CampaignPostDraft[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  const { mutate: createCampaign, isPending: isCreating } = useCreateCampaign();
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign();
  const { mutateAsync: createScheduledPosts, isPending: isCreatingPosts } = useCreateScheduledPostsFromCampaign();
  
  // Load existing posts when editing a campaign
  const { data: existingPosts, isLoading: isLoadingPosts } = useCampaignPosts(campaign?.id);
  
  // Convert existing posts to draft format when editing
  useEffect(() => {
    if (campaign && existingPosts && existingPosts.length > 0) {
      const draftPosts: CampaignPostDraft[] = existingPosts.map((post, index) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        images: post.images || [],
        order: index,
        publishAt: post.publishAt,
      }));
      setPosts(draftPosts);
    }
  }, [campaign, existingPosts]);
  
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    defaultValues: {
      title: campaign?.title || '',
      description: campaign?.description || '',
      totalPosts: campaign?.totalPosts || 5,
      targetAudience: campaign?.targetAudience || '',
      tags: campaign?.tags || [],
    },
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setValue('tags', updatedTags);
  };

  const onSubmit = async (data: CampaignFormData) => {
    if (!startDate || !endDate) {
      return;
    }

    if (endDate <= startDate) {
      return;
    }

    try {
      if (campaign) {
        // Update existing campaign
        const updatedCampaign = {
          ...campaign,
          ...data,
          startDate,
          endDate,
          tags,
          totalPosts: data.totalPosts,
        };

        await new Promise<void>((resolve, reject) => {
          updateCampaign(updatedCampaign, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });

        // If there are posts, create them as scheduled posts for the existing campaign
        if (posts.length > 0) {
          await createScheduledPosts({
            campaignId: campaign.id,
            posts,
            startDate,
            endDate,
          });
        }
      } else {
        // Create new campaign
        const campaignId = `campaign-${Date.now()}`;
        
        const campaignData = {
          ...data,
          id: campaignId,
          startDate,
          endDate,
          tags,
          status: 'draft' as const,
          totalPosts: data.totalPosts,
        };

        // Create the campaign first
        await new Promise<void>((resolve, reject) => {
          createCampaign(campaignData, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });

        // If there are posts, create them as scheduled posts
        if (posts.length > 0) {
          await createScheduledPosts({
            campaignId,
            posts,
            startDate,
            endDate,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const canProceedToPosts = () => {
    const { title, totalPosts } = watch();
    return title && totalPosts && startDate && endDate;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="posts" disabled={!canProceedToPosts()}>
            Posts ({posts.length}/{watch('totalPosts') || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Book Launch: Nostr for Beginners"
              {...register('title', { 
                required: 'Campaign title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' }
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your campaign goals and strategy..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Total Posts */}
          <div className="space-y-2">
            <Label htmlFor="totalPosts">Number of Posts *</Label>
            <Select
              value={watch('totalPosts')?.toString()}
              onValueChange={(value) => setValue('totalPosts', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of posts" />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 7, 10, 15, 20, 25, 30].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} posts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Developers, Bitcoin enthusiasts, Content creators"
              {...register('targetAudience')}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Campaign Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Next Step */}
          {canProceedToPosts() && (
            <div className="flex justify-end pt-4 border-t">
              <Button 
                type="button" 
                onClick={() => setActiveTab('posts')}
                className="bg-primary"
              >
                Next: Create Posts →
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-6 mt-6">
          {isLoadingPosts ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading existing posts...</p>
            </div>
          ) : (
            <CampaignPostsManager
              posts={posts}
              onPostsChange={setPosts}
              totalPosts={watch('totalPosts') || 0}
              existingPostsData={existingPosts}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || isCreatingPosts || !startDate || !endDate}>
          {(isPending || isCreatingPosts) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
} 