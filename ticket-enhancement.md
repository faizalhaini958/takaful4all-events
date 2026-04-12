# Ticket Enhancement Plan
# Takaful Events Platform — Zone-Based Ticket Tiers

**Date:** 12 April 2026  
**Status:** In Progress

---

## 1. Overview

Enhance the existing zone-based ticket system with richer tier presentation, early bird pricing, and an improved public ticket selection experience — inspired by SBID Awards and La Comedia Dinner Theatre ticket pages.

---

## 2. What Already Exists

| Component | State |
|---|---|
| `EventZone` model | name, description, color (hex), capacity, sort_order |
| `EventTicket` model | name, description, type, price, quantity, sale windows, zone link |
| `TicketDiscountTier` model | Bulk quantity discounts per ticket |
| Admin Zones page | CRUD with color picker, capacity, sort order |
| Admin Tickets page | CRUD with zone selector, pricing, sale dates |
| Public Register page | Zone-grouped ticket radio selection with pricing |

---

## 3. Enhancements

### 3.1 EventZone — New Fields

| Field | Type | Purpose |
|---|---|---|
| `label_color` | string (hex), default `#ffffff` | Text color for the zone badge (supports dark/light zone backgrounds) |
| `perks` | JSON array of strings | Bullet-point features shown on public ticket cards (e.g. "VIP access", "3-course lunch") |
| `image_path` | string, nullable | Optional zone photo (e.g. view from section) |
| `map_image_path` | string, nullable | Optional venue/seating map image for this event |

### 3.2 EventTicket — New Fields

| Field | Type | Purpose |
|---|---|---|
| `early_bird_price` | decimal(10,2), nullable | Discounted price during early bird window |
| `early_bird_end_at` | datetime, nullable | When early bird pricing expires |

**Logic:** If `early_bird_end_at` is set and `now() < early_bird_end_at`, display and charge `early_bird_price` instead of `price`. The original `price` becomes the "regular" price shown with a strikethrough.

### 3.3 Event — New Field

| Field | Type | Purpose |
|---|---|---|
| `venue_map_media_id` | FK to media, nullable | Venue/seating map image (uploaded via media manager) |

---

## 4. Admin Experience

### 4.1 Zones Form (Enhanced)
- Existing: name, description, color, capacity, sort order
- New: label color picker, perks list (add/remove string items), zone image upload

### 4.2 Tickets Form (Enhanced)
- Existing: all current fields
- New: early bird price field (shown when type = paid), early bird end date

---

## 5. Public Experience

### 5.1 Registration Page (Enhanced)
- Display venue map image at top of ticket selection (if uploaded)
- Zone cards show color badge, perks list, and zone image
- Early bird pricing displayed with countdown/badge + strikethrough regular price
- "Early Bird" badge on qualifying tickets

---

## 6. Files to Change

### Backend
| File | Changes |
|---|---|
| New migration | Add `label_color`, `perks`, `image_path` to `event_zones`; add `early_bird_price`, `early_bird_end_at` to `event_tickets`; add `venue_map_media_id` to `events` |
| `EventZone.php` | Add fillable + casts for new fields, `image_url` accessor |
| `EventTicket.php` | Add fillable + casts, `current_price` + `is_early_bird` accessors |
| `EventZoneController.php` | Update validation for new fields |
| `StoreEventTicketRequest.php` | Add early bird validation rules |
| `EventRegistrationController.php` | Pass venue map + enhanced zone/ticket data to public page |

### Frontend
| File | Changes |
|---|---|
| `types/index.ts` | Add new fields to EventZone and EventTicket interfaces |
| `Admin/Events/Zones.tsx` | Add perks editor, label color picker, image upload |
| `Admin/Events/Tickets.tsx` | Add early bird price/date fields |
| `Public/Events/Register.tsx` | Venue map display, enhanced zone cards with perks, early bird badges |
| `lang/en.json` & `lang/ms.json` | New translation keys |

---

## 7. Migration Details

```sql
-- event_zones additions
ALTER TABLE event_zones ADD label_color VARCHAR(7) DEFAULT '#ffffff';
ALTER TABLE event_zones ADD perks JSON NULL;
ALTER TABLE event_zones ADD image_path VARCHAR(255) NULL;

-- event_tickets additions
ALTER TABLE event_tickets ADD early_bird_price DECIMAL(10,2) NULL;
ALTER TABLE event_tickets ADD early_bird_end_at TIMESTAMP NULL;

-- events additions
ALTER TABLE events ADD venue_map_media_id BIGINT UNSIGNED NULL REFERENCES media(id) ON DELETE SET NULL;
```
