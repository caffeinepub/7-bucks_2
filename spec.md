# 7 Bucks

## Current State
Fresh rebuild. No existing application files.

## Requested Changes (Diff)

### Add
- Full ContiPay Visa→EcoCash integration with correct API endpoints, auth, and checksum
- Admin config panel (admin-only): store authKey, authSecret, merchantId, environment (test/live), SSL private key (.pem), webhookUrl
- Send Money form: collect sender card details (full PAN, CVV, expiry MM/YYYY, name on card) + recipient details (firstName, surname, nationalId, email, cell/EcoCash number, accountName)
- Fee engine: $1.00 flat + 6% of gross; display 2% IMTT; Decimal.js precision
- ContiPay Acquire flow: POST /acquire/payment with Direct Payment, providerCode VA, Basic Auth header
- Status polling: GET /acquire/payment?merchantId=...&merchantRef=... as webhook fallback
- Webhook endpoint in backend: verify payload, idempotency check on contiPayRef, route by statusCode
- ContiPay Disburse flow: POST /disburse/payment with providerCode EC, Basic Auth + checksum header (SHA256 sign of authKey+reference+merchantId+account+accountNumber+amount using SSL private key, base64-encoded)
- Status code state machine: 0/5→Step1, 7/6→Step2, 1→Step3+disburse, 3/4→error, 2→refunded
- 3-step visual stepper: Authorizing Card → Verifying Settlement → Payout to EcoCash
- Transaction history per user with all fields: amount, fee, net, status, contiPayRef, correlator, providerName, date
- Sensitive data auto-mask after 20 seconds of inactivity in admin config
- Role-based access: admin-only for config panel; users see only their own transactions
- About page and Terms & Conditions page
- Dark-mode neo-bank UI with Tailwind
- Login/logout with stable session (no flicker on reload)

### Modify
N/A — full rebuild

### Remove
N/A — full rebuild

## Implementation Plan
1. Select components: authorization, http-outcalls
2. Generate Motoko backend:
   - Admin config storage (authKey, authSecret, merchantId, env, SSL key, webhookUrl)
   - Transaction record type with all ContiPay fields
   - acquirePayment(ref, amount, cardDetails, recipientDetails) → HTTP outcall to ContiPay acquire
   - getPaymentStatus(merchantRef) → HTTP outcall to ContiPay status endpoint
   - disbursePayment(transactionId) → sign checksum, HTTP outcall to ContiPay disburse
   - handleWebhook(payload) → idempotency check, status routing, trigger disburse on code 1
   - getUserTransactions() → returns caller's transactions
   - Admin: setConfig(), getConfig() (admin-only)
3. Build frontend:
   - Dark neo-bank layout with sidebar nav
   - Login/logout with authorization component, stable session
   - Send Money page with stepper, card capture form, recipient form, fee preview
   - Transaction History page
   - Admin Config page with 20s auto-mask
   - About and T&C pages
   - Map all 8 status codes to stepper states and user-friendly messages
