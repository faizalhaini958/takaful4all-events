# PRD — Registration Auth Gate & Account-Linked Bookings

**Version:** 1.0  
**Date:** 2026-05-20  
**Status:** Ready for Implementation

---

## 1. Background & Problem Statement

The current registration flow operates in **pure guest mode** for all public users. When someone registers for an event, no authentication check is performed and the resulting `event_registrations` record is saved with `user_id = NULL`, even if that person already has an account.

This creates several gaps compared to how leading ticketing platforms (Ticket2U, HowBeit, Eventbrite) operate:

| Problem                                                        | Impact                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `user_id` is never populated from the public registration form | Dashboard must rely on email-matching fallback; past guest registrations are silently "found" but not ownership-linked |
| No pre-fill of attendee info for logged-in users               | Slower repeat registrations; friction for returning users                                                              |
| No prompt to create an account after guest checkout            | Missed account creation opportunity; users cannot manage tickets without hunting their confirmation email              |
| No clear auth gate at registration entry                       | Users don't understand the benefit of logging in before registering                                                    |

---

## 2. Goals

1. **Primary:** Intercept non-authenticated users at the right moment in the registration flow and give them three clear paths — login, create account, or continue as guest.
2. **Secondary:** Pre-fill Step 2 (Your Info) attendee fields for logged-in users from their profile.
3. **Secondary:** Write `user_id` to `event_registrations` when the submitter is authenticated.
4. **Secondary:** Show a "Create an account" prompt to guests after payment completes.

### Out of Scope

- Retroactively linking old guest registrations via email (the dashboard already does `orWhere('email', ...)` so this is already handled)
- Social login changes
- Admin-side changes

---

## 3. Current System State (Baseline)

### What already exists

- `event_registrations.user_id` — nullable FK column already migrated ✅
- `EventRegistration` model — `user()` BelongsTo relationship already defined ✅
- `UserDashboardController` — already queries by `user_id OR email` ✅
- `LoginModal`, `RegisterModal`, `ForgotPasswordModal` — all exist in `PublicLayout` ✅
- `auth.user` is available as a shared Inertia prop on all public pages ✅

### What does NOT exist

- Auth check / intercept during the registration flow
- `user_id` being written by `EventRegistrationController::store()`
- Profile data pre-fill in `Register.tsx` Step 2
- Post-payment account creation CTA for guests

---

## 4. User Stories

### 4.1 Auth Gate (Intercept Modal)

> **As a** non-logged-in visitor who has selected a ticket and clicked "Next: Your Info",  
> **I want to** be shown my options (sign in / create account / continue as guest)  
> **so that** I can choose whether to link this registration to my account.

**Acceptance criteria:**

- Gate triggers on the Step 1 → Step 2 transition if `auth.user` is null
- Gate shows three clearly labelled actions (see Section 6.1)
- Gate does NOT block the registration — "Continue as Guest" must be available
- After successful login/register via the gate, user lands back on Step 2, not restarted
- If `auth.user` is already set, the gate is skipped entirely

### 4.2 Pre-fill for Logged-In Users

> **As a** logged-in user who reaches Step 2,  
> **I want** my name, email, and phone to be pre-filled for Attendee 1  
> **so that** I don't have to type information the system already knows.

**Acceptance criteria:**

- Attendee 1 fields (`name`, `email`, `phone`) are pre-filled from `auth.user`
- Fields remain editable — user can change them before submitting
- Pre-fill only applies to Attendee 1 (the buyer); subsequent attendees remain blank
- Pre-fill happens silently — no banner needed, but a subtle label like "Using your saved info" is acceptable

### 4.3 Populate `user_id` on Submission

> **As the** system,  
> **I want** `event_registrations.user_id` to be set when an authenticated user submits a registration  
> **so that** their booking is ownership-linked (not just email-matched) in the dashboard.

**Acceptance criteria:**

- `EventRegistrationController::store()` sets `user_id = Auth::id()` when `Auth::check()` is true
- Guest registrations (unauthenticated) continue to save with `user_id = NULL`
- No change to existing email-match logic in `UserDashboardController`

### 4.4 Post-Payment Account Creation CTA (Guest)

> **As a** guest who has just completed payment,  
> **I want to** be offered the option to create an account  
> **so that** I can manage my booking, download my ticket, and speed up future registrations.

**Acceptance criteria:**

- CTA appears on the payment success/confirmation page only when the user is not logged in
- CTA pre-fills the email field of the register modal with the registrant's email
- CTA is dismissible — it must not block access to the confirmation details
- If the user creates an account with the same email, existing dashboard logic (`orWhere('email', ...)`) will surface this registration automatically

---

## 5. Flows

### 5.1 Happy Path — Guest User

```
Event Page
    → [Register] button
        → Step 1: Select Ticket
            → [Next: Your Info]
                → AUTH GATE MODAL appears (user not logged in)
                    → User clicks "Continue as Guest"
                        → Step 2: Your Info (blank fields)
                            → Step 3: Review
                                → Step 4: Payment → Success
                                    → Post-payment page shows:
                                        confirmation details
                                        + "Create account to manage this booking" CTA
```

### 5.2 Happy Path — Guest Chooses to Log In at Gate

```
AUTH GATE MODAL
    → User clicks "Sign In"
        → Login Modal opens (existing component)
            → Login succeeds
                → Gate closes, user is now authenticated
                    → Step 2: Your Info
                        → Attendee 1 pre-filled with profile data
                            → Step 3 → Step 4 → Success
                                → (No post-payment CTA — user is logged in)
```

### 5.3 Happy Path — Already Logged In

```
Event Page
    → [Register] button
        → Step 1: Select Ticket
            → [Next: Your Info]
                → Gate is SKIPPED (auth.user exists)
                    → Step 2: Your Info
                        → Attendee 1 pre-filled
```

---

## 6. Detailed Design

### 6.1 Auth Gate Modal — Content

**Headline:** "Almost there!"  
**Sub-copy:** "Sign in to save this booking to your account, or continue as a guest."

| CTA               | Action                                            | Style                      |
| ----------------- | ------------------------------------------------- | -------------------------- |
| Sign In           | Open LoginModal; on success, proceed to Step 2    | Primary brand button       |
| Create Account    | Open RegisterModal; on success, proceed to Step 2 | Secondary / outline button |
| Continue as Guest | Close gate, proceed to Step 2                     | Ghost / text link          |

**Benefits list shown under the headline** (to encourage login):

- Auto-fill your info
- View booking history in dashboard
- Download QR tickets anytime
- Faster checkout next time

### 6.2 Pre-fill Behaviour

Fields to pre-fill for Attendee 1:

| Form field | Source                                        |
| ---------- | --------------------------------------------- |
| `name`     | `auth.user.name`                              |
| `email`    | `auth.user.email`                             |
| `phone`    | `auth.user.phone` (if exists on user profile) |

All other attendee fields (`company`, `job_title`, etc.) remain blank.

### 6.3 Post-Payment CTA

Placed on the existing payment success page, conditionally rendered when `auth.user === null`.

**Content:**

- Heading: "Save your booking"
- Body: "Create a free account to manage this booking, download your ticket, and get reminders."
- Button: "Create Account" — opens RegisterModal with email pre-filled
- Dismiss: "No thanks" text link

---

## 7. Files Affected

### Backend

| File                                                   | Change                                                   |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `app/Http/Controllers/EventRegistrationController.php` | Set `user_id = Auth::id()` in `store()` if authenticated |

### Frontend

| File                                                              | Change                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `resources/js/Pages/Public/Events/Register.tsx`                   | Add `auth` prop usage; trigger gate on Step 1→2 transition; pass user data to Step 2 |
| `resources/js/Components/RegistrationAuthGate.tsx`                | **New component** — the intercept modal                                              |
| `resources/js/Pages/Public/Events/Register.tsx` (`Step2Info`)     | Pre-fill Attendee 1 from `auth.user` when available                                  |
| `resources/js/Pages/Public/Payment/Success.tsx` _(or equivalent)_ | Add conditional post-payment account creation CTA                                    |

### No Database Changes Required

`event_registrations.user_id` already exists. No new migrations needed.

---

## 8. Implementation Phases

### Phase 1 — Core Gate + `user_id` Write (MVP)

1. Create `RegistrationAuthGate` component
2. Wire gate into `Register.tsx` on Step 1→2 transition
3. Update `EventRegistrationController::store()` to write `user_id`

### Phase 2 — Pre-fill

4. Pass `auth.user` into `Step2Info`
5. Pre-fill Attendee 1 fields on mount

### Phase 3 — Post-Payment CTA

6. Add account creation CTA to payment success page

---

## 9. Edge Cases & Rules

| Scenario                                                              | Behaviour                                                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| User logs in via gate, then logs out mid-flow (back button)           | Gate will re-appear on next Step 1→2 attempt                                                 |
| User is logged in but changes the email in Attendee 1                 | Allowed — `email` on the registration record uses the submitted value, not `auth.user.email` |
| Two users share the same email (shouldn't happen — unique constraint) | N/A                                                                                          |
| User registers as guest, then creates an account with same email      | Dashboard `orWhere('email', ...)` will surface the booking automatically                     |
| Free ticket (no payment)                                              | Post-payment CTA appears on the confirmation/success page regardless of amount               |
| Registration fails validation after auth gate passed                  | Gate does not re-appear — user stays logged in, errors shown on Step 2                       |

---

## 10. Success Metrics

| Metric                                      | Target                                             |
| ------------------------------------------- | -------------------------------------------------- |
| % of registrations with `user_id` populated | > 60% within 30 days (from ~0% today)              |
| Account creation rate from post-payment CTA | Track via click event                              |
| Drop-off rate at auth gate (chose "guest")  | < 40% choosing guest (aim for 60%+ login/register) |
