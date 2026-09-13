# SafeLink notification center

The header bell opens `/notifications`. It shows exact unread totals across authorised history, with 50-item pagination and Alerts, Family, Community, Security and App Updates filters. Related messages are grouped; urgent unacknowledged alerts sort first. Read receipts persist per account. The inbox refreshes every 30 seconds while the page is visible, and on return to the app.

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

Use `kind: "community"` for community updates. Channel IDs must not contain slashes. The inbox includes all authorised channels. An authorised publisher sees a channel destination under New message and can review its updates in the inbox. Invited family members cannot publish to channels. Removing a household subscription or disabling a channel removes its updates from that family's feed on refresh.

An authorised external company system can POST to `/api/notifications/publish` with its Firebase ID token in `Authorization: Bearer ...` and this JSON body:

```json
{
  "requestId": "a-unique-uuid-for-this-update",
  "channelId": "the-provisioned-channel-id",
  "title": "Update title",
  "body": "Update text"
}
```

The sender's verified Firebase UID must be in the channel's publisher list. Reuse the same request ID and payload when retrying a lost response. This endpoint creates an in-app bulletin and a durable push job. Delivery respects each recipient’s server-backed preferences. The optional priority is routine or important; urgent additionally requires the sender UID in the channel’s urgentPublisherUids list.

## Deployment and validation

All notification collections are server-only: `notificationChannels` (including updates), `notificationInboxes`, `notificationReads`, `notificationRequests`, and `notificationSendLimits`. Client Firestore writes must not be permitted to these collections, or to `familyMemberships`. Review the deployed rules before release: no Firestore rules are checked into this repository. A broad wildcard allow rule must not bypass these restrictions. The API uses Firebase Admin and performs recipient, publisher and subscription checks itself.

No composite Firestore indexes are required by these queries. Firebase Cloud Messaging delivery is implemented, but needs the deployment configuration below. No real message or push has been sent during this implementation.

Run `node scripts/qa-notifications.cjs` for account isolation, read receipts, invited-member messaging, anti-impersonation, retries, rate limits, channel permissions, subscriptions and membership removal checks. Run `node scripts/qa-family-invites.cjs` for invitation access regressions. The production Next.js build and targeted ESLint checks also pass locally.

Before release, use separate guardian and invited-member sessions to send an explicitly chosen test message and verify its unread badge and read state. Provision a non-production test publisher channel and verify a subscribed family can read its update while an unrelated family cannot. Live Firebase delivery and publisher setup have not been verified against production.


## Refresh and push implementation (September 2026)

Preferences are server-backed and shared by the inbox and `/profile/notifications`. Users control push and icon badges by category, non-urgent quiet hours with an IANA timezone, daily community digests and lock-screen previews. Safety and security push default on; family, community and release push default off. Lock-screen previews default off. Urgent unread alerts count toward enabled badges. Reading an alert does not acknowledge it or cancel response activity.

Badges update on opening or an allowed push. Badge-only preferences cannot guarantee silent background updates on systems requiring visible pushes. Phone settings, Focus/DND and connectivity still control delivery. The obsolete local-only silent-mode-override controls have been replaced.

Authenticated TrackSolid alarm webhooks, actual SOS request creation and phone geofence transitions create safety notifications. Ordinary family messages cannot claim urgent priority. No unverified Aura webhook has been connected to push. The current SOS screen remains a demo; this change does not enable live dispatch from that demo.

### Required deployment configuration

1. Firebase Project Settings → Cloud Messaging → Web Push certificates: generate/use the public key, set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in the build environment and rebuild. The Firebase Cloud Messaging API and the existing service account’s messaging permission must be available.
2. Set a strong server-only `CRON_SECRET`. Configure the host’s scheduler to GET `/api/notifications/deliver` every minute with `Authorization: Bearer <CRON_SECRET>`. Match cadence to the hosting plan. Browser timers cannot deliver while the app is closed.
3. Serve HTTPS and keep the single `/sw.js` worker. Do not register a competing root Firebase messaging worker. Enable push from the app on each device; iPhone/iPad require a supported Home Screen installation.
4. Validate background delivery, denied permission, logout/account switching, quiet hours, digests and badge clearing on physical Android/iPhone devices.

The checked local environment has neither the Web Push key nor scheduler secret. No production deployment, provider configuration, scheduler, real announcement or external message was created during implementation.

### Release announcements

Code updates automatically, independently of announcements. `/admin/updates` lets a user with the trusted Firebase `notificationAdmin: true` custom claim publish one announcement for the deployed version. POST `/api/notifications/releases` also accepts `{ version, title, body, important }`. Routine releases never queue phone push; important releases reach only users who enabled update pushes. Repeating the same version is idempotent. Publish release notes after the deployment is healthy.

### Queue and capacity

Message and push-job writes are atomic. Next.js `after()` attempts delivery after sending the HTTP response; the scheduler retries interruption and temporary errors and delivers quiet-hours/digest deferrals. Each run processes at most five jobs and twenty token records per job, with a stored cursor and two-minute lease. Receipts, stable event IDs and notification tags suppress repeats. Around a process crash after provider acceptance but before recording the receipt, delivery is at-least-once, not a guarantee of exactly once. A transactional per-device/day claim groups community digests.

The worker rechecks family/channel access, preferences, read state and token ownership before sending. Invalid/expired tokens are removed. Tokens expire after thirty days without enrolment renewal. Urgent phone jobs expire after five minutes; ordinary jobs after up to two days; the inbox entry remains. Logout invalidates the browser token, and a worker account binding protects against late pushes for a previous account. Foreground pushes refresh the inbox and show one system notification without a second in-app toast.

Additional server-only collections are `notificationPreferences`, `notificationReleases`, `notificationPushJobs`, `notificationPushTokens`, `notificationPushReceipts`, and `notificationPushDigests`. Protect them from direct client writes and broad wildcard rules. The existing firebase configuration refers to Firestore rule files not present locally; deployed rules still need review before release.

The compatibility reader merges existing personal/shared-channel histories to calculate exact totals. Reads grow with history; monitor costs and add materialised counters/retention before large-volume rollout. Completed jobs, receipts and daily digest records need an operational retention policy. Monitor queue backlog and function duration and increase worker capacity for large audiences.

Tests: `qa-refresh-policy.cjs` covers priorities, timezone/quiet hours, badges, telemetry and cache isolation; `qa-push-queue.cjs` covers concurrent leases, isolation, privacy defaults, muting, retries and digests with a fake provider; `qa-notifications.cjs` now also covers history beyond 50 and separate acknowledgement. `qa-refresh-ui.cjs` checks mocked mobile flows without real recipients.

References: [Firebase web messaging](https://firebase.google.com/docs/cloud-messaging/web/receive-messages), [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers). See `REFRESH-AND-UPDATES.md` for update and caching behaviour.
