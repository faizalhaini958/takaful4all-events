# Upgrade & Improvement Plan
# Takaful Events Platform — v2.0

**Project:** Takaful Events Management System  
**Owner:** Malaysian Takaful Association (MTA)  
**Date:** 10 April 2026  
**Status:** Proposed  
**Baseline:** PRD v1.0 (24 February 2026)

---

## 1. Overview

This document captures all client-requested improvements to the Takaful Events Platform, organised into phased delivery. Each item maps to a specific client comment, describes what currently exists, what changes are needed, and lists the technical deliverables.

---

## 2. Current System Baseline

| Area | State |
|---|---|
| **Stack** | Laravel 12 + Inertia.js + React + TypeScript + TailwindCSS + shadcn/ui |
| **Auth** | Session-based. Roles: `admin`, `editor` |
| **Events** | Full CRUD. Tickets with pricing, inventory, sale windows |
| **Registrations** | Multi-attendee booking with reference numbers, statuses, check-in |
| **Payments** | Chip-In gateway integration (create purchase, webhook verification) |
| **Settings** | Admin settings page — SMTP and Chip-In tabs |
| **Media** | Upload, grid view, preview, Laravel Storage facade |
| **Content** | Pages, Posts (article/podcast/webinar/agent360), Menus — all admin-managed |

---

## 3. Phase Summary

| Phase | Focus | Items |
|---|---|---|
| **Phase 1** | Booking Integrity & Account System | Double-booking prevention, Company role, Admin user management, Status badges |
| **Phase 2** | Pricing, Payments & Invoicing | Bulk discount tiers, E-invoice PDF, QR codes |
| **Phase 3** | Media, Content & Sharing | Carousel, Image standardisation, Google Drive links, Social sharing, OG tags |
| **Phase 4** | Localisation & Settings | Bahasa Melayu support, Expanded admin settings |

---

## 4. Phase 1 — Booking Integrity & Account System

> **Goal:** Prevent double bookings, introduce the Company role for bulk purchasing, and add admin-managed user accounts.

### 4.1 Double-Booking Prevention

**Client Comment:** *"First come, first served — lock slot immediately upon confirmation. Show Fully Booked in real-time."*

**Current State:** `EventTicket` tracks `sold_count` / `available_count`. Registration controller checks availability but does **not** use database-level locking.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Pessimistic row lock | Wrap registration creation in `DB::transaction()` with `lockForUpdate()` on the `event_tickets` row |
| 2 | Atomic availability check | `EventTicket::where('id', $id)->lockForUpdate()->first()` — recheck `available_count` inside the transaction |
| 3 | Queued registration job | Optional `ProcessRegistration` queued job for high-concurrency events |
| 4 | Real-time "Fully Booked" UI | Disable register button when `available_count <= 0`; Inertia page reload reflects current state |
| 5 | Race-condition error message | Return user-friendly error if lock contention causes failure |

**Files Affected:**
- `app/Http/Controllers/EventRegistrationController.php` — add `lockForUpdate()` in `store()`
- `app/Models/EventTicket.php` — no structural change (accessors already exist)
- `resources/js/Pages/Public/Events/Register.tsx` — disable CTA when sold out

---

### 4.2 Company Role & Bulk Purchasing

**Client Comment:** *"Company accounts that can purchase tickets on behalf of staff, with discounted pricing for bulk purchases."*

**Current State:** `users.role` enum has only `admin | editor`. No company concept. Registration is anonymous (email-based, no `user_id` link). Pricing is flat per ticket.

**Changes Required:**

#### 4.2.1 Schema — Users

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `add_company_role_to_users` | Alter `role` enum → `admin \| editor \| company \| public` (default: `public`) |
| 2 | Company profile columns | Add to `users`: `company_name` (string, nullable), `company_registration_no` (string, nullable), `company_address` (text, nullable), `company_phone` (string, nullable) |
| 3 | Update `User` model | Add new fields to `$fillable`, add `isCompany()` helper |

#### 4.2.2 Schema — Bulk Discount Tiers

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `create_ticket_discount_tiers` | New table: `id`, `event_ticket_id` (FK), `min_quantity` (int), `discount_type` enum(`percentage`, `fixed`), `discount_value` (decimal:2), `timestamps` |
| 2 | `TicketDiscountTier` model | Belongs to `EventTicket`. Scopes: `forQuantity($qty)` |
| 3 | Seed example | 5+ → 10% off, 10+ → 15% off, 20+ → 20% off |

**Discount tier example:**

```
┌─────────────────┬──────────────┬───────────────┬────────────────┐
│ event_ticket_id │ min_quantity  │ discount_type │ discount_value │
├─────────────────┼──────────────┼───────────────┼────────────────┤
│ 1               │ 5            │ percentage    │ 10.00          │
│ 1               │ 10           │ percentage    │ 15.00          │
│ 1               │ 20           │ percentage    │ 20.00          │
└─────────────────┴──────────────┴───────────────┴────────────────┘
```

The **highest qualifying tier** (where `min_quantity <= order quantity`) applies.

#### 4.2.3 Schema — Registration Link

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `add_user_id_to_event_registrations` | Add nullable `user_id` FK to `event_registrations`. Add `discount_amount` (decimal:2, default 0) |
| 2 | Update `EventRegistration` model | Add `user()` → BelongsTo relationship |

#### 4.2.4 Pricing Service

| # | Deliverable | Details |
|---|---|---|
| 1 | `RegistrationPricingService` | Service class with `calculateTotal(ticket, quantity, products, ?user)` |
| 2 | Discount logic | If `user.role === company` → find highest matching tier → apply discount to subtotal |
| 3 | Return DTO | `{ subtotal, discount_amount, discount_label, products_total, grand_total }` |

#### 4.2.5 Registration Flow (Company)

| # | Deliverable | Details |
|---|---|---|
| 1 | Company registration form | Logged-in company user sees "Register Staff" flow — add named attendees per ticket |
| 2 | Staff attendee fields | Each attendee: `name`, `email`, `phone`, `job_title`, `dietary_requirements` |
| 3 | Price preview | Live-updating price breakdown showing base price, bulk discount, and grand total |
| 4 | Individual tickets | Each staff attendee gets their own ticket entry (for QR/check-in in Phase 2) |

#### 4.2.6 Company Dashboard

| # | Deliverable | Details |
|---|---|---|
| 1 | `/dashboard` for company users | View all registrations across events |
| 2 | Staff list per registration | Expand/collapse attendee details |
| 3 | Edit attendee details | Allow changes before event date |
| 4 | Download receipts | Link to invoice/receipt (Phase 2) |

**Files Affected:**
- New migration files (×3)
- `app/Models/User.php` — new fields, `isCompany()`, `isPublic()` helpers
- New `app/Models/TicketDiscountTier.php`
- `app/Models/EventTicket.php` — add `discountTiers()` relationship
- `app/Models/EventRegistration.php` — add `user()` relationship, `discount_amount`
- New `app/Services/RegistrationPricingService.php`
- `app/Http/Controllers/EventRegistrationController.php` — use pricing service
- `resources/js/Pages/Public/Events/Register.tsx` — company flow variant
- `resources/js/Pages/User/` — company dashboard pages

---

### 4.3 Admin User Management

**Client Comment:** *"MTA can create company accounts."*

**Current State:** No user CRUD in admin panel.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | `Admin\UserController` | Index (DataTable), Create, Edit, Delete |
| 2 | Admin routes | `admin/users` resource routes |
| 3 | Create company account form | Set role = `company`, fill company profile fields, set password |
| 4 | Role filter | DataTable filterable by role |
| 5 | React pages | `resources/js/Pages/Admin/Users/Index.tsx`, `Create.tsx`, `Edit.tsx` |
| 6 | Sidebar link | Add "Users" to admin sidebar navigation |

---

### 4.4 Status Badge Colours

**Client Comment:** *"Auto colour change on booking status."*

**Current State:** Badge component exists in UI kit. Status enum exists on registration. No colour mapping.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Status colour map utility | Shared React constant mapping status → colour variant |
| 2 | Apply to all status badges | Registration status, payment status, event availability, ticket availability |

**Colour Map:**

| Status | Colour | Usage |
|---|---|---|
| `available` / `confirmed` / `paid` | Green | Positive states |
| `pending` | Yellow | Awaiting action |
| `cancelled` / `failed` / `refunded` | Red | Negative states |
| `waitlisted` | Orange | Intermediate |
| `attended` | Blue | Completed |
| `fully_booked` | Grey | No availability |

**Files Affected:**
- New `resources/js/lib/status-colors.ts` — colour map utility
- All admin/public pages rendering status badges

---

## 5. Phase 2 — Pricing, Payments & Invoicing

> **Goal:** E-invoice generation, QR codes for check-in, and zone-based pricing structure.

### 5.1 Zone-Based Pricing

**Client Comment:** *"Create zones with configurable price tiers. Display pricing clearly on booking page."*

**Current State:** `EventTicket` has a flat `price` per ticket type. No zone concept.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `create_event_zones` | `id`, `event_id` (FK), `name`, `description`, `color` (hex), `capacity` (nullable int), `sort_order`, `timestamps` |
| 2 | **Migration:** `add_zone_to_event_tickets` | Add nullable `event_zone_id` FK to `event_tickets` |
| 3 | `EventZone` model | Belongs to `Event`, has many `EventTicket` |
| 4 | Admin: Zone management | Tab on event edit page — add/edit/delete zones per event with name, colour, capacity |
| 5 | Admin: Link ticket to zone | Dropdown on ticket form to assign a zone |
| 6 | Public: Zone display | Booking page shows zones visually (colour-coded cards or map) with prices per zone |

---

### 5.2 E-Invoice PDF

**Client Comment:** *"Generate PDF invoice after successful payment. Include booking details, company info, amount, unique invoice number."*

**Current State:** `jspdf` available on frontend. No backend PDF generation. No invoices table.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Install `barryvdh/laravel-dompdf` | Composer package for server-side PDF rendering |
| 2 | **Migration:** `create_invoices` | `id`, `registration_id` (FK), `user_id` (nullable FK), `invoice_number` (unique), `company_name`, `company_registration_no`, `subtotal`, `discount_amount`, `total_amount`, `issued_at`, `pdf_path`, `meta_json`, `timestamps` |
| 3 | `Invoice` model | Belongs to `EventRegistration`, belongs to `User` |
| 4 | Invoice number format | `INV-YYYYMMDD-XXXX` (auto-generated, unique) |
| 5 | Blade invoice template | `resources/views/invoices/template.blade.php` — MTA letterhead, booking details, line items, totals, QR code |
| 6 | Auto-generation | Eloquent Observer on `EventRegistration` — generate invoice when `payment_status` changes to `paid` |
| 7 | Storage | Save PDF to `storage/app/invoices/{year}/{invoice_number}.pdf` |
| 8 | Download endpoint | `GET /invoices/{invoice_number}/download` — authorized access only |
| 9 | User dashboard | "Download Invoice" button on order detail page |
| 10 | Email attachment | Attach invoice PDF to payment confirmation email |

**Company Invoice Note:** When the registering user has role `company`, invoice should include `company_name` and `company_registration_no` from their profile.

---

### 5.3 QR Code

**Client Comment:** *"Unique QR code per booking for confirmation page and event check-in."*

**Current State:** `qrcode.react` already installed on frontend. No backend QR generation.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Install `simplesoftwareio/simple-qrcode` | Backend QR generation for PDF embedding |
| 2 | Frontend QR | Use `qrcode.react` on booking confirmation page — encodes `/events/{slug}/register/confirmation/{reference}` |
| 3 | PDF QR | Embed QR image in DomPDF invoice template using `simple-qrcode` |
| 4 | Per-attendee QR | For company bulk bookings — each staff attendee gets a unique QR linking to their individual check-in record |
| 5 | Staff check-in endpoint | `POST /admin/registrations/{reference}/check-in` — scan QR to mark attendance |
| 6 | Check-in UI | Admin mobile-friendly page for scanning QR codes at event venue |

---

## 6. Phase 3 — Media, Content & Sharing

> **Goal:** Improve media handling, add homepage carousel, enable social sharing with proper link previews.

### 6.1 Homepage Carousel

**Client Comment:** *"Add image carousel on homepage or event detail page."*

**Current State:** No carousel component. No carousel library installed.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Install `embla-carousel-react` | Lightweight, accessible React carousel |
| 2 | `HeroCarousel` component | Full-width carousel for homepage hero section |
| 3 | Admin: Carousel management | New settings tab or dedicated "Banners" section — upload images, set order, link URL, toggle active |
| 4 | **Migration:** `create_banners` | `id`, `title`, `image_path`, `link_url` (nullable), `sort_order`, `is_active`, `timestamps` |
| 5 | `Banner` model | Simple model with `active()` scope |

---

### 6.2 Image Standardisation

**Client Comment:** *"Standardize poster + thumbnail format. Fixed aspect ratio (16:9). Enforce dimension validation."*

**Current State:** `intervention/image` already installed. Media upload exists. No dimension validation or auto-thumbnail.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Upload validation rule | `'image' => ['image', 'dimensions:min_width=800']` on event poster upload |
| 2 | Auto-thumbnail generation | Use `intervention/image` to create 400×225 thumbnail on upload |
| 3 | **Migration:** `add_thumbnail_to_media` | Add `thumbnail_path` (nullable string) to `media` table |
| 4 | Aspect ratio enforcement | Frontend cropper component for 16:9 ratio before upload |
| 5 | Listing pages | Use `thumbnail_path` for event cards, full `path` for detail pages |

---

### 6.3 Image Storage Organisation

**Client Comment:** *"Organize images by folder e.g. events/{event_id}/poster.jpg."*

**Current State:** Images stored in flat structure via Laravel Storage.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | Folder convention | `events/{event_id}/`, `banners/`, `posts/{post_id}/`, `general/` |
| 2 | Update `MediaService` | Accept a `folder` parameter when storing uploads |
| 3 | Admin media browser | Optional folder navigation in media manager |

---

### 6.4 Google Drive Link

**Client Comment:** *"Allow admins to attach a GDrive link per event for full photo/video albums."*

**Current State:** No `gdrive_link` column on events.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `add_gdrive_link_to_events` | Add `gdrive_link` (nullable string) to `events` table |
| 2 | Admin event form | Text input field for Google Drive URL |
| 3 | Validation | Validate URL format (must be a valid URL) |
| 4 | Public event page | "View Full Gallery" button linking to `gdrive_link` (opens in new tab) |

---

### 6.5 Social Media Sharing & Open Graph

**Client Comment:** *"Add share buttons. Use Open Graph meta tags so links preview correctly when shared."*

**Current State:** No share buttons. No OG meta tags in layout.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | OG meta tags in root layout | Add `og:title`, `og:description`, `og:image`, `og:url`, `og:type` to `resources/views/app.blade.php` |
| 2 | Inertia shared data | Pass page-specific OG data from controllers via `Inertia::share()` or page props |
| 3 | `ShareButtons` React component | Facebook, WhatsApp, X/Twitter, LinkedIn — using URL-based share links (no SDKs) |
| 4 | Event detail page | Add `ShareButtons` below event title or in a sticky sidebar |
| 5 | Twitter Card tags | Add `twitter:card`, `twitter:title`, `twitter:image` alongside OG tags |

---

## 7. Phase 4 — Localisation & Settings

> **Goal:** Bahasa Melayu language support and expanded admin configuration.

### 7.1 Bahasa Melayu (i18n)

**Client Comment:** *"Implement Bahasa Melayu support with language switcher."*

**Current State:** No localisation. All strings hardcoded in English in React components.

**Changes Required:**

| # | Deliverable | Details |
|---|---|---|
| 1 | **Migration:** `add_locale_to_users` | Add `locale` (string, default `en`) to `users` table |
| 2 | Translation files | Create `lang/en.json` and `lang/ms.json` with all UI strings |
| 3 | Inertia shared translations | Pass active locale + translation strings via `HandleInertiaRequests` middleware |
| 4 | `useTranslation()` React hook | `t('key')` helper that reads translations from Inertia shared props |
| 5 | Language switcher component | Navbar dropdown — stores preference in session (guest) or `users.locale` (authenticated) |
| 6 | Backend route | `POST /locale/{lang}` to switch language |
| 7 | Content translations | For admin-managed content (events, pages), add optional BM fields or a `translations` JSON column |

**Approach:** Implement the i18n infrastructure first (hook, middleware, switcher). Then translate strings incrementally — public-facing pages first, admin panel second.

---

### 7.2 Expanded Admin Settings

**Client Comment:** *"Admin panel needs a dedicated Settings page for global configurations — booking rules, zone pricing, notification toggles."*

**Current State:** Settings page exists with SMTP and Chip-In tabs. `Setting` model supports grouped key-value with encryption.

**Changes Required:**

| # | Deliverable | Tab Group |
|---|---|---|
| 1 | **General** tab | Site name, site logo, footer text, contact email, contact phone |
| 2 | **Booking Rules** tab | Default max attendees, default require approval, registration cutoff hours before event, waitlist enabled |
| 3 | **Notifications** tab | Send confirmation email (toggle), send reminder email (toggle), reminder hours before event, send cancellation email (toggle) |
| 4 | **Invoicing** tab | Company name on invoice, company registration no., company address, invoice prefix (default `INV`), tax rate (if applicable) |
| 5 | **Localisation** tab | Default locale, available locales toggle |

**Files Affected:**
- `app/Http/Controllers/Admin/SettingController.php` — add new tab handlers
- `resources/js/Pages/Admin/Settings/Index.tsx` — add new tab panels

---

## 8. New Dependencies

### Backend (Composer)

| Package | Phase | Purpose |
|---|---|---|
| `barryvdh/laravel-dompdf` | 2 | Server-side PDF invoice generation |
| `simplesoftwareio/simple-qrcode` | 2 | Backend QR code generation for PDF embedding |

### Frontend (npm)

| Package | Phase | Purpose |
|---|---|---|
| `embla-carousel-react` | 3 | Lightweight React carousel |

---

## 9. Migration Summary

| Phase | Migration | Key Changes |
|---|---|---|
| 1 | `add_company_role_to_users` | Alter `role` enum → add `company`, `public`. Add `company_name`, `company_registration_no`, `company_address`, `company_phone` |
| 1 | `create_ticket_discount_tiers` | `event_ticket_id`, `min_quantity`, `discount_type`, `discount_value` |
| 1 | `add_user_id_to_event_registrations` | Add `user_id` FK, `discount_amount` column |
| 2 | `create_event_zones` | `event_id`, `name`, `description`, `color`, `capacity`, `sort_order` |
| 2 | `add_zone_to_event_tickets` | Add `event_zone_id` FK |
| 2 | `create_invoices` | `registration_id`, `user_id`, `invoice_number`, `pdf_path`, amounts, `meta_json` |
| 3 | `create_banners` | `title`, `image_path`, `link_url`, `sort_order`, `is_active` |
| 3 | `add_thumbnail_to_media` | Add `thumbnail_path` |
| 3 | `add_gdrive_link_to_events` | Add `gdrive_link` |
| 4 | `add_locale_to_users` | Add `locale` column |

---

## 10. New Models

| Phase | Model | Table |
|---|---|---|
| 1 | `TicketDiscountTier` | `ticket_discount_tiers` |
| 2 | `EventZone` | `event_zones` |
| 2 | `Invoice` | `invoices` |
| 3 | `Banner` | `banners` |

---

## 11. New Controllers

| Phase | Controller | Purpose |
|---|---|---|
| 1 | `Admin\UserController` | User/company account CRUD |
| 2 | `InvoiceController` | Download/view invoice PDF |

---

## 12. New Services

| Phase | Service | Purpose |
|---|---|---|
| 1 | `RegistrationPricingService` | Calculate totals with discount logic for company bulk purchases |

---

## 13. Updated Stakeholder Roles

| Role | Current | After Upgrade |
|---|---|---|
| MTA Admin | Manage events, pages, media, posts | + Manage users, company accounts, zones, banners, invoices, expanded settings |
| MTA Editor | Create/edit content | No change |
| **Company (NEW)** | — | Register staff for events, bulk purchasing with discounts, view bookings & invoices |
| **Public User (NEW role)** | Browse & register (anonymous) | Registered account, personal dashboard, booking history |
| Developer | Build, deploy, maintain | No change |

---

## 14. Acceptance Criteria (per Phase)

### Phase 1
- [ ] Two users attempting to book the last ticket simultaneously — only one succeeds, the other sees "Fully Booked"
- [ ] Admin can create a company account with company profile fields
- [ ] Company user can register 10 staff for an event and see the bulk discount applied
- [ ] All status badges across admin and public pages show correct colours
- [ ] Admin Users page lists all users with role filter

### Phase 2
- [ ] Admin can define zones per event and assign tickets to zones
- [ ] Public booking page displays zone-based pricing clearly
- [ ] PDF invoice is auto-generated on successful payment with correct details and QR code
- [ ] Invoice is downloadable from user dashboard
- [ ] QR code on confirmation page links to a scannable check-in endpoint
- [ ] Staff can scan QR at event to mark attendee as checked in

### Phase 3
- [ ] Homepage shows an admin-managed image carousel
- [ ] Uploaded event posters are validated for minimum 800px width
- [ ] Thumbnails are auto-generated at 400×225 for listing pages
- [ ] Google Drive link field appears on event form and renders as button on public page
- [ ] Sharing an event page on Facebook/WhatsApp shows correct title, image, and description

### Phase 4
- [ ] User can switch between English and Bahasa Melayu on public pages
- [ ] Language preference persists across page navigations
- [ ] Admin Settings page has General, Booking Rules, Notifications, Invoicing, and Localisation tabs
- [ ] All public-facing UI strings are translatable
