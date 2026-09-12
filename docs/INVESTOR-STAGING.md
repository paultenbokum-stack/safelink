# Investor deployment guide

The investor demonstration uses the existing production deployment. See [INVESTOR-DEMO.md](./INVESTOR-DEMO.md) for registration, demo boundaries, deployment, and validation instructions.

This older staging guide is superseded. Do not create a separate environment or Firebase project for the investor demonstration.

## Configuration

Keep local credentials in `.env.local` and production credentials in the existing Vercel project's environment settings. Never put secret values in documentation or source control.

Required TrackSolid variable names:

```dotenv
TRACKSOLID_API_URL=
TRACKSOLID_APP_KEY=
TRACKSOLID_APP_SECRET=
TRACKSOLID_USER_ID=
TRACKSOLID_USER_PWD_MD5=
```

Paystack test checkout requires `PAYSTACK_SECRET_KEY`. The server rejects live keys. Validate any replacement test secret with Paystack before updating the existing production environment and redeploying.

TrackSolid REST polling does not require a webhook. Configure `TRACKSOLID_WEBHOOK_SECRET` only if authenticated webhooks are enabled later.
