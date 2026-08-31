# SafeLink API

SB Security SafeLink API Built with Fastify.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Server runs on `http://localhost:3001`.

## Endpoints

- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `GET /membership/status`
- `POST /sos/trigger`
- `GET /sos/:id/status`
- `PUT /sos/:id/cancel`
- `GET /location/history/:userId`
- `POST /circles/create`
- `POST /devices/ble/register`
- `GET /store/products`
- `POST /services/bookings/technician`
- `GET /partners/dashboard`
- `GET /admin/analytics`

See source files in `src/routes/` for more details.
