# NIP-X: Scheduled Posts

## Abstract

This NIP defines a standard for creating and managing scheduled posts on Nostr. It introduces a new event kind for storing encrypted scheduled posts that can be automatically published at a specified time.

## Motivation

Social media scheduling is a common requirement for content creators and marketers. This NIP provides a decentralized way to schedule posts on Nostr without relying on centralized services.

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