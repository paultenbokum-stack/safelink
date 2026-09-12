# Safelink investor demonstration

Production entry point: https://safelink-app-peach.vercel.app

## Registering an investor

1. Open the link and select **Create your account**.
2. Enter a South African cell number, name, email and a password of at least 12 characters, then confirm that password.
3. Complete the household and emergency contact details.
4. Signup requests a verification email automatically. Open the email link, return to Safelink and select **I’ve verified my email**. If it does not arrive, check spam and use **Send verification email** after the cooldown. The page reports request acceptance, not confirmed inbox delivery.
5. Sign in subsequently using the registered email and password.

Firebase Authentication is enabled in the existing `safelink-b8071` project. The two existing Vercel production hostnames are authorized. The application verifies Firebase-signed ID tokens server-side. Unverified accounts can save their own onboarding profile, but cannot access the protected device, activity or payment APIs.

This is **password authentication with email verification, not MFA**. Email verification proves access to the email inbox. The supplied cell number remains an **unverified contact detail** and cannot be used to claim existing devices by matching a phone number. Real phone ownership verification requires a separate mechanism such as Firebase SMS. No OTP bypass or locally fabricated account is used.

New accounts begin with no linked Sentinel devices. Add a device by IMEI or opt into phone sharing while the app is open. Existing device locations are not automatically exposed to newly registered accounts.

Shared phone locations are restricted to the signed-in account. Cross-account family phone sharing requires an explicit membership and consent model before it can be enabled.

## Demo boundaries

- SOS is a local, labelled demonstration. No Aura dispatch API is called. Officer, ETA and journey are illustrative.
- Empty account activity feeds show labelled demo examples. Failed event reads show an error instead of fabricated account activity.
- CREAM integration statuses represent labelled demonstration configurations, not verified live partner connections. Demo tenant records are rendered without database seeding.
- The three investor hardware tiers are labelled proposed demo packages. Existing catalogue products remain available.
- Store checkout uses the existing Paystack test key. The server rejects live keys for this demonstration. No real hardware fulfilment is implied.
- Phone sharing requires consent and an open app; the PWA does not promise continuous background GPS.
- CMS, Aura, camera and accounting partnerships require access, configuration and live validation before commercial launch.

## Deployment and validation

- Deploy this single codebase with `npx --yes vercel --prod --yes`.
- Node.js is pinned to `24.x` to match the runtime tested locally and support the installed Firebase Admin dependency chain.
- Production sets `NODE_OPTIONS=--experimental-require-module`, the [Vercel-documented interoperability option](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration) needed by Firebase Admin 14’s `jwks-rsa` / `jose` dependency chain. Vercel otherwise disables this Node capability even on Node 24.
- `NEXT_PUBLIC_ADMIN_PASS` was removed from Vercel Production. It was not present in the other environments.
- All five required TrackSolid environment variables were confirmed in Production without changing their values.
- The existing Paystack test secret was added to Production because the public key alone cannot initialize server-verified checkout.
- `.env.local`, Vercel local data and QA tooling are excluded from deployment uploads. Secrets must never be committed.

The scripts under `scripts/qa-*.cjs` perform focused browser and upstream checks. Production QA uses disposable, distinctly named accounts and removes their records afterward. QA completes verification with an admin-generated link; this does not prove inbox delivery. Signup now also requests the normal verification email automatically.

## Resumed validation — 11 September 2026

Production deployment `dpl_Azk1489s54vXfiu6dBvAw3XwqMvA` is ready at the existing entry point above.

- Local and Vercel builds passed. Five phone-location isolation regression checks passed.
- Live mobile QA passed signup, profile saving, the unverified-access gate, email-verification completion, dashboard, account isolation, SOS sequence/cancellation with zero dispatch requests, three store tiers, cart addition, map tile loading, About, and CREAM. No browser page errors or map horizontal overflow were detected.
- TrackSolid returned its device list and real coordinates using the unchanged credentials. New accounts have no linked hardware or other users' shared phones.
- Paystack initialization now passes: the replacement test secret was accepted by the provider, synced securely to the existing Vercel Production environment, and activated by redeployment. Authenticated production checkout returned HTTP 200, `mode: test`, and R799 for the Sentinel Personal Tag. This verifies checkout initialization; a completed payment and fulfilment were not exercised.
- This QA run's disposable account, profile, and payment intents were removed.
