# NIP-X: Scheduled Posts and Campaigns

## Abstract

This NIP defines a standard for creating and managing scheduled posts and marketing campaigns on Nostr. It introduces event kinds for storing encrypted scheduled posts that can be automatically published at a specified time, and for organizing posts into coordinated campaigns.

## Motivation

Social media scheduling and campaign management are common requirements for content creators and marketers. This NIP provides a decentralized way to schedule posts and organize them into campaigns on Nostr without relying on centralized services.

## Event Kinds

### Kind 30401: Scheduled Post

A scheduled post is an addressable event that contains encrypted content to be published at a future time.

```json
{
  "kind": 30401,
  "content": "<encrypted-content>",
  "tags": [
    ["d", "<unique-identifier>"],
    ["publish_at", "<unix-timestamp>"],
    ["target_kind", "1"],
    ["status", "scheduled"],
    ["created_at", "<unix-timestamp>"],
    ["title", "My Scheduled Post"],
    ["image", "https://example.com/image1.jpg"],
    ["image", "https://example.com/image2.jpg"],
    ["client", "nostr-social"]
  ]
}
```

### Tags

- `d` (required): Unique identifier for this scheduled post
- `publish_at` (required): Unix timestamp when the post should be published
- `target_kind` (required): The kind of event to publish (usually `1` for text notes)
- `status` (required): Current status - `scheduled`, `published`, `failed`, `cancelled`
- `created_at` (required): When the scheduled post was created
- `title` (required): Title for organizing the scheduled post (not published in the final event)
- `image` (optional): URL of an image to include in the post (can have multiple)
- `published_event` (optional): Event ID of the published post (added when status becomes "published")
- `error` (optional): Error message if the post failed to publish
- `client` (optional): Client application that created the scheduled post
- `campaign` (optional): Campaign ID this post belongs to

### Kind 30402: Campaign

A campaign is an addressable event that defines a marketing campaign containing multiple related posts.

```json
{
  "kind": 30402,
  "content": "",
  "tags": [
    ["d", "<unique-identifier>"],
    ["title", "Book Launch Campaign"],
    ["description", "A series of posts promoting my new book"],
    ["start", "<unix-timestamp>"],
    ["end", "<unix-timestamp>"],
    ["status", "scheduled"],
    ["total_posts", "10"],
    ["completed_posts", "3"],
    ["audience", "Developers and Bitcoin enthusiasts"],
    ["t", "book-launch"],
    ["t", "nostr"],
    ["post", "<scheduled-post-id-1>"],
    ["post", "<scheduled-post-id-2>"],
    ["client", "nostr-social"]
  ]
}
```

#### Campaign Tags

- `d` (required): Unique identifier for this campaign
- `title` (required): Campaign title
- `description` (optional): Campaign description
- `start` (required): Unix timestamp when the campaign starts
- `end` (required): Unix timestamp when the campaign ends
- `status` (required): Current status - `draft`, `scheduled`, `active`, `completed`, `cancelled`
- `total_posts` (required): Target number of posts in the campaign
- `completed_posts` (required): Number of posts already published
- `audience` (optional): Target audience description
- `t` (optional): Campaign tags for categorization (can have multiple)
- `post` (optional): Reference to scheduled posts in this campaign (can have multiple)
- `client` (optional): Client application that created the campaign

#### Campaign Status Lifecycle

- `draft`: Campaign is being planned
- `scheduled`: Campaign is ready and waiting for start date
- `active`: Campaign is currently running
- `completed`: Campaign has finished
- `cancelled`: Campaign was cancelled

### Content Encryption

The `content` field contains the encrypted post content using NIP-44 encryption, encrypted to the author's own pubkey. This ensures only the author (or their authorized clients) can read the scheduled content.

### Publishing Process

1. Client creates a kind 30401 event with encrypted content
2. At the scheduled time, the client:
   - Decrypts the content
   - Creates a new event with the target kind (usually kind 1)
   - Publishes the new event to relays
   - Updates the scheduled post status to "published"

### Status Management

Scheduled posts can be updated by publishing a new kind 30401 event with the same `d` tag and updated status:
- `scheduled`: Waiting to be published
- `published`: Successfully published
- `failed`: Failed to publish (with optional error details)
- `cancelled`: Cancelled by user

## Implementation Notes

- Clients should implement local scheduling mechanisms (timers, workers, etc.)
- Failed posts should be retried with exponential backoff
- Clients may choose to delete scheduled posts after successful publication
- Multiple clients can coordinate by monitoring scheduled post events

## Security Considerations

- Content is encrypted to prevent unauthorized access
- Only the author can decrypt and publish scheduled content
- Scheduled posts are visible on relays but content remains private

## Examples

### Creating a Scheduled Post

```json
{
  "kind": 30401,
  "pubkey": "author-pubkey",
  "created_at": 1234567890,
  "content": "encrypted-content-here",
  "tags": [
    ["d", "post-2024-01-15-morning"],
    ["publish_at", "1705308000"],
    ["target_kind", "1"],
    ["status", "scheduled"],
    ["created_at", "1705221600"],
    ["title", "Morning Update"],
    ["image", "https://example.com/sunrise.jpg"],
    ["client", "nostr-social"]
  ]
}
```

### Updating Status to Published

```json
{
  "kind": 30401,
  "pubkey": "author-pubkey", 
  "created_at": 1234567891,
  "content": "",
  "tags": [
    ["d", "post-2024-01-15-morning"],
    ["publish_at", "1705308000"],
    ["target_kind", "1"],
    ["status", "published"],
    ["published_event", "event-id-of-published-post"],
    ["created_at", "1705221600"],
    ["title", "Morning Update"],
    ["image", "https://example.com/sunrise.jpg"],
    ["client", "nostr-social"]
  ]
}
```

### Creating a Campaign

```json
{
  "kind": 30402,
  "pubkey": "author-pubkey",
  "created_at": 1234567890,
  "content": "",
  "tags": [
    ["d", "book-launch-2024"],
    ["title", "Nostr for Beginners Book Launch"],
    ["description", "A 2-week campaign to promote my new book about Nostr"],
    ["start", "1705308000"],
    ["end", "1706517600"],
    ["status", "scheduled"],
    ["total_posts", "10"],
    ["completed_posts", "0"],
    ["audience", "Developers, Bitcoin enthusiasts, Content creators"],
    ["t", "book-launch"],
    ["t", "nostr"],
    ["t", "education"],
    ["client", "nostr-social"]
  ]
} 