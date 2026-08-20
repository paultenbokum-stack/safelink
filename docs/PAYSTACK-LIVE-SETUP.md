# Paystack live setup for SafeLink

The store checkout now uses Paystack's server-initialized InlineJS v2 flow. SafeLink recalculates the cart on the server, stores a short-lived payment intent, verifies successful transactions with Paystack, and only then creates a paid Firestore order. The signed webhook can complete an order if the customer's browser closes after payment.

## Current credential state

The local `.env.local` contains Paystack **test** credentials. The checkout therefore creates real Paystack sandbox transactions but cannot take live money. Never commit or paste either a test or live secret key into source code, chat, or a `NEXT_PUBLIC_` variable.

The store flow needs only this server-side variable:

```dotenv
PAYSTACK_SECRET_KEY=sk_test_replace_in_local_env_only
```

`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` remains in the project for older subscription screens, but the store checkout no longer trusts a browser key, amount, reference, or success callback on its own.

## Configure Firebase App Hosting

Create the secret interactively so its value is not placed in shell history or source control:

```powershell
firebase apphosting:secrets:set paystackSecretKey --project safelink-b8071
```

Then add this runtime binding to the `env:` list in `apphosting.yaml` as part of the hosting setup:

```yaml
  - variable: PAYSTACK_SECRET_KEY
    secret: paystackSecretKey
    availability:
      - RUNTIME
```

Use `sk_test_...` for the first hosted end-to-end test. Once the Paystack business is activated and the test order is confirmed in both Paystack and Firestore, update the same secret to the `sk_live_...` value supplied in the Paystack live dashboard.

The Firebase Admin SDK uses App Hosting's application-default service identity. That identity must have permission to read and write Firestore in the `safelink-b8071` project.

## Configure the Paystack webhook

After the public HTTPS domain is ready, set the Paystack dashboard webhook URL for both test and live modes to:

```text
https://YOUR-SAFELINK-DOMAIN/api/paystack/subscription
```

Despite the legacy route name, this endpoint now handles both subscription events and store `charge.success` recovery. It rejects unsigned events and validates store payments against the server-side payment intent before creating an order.

## Go-live checklist

1. Complete Paystack business activation/KYC and confirm that ZAR payments are enabled.
2. Bind the test secret to App Hosting and deploy through the existing hosting workflow.
3. Complete a Paystack test payment. Confirm the amount, currency, reference, customer email, `paymentStatus: paid`, and one order only.
4. Close the checkout immediately after a second test payment and confirm the webhook still creates the order.
5. Replace the hosted secret with the live secret. Do not add a live public key to the store checkout.
6. Run one small live purchase and refund it from Paystack if it is purely a go-live test.
7. Keep Paystack transaction references in support logs; never log secret keys or full card/payment authorization objects.

No live payment should be attempted until the hosted secret and webhook URL are configured deliberately.
