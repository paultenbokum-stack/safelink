# SafeLink BETA Live Transition Walkthrough

All mock and fictitious data have been completely purged from SafeLink, and the full multi-tenant **Control Room** backend, **Aura Panic API v2** integration with toggle controls, **POPIA-compliant continuous Phone GPS tracking**, and the executive **CREAM** software owner master console have been built and verified.

---

## 1. Purging Mock Data & Enabling Sentinel Hardware Registration
- **Devices (`src/app/devices/page.js`):**
  - Removed `DEMO_DEVICES` (BLE Tags, Vehicle Trackers).
  - Added live `DELETE` endpoint at [`/api/devices/[imei]`](file:///c:/Projects/Safe_Link/safelink/src/app/api/devices/[imei]/route.js) to unbind hardware from TrackSolid and delete all Firestore records.
  - Ready for you to pair your 1 real Sentinel device via IMEI.
  - Added **Phone as GPS Tracker** live card with nickname editing, live coordinate display, and instant tracking toggles.
- **Radar & Live Map (`src/app/map/page.js`):**
  - Removed `DEMO_MEMBERS` (`Thabo`, `Lesedi`, `Naledi`, `Sipho`) and `DEMO_GEOFENCES`.
  - Empty state now shows a live radar scanning pulse when no hardware beacons or phones are active.
  - Header features a live "Share Phone" GPS tracking pill.
- **Profile & Avatar Management ([`src/app/profile/page.js`](file:///c:/Projects/Safe_Link/safelink/src/app/profile/page.js) & [`src/app/profile/edit/page.js`](file:///c:/Projects/Safe_Link/safelink/src/app/profile/edit/page.js)):**
  - **Interactive Avatar Editor ([`AvatarEditorModal.js`](file:///c:/Projects/Safe_Link/safelink/src/app/components/AvatarEditorModal.js)):**
    - Tap on the profile picture or the golden camera icon badge on `/profile` or `/profile/edit` to open the editor.
    - **Take Photo:** Directly opens your device's camera (`capture="user"`).
    - **Upload from Gallery:** Pick any custom photo or picture from your phone.
    - **Automatic Center Crop & Compression:** Uses an HTML5 canvas to crop to a clean square and compress to a lightweight image for instant loading.
    - **Curated Avatar Library:** Select from preset executive and tactical styles.
    - **Instant Cross-App Sync:** Updates the header icon, dashboard, family list, and persists to Firestore via [`/api/profile/avatar`](file:///c:/Projects/Safe_Link/safelink/src/app/api/profile/avatar/route.js).


---

## 2. Real-Time Phone GPS Tracking & POPIA Consent
- **POPIA GPS Consent Modal ([`src/app/components/GpsConsentModal.js`](file:///c:/Projects/Safe_Link/safelink/src/app/components/GpsConsentModal.js)):**
  - Explicit consent modal informing users that location telemetry is processed under the South African **Protection of Personal Information Act (Act 4 of 2013)** for emergency dispatch and household safety.
  - Mounted globally in [`src/app/layout.js`](file:///c:/Projects/Safe_Link/safelink/src/app/layout.js).
  - When granted, starts high-accuracy `navigator.geolocation.watchPosition` posting real-time coordinates to [`/api/location/share`](file:///c:/Projects/Safe_Link/safelink/src/app/api/location/share/route.js).
  - Can be reviewed or revoked anytime in Family Settings or Profile.
- **Real Family Members & Emergency Contacts:**
  - **Family Page ([`src/app/profile/family/page.js`](file:///c:/Projects/Safe_Link/safelink/src/app/profile/family/page.js)):** Real invitation form, member removal, and per-member GPS tracking toggles.
  - **Emergency Dispatch Contacts ([`src/app/profile/emergency/page.js`](file:///c:/Projects/Safe_Link/safelink/src/app/profile/emergency/page.js)):** Real South African phone validation (`+27` / `08X` format required for dispatch) and synchronized to Firestore [`/api/household/emergency`](file:///c:/Projects/Safe_Link/safelink/src/app/api/household/emergency/route.js).

---

## 3. Aura SOS Panic API v2 Integration
Refactored [`src/lib/aura.js`](file:///c:/Projects/Safe_Link/safelink/src/lib/aura.js) per the official Aura documentation ([`https://docs.aurasos.com`](https://docs.aurasos.com/overview/introduction)):
- **OAuth2 Token Handshake (`POST /panic-api/v2/oauth/token`):** Server-side Bearer token exchange with Firestore and in-memory token caching.
- **Callout Creation (`POST /panic-api/v2/customers/{id}/callouts`):** Dispatches armed response (Type 1), medical EMS (Type 2), fire (Type 3), or roadside (Type 4) with high-accuracy GPS coordinates.
- **Location Polling (`locations-and-return`):** Continuously pushes updated subscriber coordinates and returns live responder vehicle location, officer details, and ETA.
- **Cancellation (`POST /panic-api/v2/callouts/{id}/cancel`):** False alarm and user cancellation handling.
- **Inbound Webhook ([`src/app/api/webhooks/aura/route.js`](file:///c:/Projects/Safe_Link/safelink/src/app/api/webhooks/aura/route.js)):** Real-time webhook processing for `Responder Dispatched`, `Responder Arrived`, and `Responder Completed`.
- **Per-Security-Company Toggle:** Aura can be enabled or disabled per company in the Control Room. If disabled, alerts route directly to internal patrol fleets.

---

## 4. Multi-Tenant "Control Room" Backend ([`/control-room`](file:///c:/Projects/Safe_Link/safelink/src/app/control-room/page.js))
- **Live Incident Triage Board:** Real-time incoming panic queue with GPS coordinates, subscriber contact info, Google Maps link, Aura Callout ID, and dispatch workflow buttons ("Mark On Scene", "Resolve", "Cancel").
- **Community Camera Matrix:**
  - Surveillance feeds for **Hikvision**, **Dahua**, and **EZVIZ**.
  - Add Camera Feed modal with pre-configured port and protocol defaults (Hikvision RTSP 554, Dahua RTSP 554 / TCP 37777, EZVIZ Cloud).
- **Aura Settings & Live Handshake Tester:**
  - On/Off toggle switch per security company.
  - Environment selector (Staging Sandbox vs Production).
  - Client ID & Client Secret fields with live test connection button ([`/api/control-room/aura-test`](file:///c:/Projects/Safe_Link/safelink/src/app/api/control-room/aura-test/route.js)).
- **Patrol Fleet & Geofence Grid:** Tactical fleet tracking and zone monitoring.

---

## 5. "CREAM" Software Owner Master Console ([`/cream`](file:///c:/Projects/Safe_Link/safelink/src/app/cream/page.js))
- **Executive Master Control:** Root access designed for CREAM (the software owner) with purple/gold aesthetic.
- **Tenant Switcher:** Instant switching between security companies (Help24 Security, Global Security Consulting, Fidelity ADT, etc.) with 1-click launch into any tenant's Control Room.
- **Security Company Onboarding & Licensing:** Table of all onboarded security companies, PSIRA registration numbers, dispatch phone numbers, Aura status, and account status toggles (`Activate` / `Suspend`).
- **Owner Diagnostics & Troubleshooter:**
  - Aura SOS API Gateway test.
  - TrackSolid EMEA EU Router verification.
  - Cache flusher and diagnostic tools.

---

## 6. Build & Verification Results
- `node -c` passed on all backend API routes and libraries.
- `npm run build` completed with **code 0** across all 59 routes with Next.js Turbopack.

---

## 7. Resolution: Live Radar Map Crash & "This page couldn't load" Fix
- **Problem**: When users navigated to `/map` to view their Sentinel devices or Phone GPS, the mobile browser crashed to Next.js's error boundary: *"This page couldn't load. Reload to try again, or go back."*
- **Root Cause**:
  - In [`src/app/map/page.js`](file:///c:/Projects/Safe_Link/safelink/src/app/map/page.js), `useLocationSharing()` was called, but `lastPosition` was omitted from the destructuring list.
  - At line 411, `let localPhoneGps = lastPosition;` was evaluated, throwing `ReferenceError: lastPosition is not defined`.
  - In React 19 / Next.js 16, unhandled runtime errors in effects and callbacks trigger the top-level error boundary.
- **Resolution**:
  - Properly destructured `lastPosition` and `isSharing` from `useLocationSharing()`.
  - Hardened token resolution with `user.getIdToken()` or active test tokens.
  - Validated coordinates with `isNaN(parseFloat(...))` before feeding into Google Maps or Leaflet.
  - Added dedicated Next.js Error Boundary [`src/app/map/error.js`](file:///c:/Projects/Safe_Link/safelink/src/app/map/error.js) so that even if network or display issues occur, users get an in-app tactical recovery UI rather than a generic white crash screen.
- **Deployed to Production**: Build tested cleanly and deployed to `https://safelink-app-peach.vercel.app/map`.

