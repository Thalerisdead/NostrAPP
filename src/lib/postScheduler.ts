import type { NostrEvent } from '@nostrify/nostrify';
import type { NUser } from '@nostrify/react/login';

export interface ScheduledPostEvent {
  id: string;
  publishAt: Date;
  content: string;
  targetKind: number;
  images?: string[];
  event: NostrEvent;
  title?: string;
}

export class PostScheduler {
  private timers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private scheduledPosts: ScheduledPostEvent[] = [];
  private publishingPosts = new Set<string>(); // Track posts currently being published
  private instanceId: number;

  constructor(
    private user: NUser,
    private publishEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>,
    private updateScheduledPost: (data: { id: string; status: 'published' | 'failed'; publishedEventId?: string; error?: string; publishAt?: Date; targetKind?: number; createdAt?: Date; title?: string }) => Promise<void>
  ) {
    this.instanceId = ++schedulerInstanceCount;
    console.log(`[SCHEDULER_CREATE] Created scheduler instance #${this.instanceId} for user ${user.pubkey.slice(0, 8)}`);
  }

  start() {
    if (this.isRunning) {
      console.log(`[SCHEDULER_ALREADY_RUNNING] Scheduler instance #${this.instanceId} is already running`);
      return;
    }

    this.isRunning = true;
    console.log(`[SCHEDULER_START] Starting scheduler instance #${this.instanceId} for user ${this.user.pubkey.slice(0, 8)}`);

    // Start periodic checking every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkForPostsToPublish();
    }, 30 * 1000);

    console.log(`[SCHEDULER_STARTED] Scheduler instance #${this.instanceId} started`);
  }

  stop() {
    if (!this.isRunning) return;
    
    console.log(`[SCHEDULER_STOP] Stopping scheduler instance #${this.instanceId}`);
    
    this.isRunning = false;
    
    // Clear the check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // Clear publishing set
    this.publishingPosts.clear();
    
    console.log(`[SCHEDULER_STOPPED] Scheduler instance #${this.instanceId} stopped`);
  }

  schedulePost(scheduledPost: ScheduledPostEvent) {
    // Clear any existing timer for this post
    this.unschedulePost(scheduledPost.id);
    
    const now = Date.now();
    const publishTime = scheduledPost.publishAt.getTime();
    const delay = publishTime - now;
    
    console.log(`[SCHEDULE_POST] Instance #${this.instanceId}: Scheduling post ${scheduledPost.id} with delay ${delay}ms`);
    
    if (delay <= 0) {
      // Post should be published immediately
      console.log(`[SCHEDULE_IMMEDIATE] Instance #${this.instanceId}: Publishing post ${scheduledPost.id} immediately (overdue)`);
      this.publishPost(scheduledPost);
      return;
    }
    
    // Set new timer with safety check
    const timer = setTimeout(() => {
      console.log(`[TIMER_FIRE] Instance #${this.instanceId}: Timer fired for post ${scheduledPost.id}`);
      // Double-check that the post still exists before publishing
      const stillExists = this.scheduledPosts.some(p => p.id === scheduledPost.id);
      if (stillExists) {
        console.log(`[TIMER_PUBLISH] Instance #${this.instanceId}: Post ${scheduledPost.id} still exists, calling publishPost`);
        this.publishPost(scheduledPost);
      } else {
        console.log(`[TIMER_SKIP] Instance #${this.instanceId}: Post ${scheduledPost.id} no longer exists, skipping`);
      }
      this.timers.delete(scheduledPost.id);
    }, delay);
    
    this.timers.set(scheduledPost.id, timer);
    
    console.log(`[SCHEDULE_TIMER] Instance #${this.instanceId}: Scheduled post ${scheduledPost.id} to publish at ${scheduledPost.publishAt.toISOString()}`);
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
    // Global deduplication check - first line of defense
    if (isRecentlyPublished(scheduledPost.id)) {
      console.log(`[GLOBAL_BLOCKED] Blocking duplicate publish attempt for post ${scheduledPost.id}`);
      return;
    }

    // Safety check: ensure this post isn't already being published
    if (this.publishingPosts.has(scheduledPost.id)) {
      console.log(`[DUPLICATE] Post ${scheduledPost.id} is already being published - ignoring duplicate request`);
      return;
    }

    // Safety check: ensure this post hasn't already been published
    const postIndex = this.scheduledPosts.findIndex(p => p.id === scheduledPost.id);
    if (postIndex === -1) {
      console.log(`[ALREADY_PUBLISHED] Post ${scheduledPost.id} not found in scheduled posts - already published or removed`);
      return;
    }

    console.log(`[PUBLISHING] Instance #${this.instanceId}: Starting to publish post ${scheduledPost.id}`);

    // Mark as being published globally
    markAsPublished(scheduledPost.id);

    // Add to publishing set to prevent duplicates
    this.publishingPosts.add(scheduledPost.id);

    // Remove the post from scheduled posts immediately to prevent double publishing
    this.scheduledPosts.splice(postIndex, 1);
    
    // Clear any existing timer for this post
    const timer = this.timers.get(scheduledPost.id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduledPost.id);
    }

    try {
      // Prepare content and tags for the published event
      let finalContent = scheduledPost.content;
      const tags: string[][] = [];
      
      // Add images to content and create imeta tags if any
      if (scheduledPost.images && scheduledPost.images.length > 0) {
        // Add images to the end of the content
        finalContent = scheduledPost.content + '\n\n' + scheduledPost.images.join('\n');
        
        // Create imeta tags for each image (NIP-92)
        scheduledPost.images.forEach(imageUrl => {
          tags.push(['imeta', `url ${imageUrl}`]);
        });
      }
      
      // Create the actual post event
      console.log(`[PUBLISH_EVENT] Instance #${this.instanceId}: Creating Nostr event for post ${scheduledPost.id}`);
      const publishedEvent = await this.publishEvent({
        kind: scheduledPost.targetKind,
        content: finalContent,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      console.log(`[PUBLISH_SUCCESS] Instance #${this.instanceId}: Published Nostr event ${publishedEvent.id} for post ${scheduledPost.id}`);
      
      // Update the scheduled post status to published
      await this.updateScheduledPost({
        id: scheduledPost.id,
        status: 'published',
        publishedEventId: publishedEvent.id,
        publishAt: scheduledPost.publishAt,
        targetKind: scheduledPost.targetKind,
        createdAt: new Date(), // Use current time for created_at of the status update
        title: scheduledPost.title,
      });
      
      console.log(`[COMPLETE] Instance #${this.instanceId}: Successfully published scheduled post ${scheduledPost.id} as event ${publishedEvent.id}`);
      
    } catch (error) {
      console.error(`[ERROR] Instance #${this.instanceId}: Failed to publish scheduled post ${scheduledPost.id}:`, error);
      
      // Update the scheduled post status to failed
      await this.updateScheduledPost({
        id: scheduledPost.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        publishAt: scheduledPost.publishAt,
        targetKind: scheduledPost.targetKind,
        createdAt: new Date(), // Use current time for created_at of the status update
        title: scheduledPost.title,
      });
      
      // Retry after 5 minutes - but only if the post hasn't been published by another mechanism
      setTimeout(() => {
        // Don't retry if it's already been processed
        if (!this.publishingPosts.has(scheduledPost.id)) {
          console.log(`[RETRY_EXECUTE] Instance #${this.instanceId}: Retrying failed post ${scheduledPost.id}`);
          this.publishPost(scheduledPost);
        }
      }, 5 * 60 * 1000);
    } finally {
      // Remove from publishing set when done (success or failure)
      this.publishingPosts.delete(scheduledPost.id);
    }
  }

  private async checkForPostsToPublish() {
    if (!this.isRunning || this.scheduledPosts.length === 0) {
      return;
    }

    const now = Date.now();
    console.log(`[PERIODIC_CHECK] Instance #${this.instanceId} checking ${this.scheduledPosts.length} scheduled posts for publishing...`);

    // Find posts that should be published now
    const postsToPublish = this.scheduledPosts.filter(post => {
      const publishTime = post.publishAt.getTime();
      const shouldPublish = publishTime <= now;
      
      if (shouldPublish) {
        console.log(`[PERIODIC_READY] Instance #${this.instanceId}: Post ${post.id} is ready to publish (scheduled: ${post.publishAt.toISOString()}, now: ${new Date().toISOString()})`);
      }
      
      return shouldPublish;
    });

    if (postsToPublish.length === 0) {
      console.log(`[PERIODIC_NONE] Instance #${this.instanceId}: No posts ready to publish`);
      return;
    }

    console.log(`[PERIODIC_PUBLISHING] Instance #${this.instanceId}: Publishing ${postsToPublish.length} posts`);

    // Publish each post that's ready (publishPost will handle deduplication)
    for (const post of postsToPublish) {
      console.log(`[PERIODIC_PUBLISH] Instance #${this.instanceId}: Calling publishPost for ${post.id}`);
      await this.publishPost(post);
    }
  }

  // Update scheduled posts
  updateScheduledPosts(scheduledPosts: ScheduledPostEvent[]) {
    // Update the internal list of scheduled posts
    this.scheduledPosts = [...scheduledPosts];
    
    console.log(`Updated scheduler with ${scheduledPosts.length} scheduled posts:`, 
      scheduledPosts.map(p => ({ id: p.id, publishAt: p.publishAt.toISOString(), content: p.content.substring(0, 50) + '...', images: p.images?.length || 0 }))
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
    
    // Schedule new/updated posts (don't handle overdue posts here to avoid double publishing)
    const now = Date.now();
    for (const post of scheduledPosts) {
      const publishTime = post.publishAt.getTime();
      
      if (publishTime > now) {
        // Post is in the future, schedule it
        const timeUntilPublish = publishTime - now;
        console.log(`Scheduling post ${post.id} to publish in ${timeUntilPublish}ms (${Math.round(timeUntilPublish / 1000)}s)`);
        this.schedulePost(post);
      }
    }
    
    // Let checkForPostsToPublish handle overdue posts to avoid double publishing
    this.checkForPostsToPublish();
  }

  // Debug method to get current state
  getDebugInfo() {
    return {
      isRunning: this.isRunning,
      scheduledPostsCount: this.scheduledPosts.length,
      activeTimersCount: this.timers.size,
      publishingPostsCount: this.publishingPosts.size,
      publishingPostIds: Array.from(this.publishingPosts),
      scheduledPosts: this.scheduledPosts.map(p => ({
        id: p.id,
        publishAt: p.publishAt.toISOString(),
        timeUntilPublish: p.publishAt.getTime() - Date.now(),
        content: p.content.substring(0, 50) + '...'
      }))
    };
  }
}

// Global scheduler instance tracking
let globalScheduler: PostScheduler | null = null;
let schedulerInstanceCount = 0;

// Global deduplication tracking
const recentlyPublished = new Map<string, number>(); // postId -> timestamp
const DUPLICATE_PREVENTION_WINDOW = 5000; // 5 seconds

function isRecentlyPublished(postId: string): boolean {
  const lastPublished = recentlyPublished.get(postId);
  if (!lastPublished) return false;
  
  const now = Date.now();
  const timeSinceLastPublish = now - lastPublished;
  
  if (timeSinceLastPublish < DUPLICATE_PREVENTION_WINDOW) {
    console.log(`[GLOBAL_DUPLICATE] Post ${postId} was published ${timeSinceLastPublish}ms ago, blocking duplicate`);
    return true;
  }
  
  // Clean up old entries
  if (timeSinceLastPublish > DUPLICATE_PREVENTION_WINDOW * 2) {
    recentlyPublished.delete(postId);
  }
  
  return false;
}

function markAsPublished(postId: string): void {
  recentlyPublished.set(postId, Date.now());
  console.log(`[GLOBAL_MARK] Marked post ${postId} as recently published`);
}

export function getScheduler(): PostScheduler | null {
  return globalScheduler;
}

export function setScheduler(scheduler: PostScheduler | null): void {
  if (scheduler && globalScheduler && globalScheduler !== scheduler) {
    console.warn('[SCHEDULER_WARNING] Replacing existing scheduler instance');
    globalScheduler.stop();
  }
  globalScheduler = scheduler;
  console.log(`[SCHEDULER_SET] Scheduler instance set:`, scheduler ? 'active' : 'null');
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