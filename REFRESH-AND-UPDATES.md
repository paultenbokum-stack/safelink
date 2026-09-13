# Refresh, telemetry and automatic releases

The shared header is one 64px row: profile/logo, concise greeting or truncated title, theme icon, refresh and bell. Buttons retain 44px touch targets. The map uses the reclaimed viewport height.

Header refresh awaits mounted dashboard, devices/map, activity, notifications and version checks. In-flight refreshes are coalesced by scope. Tracker refresh calls the authenticated location endpoint; partner devices refresh their permitted list. Phone refresh is available only when this phone opted into sharing. It cannot wake another phone or force hardware to transmit.

Telemetry separates the last successful check from the actual GPS fix time. Unknown battery values are omitted; 0% is valid. Fixes older than two minutes are initially marked stale. Invented partner coordinates/battery values and misleading freshness fallbacks were removed. Phone uploads preserve the original fix timestamp. Jimi-style GPS date strings are UTC, as specified in the [Jimi integration documentation](https://docs.jimicloud.com/integration/integration.html).

## Automatic updates and caching

`next.config.mjs` embeds a release identifier into the app and the uncached `/api/app-version` endpoint. It uses `SAFELINK_RELEASE_ID`, then the Vercel commit SHA, or a generated build identifier. Set a unique release ID if rebuilding one commit with different configuration.

`AppUpdates` checks on opening, pageshow, resume, reconnection and every minute while visible. A newer version reloads automatically at a safe opportunity. An active SOS/demo, edited form, message draft or settings edit defers reload. Login/registration and payment routes remain protected until exited. New asynchronous flows should expose `data-update-blocked="true"` until complete. Map camera/selection survive update reloads; message drafts are saved per account in session storage. A failed target version cannot reload the same tab more than once every five minutes.

The worker stages updates until requested by the controlled reload. It caches versioned static assets and an explicit offline page, with a 200-entry cap. It never caches authenticated HTML, API responses, RSC payloads or cross-origin requests. An already-open offline screen retains last known in-memory data; a new offline navigation displays the reconnect page. Refresh does not clear credentials or preferences. A closed/offline app obtains new code on its next online opening, not while unreachable.

## Validation

- `npm run build`
- `node scripts/qa-refresh-policy.cjs`
- `node scripts/qa-push-queue.cjs`
- `node scripts/qa-notifications.cjs`
- `node scripts/qa-phone-isolation.cjs`
- `node scripts/qa-refresh-ui.cjs` against a local production server on port 3081 (`QA_BASE` overrides it)

UI tests mock Firebase sign-in and all account APIs. They create no real users or messages. Screenshots are under `.vercel/qa-refresh/`. Real installed-device/background delivery requires a configured test project and physical devices.
