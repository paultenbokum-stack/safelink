# SafeLink notification center

The header bell opens `/notifications`. It shows unread items among the latest 50 notifications, with Family, Community and Security filters. Read receipts persist per account. The inbox refreshes every 30 seconds while the page is visible, and on return to the app.

Verified guardians and invited family members can send messages to one joined member or everyone in their family. Recipient membership is checked against server-owned `familyMemberships`, not just a cached household list. The sender receives a read-only sent copy in their inbox. Messages are limited to 100 title characters and 1,000 body characters. A request ID prevents duplicate sends after a lost response; a five-second per-sender interval limits repeated sending.

## Connecting community and security-company publishers

There is no existing live community or company notification provider in this checkout. An administrator must provision channels and subscriptions before these feeds receive updates. No channel permissions are inferred from a display name, client-supplied company ID, or a family member's role label.

Create a server-owned Firestore document `notificationChannels/<channelId>` with:

```json
{
  "name": "Verified publisher name",
  "kind": "security",
  "active": true,
  "publisherUids": ["verified-firebase-staff-uid"],
  "householdIds": ["subscribed-guardian-firebase-uid"]
}
```

Use `kind: "community"` for community updates. Channel IDs must not contain slashes. The inbox loads up to ten subscribed and ten publisher channels. An authorised publisher sees a channel destination under New message and can review its updates in the inbox. Invited family members cannot publish to channels. Removing a household subscription or disabling a channel removes its updates from that family's feed on refresh.

An authorised external company system can POST to `/api/notifications/publish` with its Firebase ID token in `Authorization: Bearer ...` and this JSON body:

```json
{
  "requestId": "a-unique-uuid-for-this-update",
  "channelId": "the-provisioned-channel-id",
  "title": "Update title",
  "body": "Update text"
}
```

The sender's verified Firebase UID must be in the channel's publisher list. Reuse the same request ID and payload when retrying a lost response. This endpoint creates an in-app bulletin, not an operating-system push notification.

## Deployment and validation

All notification collections are server-only: `notificationChannels` (including updates), `notificationInboxes`, `notificationReads`, `notificationRequests`, and `notificationSendLimits`. Client Firestore writes must not be permitted to these collections, or to `familyMemberships`. Review the deployed rules before release: no Firestore rules are checked into this repository. A broad wildcard allow rule must not bypass these restrictions. The API uses Firebase Admin and performs recipient, publisher and subscription checks itself.

No composite Firestore indexes are required by these queries. No new email, SMS, WhatsApp, or push provider is enabled, and the implementation does not send messages on behalf of the developer.

Run `node scripts/qa-notifications.cjs` for account isolation, read receipts, invited-member messaging, anti-impersonation, retries, rate limits, channel permissions, subscriptions and membership removal checks. Run `node scripts/qa-family-invites.cjs` for invitation access regressions. The production Next.js build and targeted ESLint checks also pass locally.

Before release, use separate guardian and invited-member sessions to send an explicitly chosen test message and verify its unread badge and read state. Provision a non-production test publisher channel and verify a subscribed family can read its update while an unrelated family cannot. Live Firebase delivery and publisher setup have not been verified against production.
