# Change Request Review (April 2026 to Present)

## Scope

- Repository: `takaful4all-events`
- Review period: `2026-04-01` to `2026-04-27`
- Branch reviewed: `main`

## Summary

- Total commits in period: **16**
- Main contributors:
    - **Faizal Haini Fadzil**: 8 commits
    - **samuraiumm**: 5 commits (including noreply identity)
    - **irfannadzri**: 3 commits

## Commit Timeline (April)

1. `cf07450` (2026-04-12) - UI layout fixes, ticket color labels, venue map, localization, event zones, invoices, GDrive link, social sharing, QR and payment-related improvements.
2. `7917b68` (2026-04-12) - Admin UI overhaul and design consistency across admin pages.
3. `f7b0bfb` (2026-04-13) - Event create/edit form UI modernization.
4. `57e5725` (2026-04-15) - Chip webhook API and deployment fixes.
5. `f96abd6` (2026-04-15) - Media serving fixes and production deployment updates.
6. `471ac3e` (2026-04-15) - MediaController AJAX/Inertia response fixes.
7. `e33427c` (2026-04-16) - Homepage banner slideshow with desktop/mobile images and toggle.
8. `716a59a` (2026-04-16) - iOS Safari camera scanner + deployment improvements.
9. `69fd914` (2026-04-24) - Registration attendees, check-in flow updates, payment success/order/ticket improvements.
10. `8ca8307` (2026-04-24) - Internal versioning/task updates.
11. `7d6686e` (2026-04-24) - Route and middleware updates.
12. `ce2e581` (2026-04-24) - Check-in staff update and registrations/events UI updates.
13. `872d0d7` (2026-04-24) - New migration, settings updates, registration/check-in/indexing enhancements.
14. `fca2638` (2026-04-24) - Reminder/confirmation email improvements and observer/ticket service updates.
15. `8fb1015` (2026-04-27) - Seeder/env/assets update.
16. `2de589c` (2026-04-27) - Deployment artifact bundles.

---

## Change Request Coverage

## 1) General

### 1.1 First come, first served booking lock

**Status:** Implemented (backend locking), partial (live push UX)

**What is done**

- Atomic transaction + pessimistic row locks are implemented during registration.
- Ticket/product availability is rechecked under lock.
- User receives "fully booked" / insufficient capacity feedback.

**Evidence**

- `app/Http/Controllers/EventRegistrationController.php`:
    - `DB::transaction(...)`
    - `lockForUpdate()` usage for tickets/products
    - fully booked message handling

**Gap**

- No websocket/broadcast real-time push found for other users already on the page.

### 1.2 Professional UI/UX consistency

**Status:** Implemented (major progress)

**What is done**

- Admin UI overhaul and consistent component usage across admin modules.
- Event create/edit and index pages updated with improved styling and component patterns.

**Evidence**

- Commits: `7917b68`, `f7b0bfb`, `cf07450`
- `resources/js/Layouts/AdminLayout.tsx`
- `resources/js/Pages/Admin/...`

### 1.3 Auto colour change on booking/status badges

**Status:** Implemented (frontend status mapping)

**What is done**

- Shared status-to-badge mapping helper introduced for registration, payment, availability, event, and role badges.

**Evidence**

- `resources/js/lib/status-colors.ts`

**Gap**

- No explicit model observer updating a separate availability status column; availability is computed from stock/quantities in model accessors.

### 1.4 Dedicated Settings page

**Status:** Implemented

**What is done**

- Dedicated admin settings page with tabs for:
    - General
    - SMTP
    - Payment/ChipIn
    - Booking rules
    - Notifications
    - Invoicing
    - Localisation
    - Shipping zones

**Evidence**

- `resources/js/Pages/Admin/Settings/Index.tsx`
- `routes/web.php` (`admin/settings/*` routes)

---

## 2) Account Management

### 2.1 Separate accounts for Company vs Public

**Status:** Partially implemented (role-based, not account_type flow)

**What is done**

- `users.role` enum expanded to include `company` and `public`.
- Company profile fields added (`company_name`, `company_registration_no`, etc.).
- Admin create/edit form supports role selection and company fields.

**Evidence**

- `database/migrations/2026_04_10_000001_add_company_role_to_users_table.php`
- `app/Http/Controllers/Admin/UserController.php`
- `app/Http/Requests/StoreUserRequest.php`
- `app/Http/Requests/UpdateUserRequest.php`
- `resources/js/Components/UserForm.tsx`

**Gap**

- Public self-registration form still does not branch between company/public paths.
- No separate `account_type` column; system uses `role`.

### 2.2 MTA can create company accounts

**Status:** Implemented (admin route/controller/form)

**What is done**

- Admin user CRUD is available.
- Company accounts can be created and managed from backend.

**Evidence**

- `routes/web.php` (`Route::resource('users', AdminUserController::class)`)
- `app/Http/Controllers/Admin/UserController.php`

**Gap**

- Requested Spatie Permission role assignment is not present in codebase (no `spatie/laravel-permission` integration found).

---

## 3) Pricing & Payment

### 3.1 Zone-based pricing

**Status:** Implemented

**What is done**

- Event zones table and ticket-zone relation added.
- Admin zone CRUD implemented.
- Zones displayed on event page with visual labels/perks.

**Evidence**

- `database/migrations/2026_04_10_100001_create_event_zones_table.php`
- `database/migrations/2026_04_10_100002_add_zone_to_event_tickets_table.php`
- `app/Http/Controllers/Admin/EventZoneController.php`
- `resources/js/Pages/Admin/Events/Zones.tsx`

### 3.2 E-invoice (PDF)

**Status:** Implemented

**What is done**

- DomPDF dependency added.
- Invoice table/model/service implemented.
- Invoice PDF generated and stored.
- Invoice download route/controller implemented.
- Invoice linked from confirmation/order views.

**Evidence**

- `composer.json` (`barryvdh/laravel-dompdf`)
- `database/migrations/2026_04_10_100003_create_invoices_table.php`
- `app/Services/InvoiceService.php`
- `app/Http/Controllers/InvoiceController.php`
- `resources/views/invoices/template.blade.php`
- `routes/web.php` (`/invoices/{invoiceNumber}/download`)

---

## 4) Media & Content

### 4.1 Carousel (homepage/event)

**Status:** Implemented (homepage)

**What is done**

- Embla-based hero carousel with desktop/mobile image support and auto-play.
- Banner admin management and slideshow toggle added.

**Evidence**

- `resources/js/Components/HeroCarousel.tsx`
- `resources/js/Pages/Public/Home.tsx`
- `app/Http/Controllers/Admin/BannerController.php`

### 4.2 Standardize poster + thumbnail

**Status:** Partially implemented

**What is done**

- Upload validation includes minimum width.
- Media service creates thumbnails (`400x225`, 16:9 style output).

**Evidence**

- `app/Http/Requests/MediaUploadRequest.php`
- `app/Services/MediaService.php`

**Gap**

- No strict enforcement of exact poster aspect ratio for all event posters.

### 4.3 Store images with Laravel storage

**Status:** Implemented

**What is done**

- Media files stored through `Storage` and metadata persisted.
- Public serving handled with storage path support.

**Evidence**

- `app/Services/MediaService.php`
- `routes/web.php` (storage serving route)

### 4.4 Google Drive link for media albums

**Status:** Implemented

**What is done**

- `gdrive_link` column added to events.
- Event form captures link.
- Event detail page renders gallery button.

**Evidence**

- `database/migrations/2026_04_10_200003_add_gdrive_link_to_events_table.php`
- `app/Http/Requests/StoreEventRequest.php`
- `resources/js/Components/EventForm.tsx`
- `resources/js/Pages/Public/Events/Show.tsx`

### 4.5 Social media sharing + OG tags

**Status:** Implemented (event page)

**What is done**

- Share buttons for Facebook, WhatsApp, X/Twitter, LinkedIn.
- Event page includes OG/Twitter metadata.

**Evidence**

- `resources/js/Components/ShareButtons.tsx`
- `resources/js/Pages/Public/Events/Show.tsx`

**Gap**

- No global/default OG tags in base Blade template.

---

## 5) Language & Accessibility

### 5.1 Bahasa Melayu support

**Status:** Implemented

**What is done**

- `en` and `ms` locale files maintained.
- Language switch route and UI switcher implemented.
- `locale` column added to users.

**Evidence**

- `lang/en.json`
- `lang/ms.json`
- `routes/web.php` (`/locale/{lang}`)
- `resources/js/Components/LanguageSwitcher.tsx`
- `database/migrations/2026_04_11_000001_add_locale_to_users_table.php`

### 5.2 QR code per booking + invoice

**Status:** Implemented

**What is done**

- QR package installed.
- QR generated in invoice and ticket services.
- QR displayed on confirmation page.

**Evidence**

- `composer.json` (`simplesoftwareio/simple-qrcode`)
- `app/Services/InvoiceService.php`
- `app/Services/TicketService.php`
- `resources/js/Pages/Public/Events/Confirmation.tsx`

---

## Open Items Before May Event Deadline

1. Complete company/public self-registration split in public auth flow (or formalize role-based approach in requirements).
2. Decide and implement role/permission model (if Spatie Permission is required by governance).
3. Add real-time seat availability updates (broadcast/WebSocket) if strict live updates are mandatory.
4. Enforce exact poster aspect ratio rules if required by branding standard.
5. Run UAT pass specifically for:
    - booking contention (double-submit/parallel users)
    - invoice generation/download for paid and free paths
    - language switching and persistence
    - check-in scanner (iOS Safari + Android)
    - GDrive link workflow for post-event photo publishing

---

## Suggested UAT Checklist

1. Booking lock test with 2 simultaneous users for the final slot.
2. Verify status badges for all key states (available/limited/fully booked, pending/confirmed/cancelled, paid/pending/refunded).
3. Create company account via admin and verify role behavior.
4. Complete paid booking and verify:
    - invoice record created
    - invoice PDF downloadable
    - QR is visible in confirmation/invoice/ticket
    - confirmation email contains expected links
5. Toggle settings tabs (booking/notifications/invoicing/localisation) and verify persistence.
6. Upload banner/poster images and verify thumbnail rendering and responsive behavior.
7. Validate event page share links and OG preview behavior.
8. Verify BM/EN switcher and translated keys across critical pages.

---

## Notes

- This review is based on Git commit history and current code state in `main` as of `2026-04-27`.
- Deployment artifact commits (`deploy/dist/*.zip`) were excluded from functional assessment unless tied to code changes.
