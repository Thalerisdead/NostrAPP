import type { NostrEvent } from '@nostrify/nostrify';
import type { NUser } from '@nostrify/react/login';

export interface ScheduledPostEvent {
  id: string;
  publishAt: Date;
  content: string;
  targetKind: number;
  images?: string[];
  event: NostrEvent;
}

// Global set to track posts being published across all scheduler instances
const globalPublishingPosts = new Set<string>();

export class PostScheduler {
  private timers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private scheduledPosts: ScheduledPostEvent[] = [];
  private publishingPosts = new Set<string>(); // Track posts currently being published

  constructor(
    private user: NUser,
    private publishEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>,
    private updateScheduledPost: (data: { id: string; status: 'published' | 'failed'; publishedEventId?: string; error?: string; publishAt?: Date; targetKind?: number; createdAt?: Date }) => Promise<void>
  ) {}

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Clear any leftover state from previous sessions
    this.clearStaleState();
    
    // Check for posts to publish every 30 seconds for better responsiveness
    this.checkInterval = setInterval(() => {
      this.checkForPostsToPublish();
    }, 30000);
    
    // Also check immediately when starting
    this.checkForPostsToPublish();
    
    console.log('Post scheduler started');
  }

  private clearStaleState() {
    // Clear all existing timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear publishing state only for this instance
    this.publishingPosts.clear();
    
    // Clear global publishing state only after 5 minutes to prevent immediate re-publishing
    setTimeout(() => {
      console.log('Clearing global publishing state after delay');
      globalPublishingPosts.clear();
    }, 5 * 60 * 1000);
    
    console.log('Cleared stale scheduler state');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Clear publishing state
    this.publishingPosts.clear();
    
    console.log('Post scheduler stopped');
  }

  schedulePost(scheduledPost: ScheduledPostEvent) {
    const now = Date.now();
    const publishTime = scheduledPost.publishAt.getTime();
    
    // If the post should have been published already, publish it immediately
    if (publishTime <= now) {
      this.publishPost(scheduledPost);
      return;
    }
    
    // Schedule the post for the future
    const delay = publishTime - now;
    
    // Clear any existing timer for this post
    const existingTimer = this.timers.get(scheduledPost.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.publishPost(scheduledPost);
      this.timers.delete(scheduledPost.id);
    }, delay);
    
    this.timers.set(scheduledPost.id, timer);
    
    console.log(`Scheduled post ${scheduledPost.id} to publish at ${scheduledPost.publishAt.toISOString()}`);
  }

  unschedulePost(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
      console.log(`Unscheduled post ${id}`);
    }
  }

  private async publishPost(scheduledPost: ScheduledPostEvent) {
    const postId = scheduledPost.id;
    
    // CRITICAL: Check if this post was already published successfully
    // This prevents the same post from being published multiple times
    if (globalPublishingPosts.has(postId)) {
      console.log(`Post ${postId} is already being processed globally, skipping`);
      return;
    }
    
    if (this.publishingPosts.has(postId)) {
      console.log(`Post ${postId} is already being processed locally, skipping`);
      return;
    }
    
    // Mark as being published IMMEDIATELY to prevent race conditions
    globalPublishingPosts.add(postId);
    this.publishingPosts.add(postId);
    
    // Remove from scheduled list IMMEDIATELY so it won't be picked up again
    this.scheduledPosts = this.scheduledPosts.filter(p => p.id !== postId);
    
    // Clear any timer for this post
    const timer = this.timers.get(postId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(postId);
    }
    
    console.log(`Starting to publish post ${postId}`);
    
    try {
      console.log(`Publishing scheduled post ${scheduledPost.id}`);
      
      // Prepare content with images appended
      let content = scheduledPost.content;
      const tags: string[][] = [];
      
      // Add images to content and create imeta tags
      if (scheduledPost.images && scheduledPost.images.length > 0) {
        console.log(`Adding ${scheduledPost.images.length} images to post ${scheduledPost.id}`);
        
        // Append image URLs to content
        const imageUrls = scheduledPost.images.join('\n\n');
        content = scheduledPost.content + (scheduledPost.content ? '\n\n' : '') + imageUrls;
        
        // Create imeta tags for each image
        scheduledPost.images.forEach(imageUrl => {
          tags.push(['imeta', `url ${imageUrl}`]);
        });
      }
      
      // Create the actual post event
      const publishedEvent = await this.publishEvent({
        kind: scheduledPost.targetKind,
        content,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      // Update the scheduled post status to published
      await this.updateScheduledPost({
        id: scheduledPost.id,
        status: 'published',
        publishedEventId: publishedEvent.id,
        publishAt: scheduledPost.publishAt,
        targetKind: scheduledPost.targetKind,
        createdAt: new Date(), // Use current time for created_at of the status update
      });
      
      console.log(`Successfully published scheduled post ${scheduledPost.id} as event ${publishedEvent.id}`);
      
    } catch (error) {
      console.error(`Failed to publish scheduled post ${scheduledPost.id}:`, error);
      
      // Update the scheduled post status to failed
      await this.updateScheduledPost({
        id: scheduledPost.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        publishAt: scheduledPost.publishAt,
        targetKind: scheduledPost.targetKind,
        createdAt: new Date(), // Use current time for created_at of the status update
      });
      
      // Don't retry failed posts automatically to prevent duplicates
      console.log(`Post ${scheduledPost.id} failed and will not be retried automatically`);
    } finally {
      // IMPORTANT: Do NOT remove from global/local sets here
      // This would allow the same post to be published again
      // Only remove when the scheduler is reset or after a long delay
      
      console.log(`Finished processing post ${postId} - keeping in published set to prevent duplicates`);
    }
  }

  private async checkForPostsToPublish() {
    if (!this.isRunning || this.scheduledPosts.length === 0) {
      return;
    }

    const now = Date.now();
    console.log(`Checking ${this.scheduledPosts.length} scheduled posts for publishing...`);

    // Find posts that should be published now (excluding those already being published globally or locally)
    const postsToPublish = this.scheduledPosts.filter(post => {
      const publishTime = post.publishAt.getTime();
      const isBeingPublished = this.publishingPosts.has(post.id) || globalPublishingPosts.has(post.id);
      const shouldPublish = publishTime <= now && !isBeingPublished;
      
      if (publishTime <= now && isBeingPublished) {
        console.log(`Post ${post.id} is ready but already being published (global: ${globalPublishingPosts.has(post.id)}, local: ${this.publishingPosts.has(post.id)}), skipping`);
      } else if (shouldPublish) {
        console.log(`Post ${post.id} is ready to publish (scheduled: ${post.publishAt.toISOString()}, now: ${new Date().toISOString()})`);
      }
      
      return shouldPublish;
    });

    // Publish each post that's ready
    for (const post of postsToPublish) {
      // Clear any existing timer
      const timer = this.timers.get(post.id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(post.id);
      }
      
      // Publish the post (it will handle removal from scheduledPosts internally)
      await this.publishPost(post);
    }
  }

  // Update scheduled posts
  updateScheduledPosts(scheduledPosts: ScheduledPostEvent[]) {
    // Update the internal list of scheduled posts
    this.scheduledPosts = [...scheduledPosts];
    
    console.log(`Updated scheduler with ${scheduledPosts.length} scheduled posts:`, 
      scheduledPosts.map(p => ({ id: p.id, publishAt: p.publishAt.toISOString(), content: p.content.substring(0, 50) + '...' }))
    );
    
    // Clear timers for posts that are no longer scheduled
    const currentIds = new Set(scheduledPosts.map(p => p.id));
    for (const [id, timer] of this.timers.entries()) {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        this.timers.delete(id);
        console.log(`Cleared timer for removed post ${id}`);
      }
    }
    
    // Schedule new/updated posts and handle overdue posts
    const now = Date.now();
    for (const post of scheduledPosts) {
      const publishTime = post.publishAt.getTime();
      const timeUntilPublish = publishTime - now;
      
      const isBeingPublished = this.publishingPosts.has(post.id) || globalPublishingPosts.has(post.id);
      
      if (publishTime <= now && !isBeingPublished) {
        // Post is overdue and not already being published, publish immediately
        console.log(`Post ${post.id} is overdue by ${Math.abs(timeUntilPublish)}ms, publishing immediately`);
        this.publishPost(post);
      } else if (publishTime > now) {
        // Post is in the future, schedule it
        console.log(`Scheduling post ${post.id} to publish in ${timeUntilPublish}ms (${Math.round(timeUntilPublish / 1000)}s)`);
        this.schedulePost(post);
      } else {
        console.log(`Post ${post.id} is overdue but already being published (global: ${globalPublishingPosts.has(post.id)}, local: ${this.publishingPosts.has(post.id)}), skipping`);
      }
    }
    
    // Also trigger an immediate check for posts to publish
    this.checkForPostsToPublish();
  }

  // Debug method to get current state
  getDebugInfo() {
    return {
      isRunning: this.isRunning,
      scheduledPostsCount: this.scheduledPosts.length,
      activeTimersCount: this.timers.size,
      publishingPostsCount: this.publishingPosts.size,
      publishingPosts: Array.from(this.publishingPosts),
      scheduledPosts: this.scheduledPosts.map(p => ({
        id: p.id,
        publishAt: p.publishAt.toISOString(),
        timeUntilPublish: p.publishAt.getTime() - Date.now(),
        content: p.content.substring(0, 50) + '...',
        hasImages: !!(p.images && p.images.length > 0),
        imageCount: p.images?.length || 0
      }))
    };
  }
}

// Global scheduler instance
let globalScheduler: PostScheduler | null = null;

export function getScheduler(): PostScheduler | null {
  return globalScheduler;
}

export function setScheduler(scheduler: PostScheduler | null): void {
  globalScheduler = scheduler;
}

// Debug function for troubleshooting
export function debugScheduler(): void {
  if (globalScheduler) {
    console.log('Scheduler Debug Info:', globalScheduler.getDebugInfo());
  } else {
    console.log('No scheduler instance found');
  }
}

// Make debug function available globally for easy access
if (typeof window !== 'undefined') {
  (window as typeof window & { debugScheduler: typeof debugScheduler }).debugScheduler = debugScheduler;
} 