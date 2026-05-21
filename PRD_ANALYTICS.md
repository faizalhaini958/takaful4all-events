# Product Requirements Document (PRD)

# Takaful Events Platform — Visitor Analytics Feature

**Project:** Takaful Events Management System — Analytics Module  
**Owner:** Malaysian Takaful Association (MTA)  
**Date:** 15 May 2026  
**Status:** Approved for Development  
**Related PRD:** PRD.md (v1.0 base platform)

---

## 1. Executive Summary

Add a privacy-respecting, first-party visitor analytics system embedded directly into the existing admin panel. The system captures meaningful behavioural signals — page views, event engagement, registration funnel steps — without relying on third-party tools (Google Analytics, Facebook Pixel, etc.). All data stays on-server. No cookie consent banner is required. The feature targets operational intelligence: helping admins understand which events attract interest, where visitors drop off in the registration funnel, and how traffic patterns shift over time.

---

## 2. Goals

| Goal                       | Description                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- |
| Operational Visibility     | Admins can see real-time and historical visitor behaviour from within the admin panel |
| Event Performance          | Per-event metrics: views, register clicks, conversion rate, funnel drop-off           |
| Privacy by Default         | No raw PII stored; IPs hashed; anonymous sessions; Do Not Track respected             |
| No External Dependencies   | All data stays in the existing MySQL database; no third-party analytics APIs          |
| Minimal Performance Impact | All writes are async via the existing database queue; zero impact on page load        |
| Maintainability            | Narrow scope — tracks only what has clear business value, nothing more                |

---

## 3. Non-Goals (Out of Scope)

- Replacing Google Analytics for SEO/traffic-source intelligence
- Session replay or heatmap recording
- Real-time WebSocket push (polling is sufficient)
- Tracking admin panel usage (only public-facing routes)
- Precise geolocation (city/coordinate level)
- Cross-device user identity linking
- Cookie consent banner (not required for first-party anonymous analytics)

---

## 4. Stakeholders

| Role               | Concern                                                 |
| ------------------ | ------------------------------------------------------- |
| MTA Admin          | See overall site traffic, top events, funnel conversion |
| MTA Editor         | See per-event performance for events they manage        |
| Developer          | Build, maintain, extend the system                      |
| Legal / Compliance | PDPA 2010 (Malaysia) compliance; no raw PII stored      |

---

## 5. Functional Requirements

### 5.1 Data Captured

#### Server-Side (automatic — via Middleware)

| Data Point     | Storage                                    | Notes                                                                        |
| -------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Page URL       | Raw                                        | Full path + query string                                                     |
| Route name     | Raw                                        | e.g. `events.show`, `home`                                                   |
| HTTP Referrer  | Domain only                                | Strip path and query from referrer to avoid capturing PII from referrer URLs |
| Session ID     | UUID (cookie)                              | Anonymous until user authenticates                                           |
| User ID        | FK nullable                                | Linked only after the visitor authenticates                                  |
| Device type    | `mobile / tablet / desktop`                | Derived from User-Agent; no raw UA stored                                    |
| Browser family | `chrome / firefox / safari / edge / other` | Derived from User-Agent; no raw UA stored                                    |
| Country code   | ISO 3166-1 alpha-2                         | Derived from IP; no raw IP stored                                            |
| IP hash        | SHA-256 + server salt                      | Irreversible; used only for same-visitor detection within session            |
| UTM parameters | `utm_source`, `utm_medium`, `utm_campaign` | Captured from URL query string when present                                  |

#### Client-Side (intentional — via JS hook → `/track` endpoint)

| Event Type    | Category          | Label                                   | When Fired                                                  |
| ------------- | ----------------- | --------------------------------------- | ----------------------------------------------------------- |
| `click`       | `event_card`      | event slug                              | User clicks an event card on the homepage or events listing |
| `click`       | `register_button` | event slug                              | User clicks the Register button on an event detail page     |
| `view`        | `event_detail`    | event slug                              | Event detail page finishes loading (measures genuine views) |
| `funnel_step` | `registration`    | `step_1 / step_2 / payment / confirmed` | User advances through each registration step                |
| `click`       | `banner`          | banner ID/title                         | User clicks a homepage banner                               |
| `click`       | `webinar_card`    | post slug                               | User clicks a webinar card                                  |
| `click`       | `podcast_card`    | post slug                               | User clicks a podcast card                                  |

> **Rule:** `event_data` JSON payload must never contain personal data (name, email, IC, phone). The controller validates this on every inbound tracking request.

---

### 5.2 Admin Analytics Dashboard

**Route:** `GET /admin/analytics`  
**Access:** Admin and Editor roles only

#### Overview Tab

| Widget                           | Description                                                        |
| -------------------------------- | ------------------------------------------------------------------ |
| Total Visitors (unique sessions) | Date-range selectable; default last 30 days                        |
| Total Page Views                 | Same date range                                                    |
| New vs Returning Visitors        | Ratio card                                                         |
| Top 10 Pages                     | Table: page URL, route name, view count                            |
| Traffic by Device Type           | Donut chart: mobile / tablet / desktop                             |
| Traffic by Browser               | Donut chart                                                        |
| Traffic by Country               | Table: country code + flag, session count                          |
| Visitors Over Time               | Line chart — daily unique sessions over selected range             |
| Page Views Over Time             | Line chart — daily page views over selected range                  |
| Top Referrer Domains             | Table: referrer domain, session count                              |
| UTM Campaign Summary             | Table: utm_source, utm_medium, utm_campaign, sessions, conversions |

#### Events Tab

| Widget                     | Description                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Event Performance Table    | Per-event: views, unique visitors, register clicks, registrations, conversion rate |
| Top Events (by views)      | Bar chart — top 10 events by total views                                           |
| Top Events (by conversion) | Bar chart — top 10 events by registration conversion rate                          |

#### Funnel Tab

| Widget                     | Description                                                                       |
| -------------------------- | --------------------------------------------------------------------------------- |
| Global Registration Funnel | Funnel chart: Event View → Register Click → Step 1 → Step 2 → Payment → Confirmed |
| Per-Event Funnel           | Same funnel filtered to a single selected event                                   |
| Drop-off Rate              | Percentage lost at each funnel step                                               |

#### Real-Time Tab

| Widget                 | Description                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Active Visitors Now    | Count of sessions with `last_seen_at > now() - 5 minutes`; auto-refreshes every 30 seconds |
| Pages Being Viewed Now | Table: page URL, active visitor count                                                      |

---

### 5.3 Per-Event Analytics Panel

Inside each event's admin detail page (`/admin/events/{slug}`), add a collapsible **Analytics** section showing:

- Total views (all time)
- Unique visitors (all time)
- Register button clicks
- Completed registrations (from `event_registrations` table — existing data)
- Conversion rate: registrations ÷ views
- Views over time: mini line chart (last 30 days)

This connects existing registration data to new analytics data for a complete picture.

---

### 5.4 Data Retention Policy

| Table                       | Retention  | Action                                             |
| --------------------------- | ---------- | -------------------------------------------------- |
| `visitor_sessions`          | 12 months  | Scheduled command purges rows older than 12 months |
| `page_views`                | 12 months  | Same                                               |
| `analytics_events`          | 12 months  | Same                                               |
| `analytics_daily_summaries` | Indefinite | Pre-aggregated; small size; never purged           |

---

### 5.5 Bot Filtering

- Middleware checks `User-Agent` against a maintained list of known crawler signatures (Googlebot, Bingbot, etc.)
- Requests matching bot patterns are skipped entirely — no row written
- Requests with empty or missing `User-Agent` are also skipped

---

### 5.6 Privacy & Security Requirements

| Requirement               | Implementation                                                                    |
| ------------------------- | --------------------------------------------------------------------------------- |
| No raw IP storage         | SHA-256 hash with `APP_KEY`-derived salt before any write                         |
| Respect DNT header        | Middleware checks `DNT: 1`; skips tracking if set                                 |
| No PII in event payloads  | `AnalyticsController` validates `event_label` and `event_data` fields server-side |
| Admin-only access         | All `/admin/analytics` routes protected by existing `auth + admin` middleware     |
| Rate limiting on `/track` | `throttle:60,1` (60 requests per minute per session) to prevent abuse             |
| No cross-site tracking    | First-party session cookie only; no third-party scripts involved                  |
| Data minimisation         | Only data with a stated business purpose is collected                             |

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPTURE LAYER                            │
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │  TrackPageView           │  │  useAnalytics (React)   │ │
│  │  Middleware              │  │  hook                   │ │
│  │  (all public routes)     │  │  POST /track            │ │
│  │  • Bot filter            │  │  • fire-and-forget      │ │
│  │  • DNT check             │  │  • client-side events   │ │
│  │  • Session resolve       │  │                         │ │
│  └────────────┬─────────────┘  └────────────┬────────────┘ │
│               └──────────────┬───────────────┘             │
├──────────────────────────────┼──────────────────────────────┤
│                    PROCESSING LAYER                          │
│                                                             │
│  AnalyticsService                                           │
│  • resolveOrCreateSession()                                 │
│  • recordPageView()                                         │
│  • recordEvent()                                            │
│  • hashIp()                                                 │
│                    │                                        │
│       dispatches → RecordAnalyticsJob (queued)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     STORAGE LAYER                            │
│                                                             │
│  MySQL (same DB as main app)                                │
│  • visitor_sessions                                         │
│  • page_views                                               │
│  • analytics_events                                         │
│  • analytics_daily_summaries  (pre-aggregated)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   AGGREGATION LAYER                          │
│                                                             │
│  AggregateAnalyticsCommand (artisan)                        │
│  • Runs nightly via scheduler                               │
│  • Writes to analytics_daily_summaries                      │
│  • Purges rows older than retention window                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  PRESENTATION LAYER                          │
│                                                             │
│  Admin React Pages (Inertia)                                │
│  • /admin/analytics — full dashboard                        │
│  • /admin/events/{slug} — per-event panel (embedded)        │
│  • Recharts for all charts                                  │
│  • Date range picker                                        │
│  • Auto-refresh on Real-Time tab (30s polling)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Database Schema

### `visitor_sessions`

| Column            | Type                          | Notes                                                    |
| ----------------- | ----------------------------- | -------------------------------------------------------- |
| `id`              | `uuid` PK                     | Anonymous session identifier; stored in cookie           |
| `user_id`         | `bigint` FK nullable          | Linked when visitor authenticates; references `users.id` |
| `ip_hash`         | `varchar(64)`                 | SHA-256 of IP + salt; not reversible                     |
| `device_type`     | `enum(mobile,tablet,desktop)` |                                                          |
| `browser`         | `varchar(50)`                 | chrome / firefox / safari / edge / other                 |
| `country_code`    | `char(2)` nullable            | ISO 3166-1 alpha-2                                       |
| `referrer_domain` | `varchar(255)` nullable       | Domain only, no path                                     |
| `utm_source`      | `varchar(100)` nullable       |                                                          |
| `utm_medium`      | `varchar(100)` nullable       |                                                          |
| `utm_campaign`    | `varchar(100)` nullable       |                                                          |
| `page_count`      | `int` default 0               | Incremented per page view                                |
| `started_at`      | `timestamp`                   | First request of this session                            |
| `last_seen_at`    | `timestamp`                   | Updated on every request                                 |

### `page_views`

| Column            | Type                       | Notes                            |
| ----------------- | -------------------------- | -------------------------------- |
| `id`              | `bigint` PK auto-increment |                                  |
| `session_id`      | `uuid` FK                  | References `visitor_sessions.id` |
| `user_id`         | `bigint` FK nullable       | References `users.id`            |
| `route_name`      | `varchar(100)` nullable    | Laravel route name               |
| `url`             | `varchar(500)`             | Full URL path (no domain)        |
| `referrer_domain` | `varchar(255)` nullable    | Domain only                      |
| `created_at`      | `timestamp`                |                                  |

### `analytics_events`

| Column           | Type                       | Notes                                        |
| ---------------- | -------------------------- | -------------------------------------------- |
| `id`             | `bigint` PK auto-increment |                                              |
| `session_id`     | `uuid` FK                  | References `visitor_sessions.id`             |
| `user_id`        | `bigint` FK nullable       | References `users.id`                        |
| `event_type`     | `varchar(50)`              | click / view / funnel_step                   |
| `event_category` | `varchar(100)`             | event_card / register_button / banner / etc. |
| `event_label`    | `varchar(255)` nullable    | event slug, post slug, banner ID             |
| `event_data`     | `json` nullable            | Additional context; no PII allowed           |
| `created_at`     | `timestamp`                |                                              |

### `analytics_daily_summaries`

| Column                               | Type                       | Notes                                                      |
| ------------------------------------ | -------------------------- | ---------------------------------------------------------- |
| `id`                                 | `bigint` PK auto-increment |                                                            |
| `date`                               | `date`                     | The day this summary covers                                |
| `metric_key`                         | `varchar(150)`             | e.g. `page_views`, `unique_sessions`, `event.{slug}.views` |
| `value`                              | `bigint`                   | The aggregated count                                       |
| Unique index on `(date, metric_key)` |                            |                                                            |

---

## 8. Route Specification

| Method | Route                            | Controller                           | Description                            |
| ------ | -------------------------------- | ------------------------------------ | -------------------------------------- |
| `POST` | `/track`                         | `AnalyticsController@track`          | Receive client-side analytics events   |
| `GET`  | `/admin/analytics`               | `Admin\AnalyticsController@index`    | Main analytics dashboard               |
| `GET`  | `/admin/analytics/realtime`      | `Admin\AnalyticsController@realtime` | Real-time active visitor data (polled) |
| `GET`  | `/admin/analytics/events/{slug}` | `Admin\AnalyticsController@event`    | Per-event analytics data               |

> `/track` is a public route (no auth required) — rate-limited and validated server-side.  
> All `/admin/analytics/*` routes are behind existing `auth + admin + restrict.checkin_staff` middleware.

---

## 9. New Files to Create

### Backend

| File                                                                  | Purpose                            |
| --------------------------------------------------------------------- | ---------------------------------- |
| `database/migrations/xxxx_create_visitor_sessions_table.php`          | `visitor_sessions` schema          |
| `database/migrations/xxxx_create_page_views_table.php`                | `page_views` schema                |
| `database/migrations/xxxx_create_analytics_events_table.php`          | `analytics_events` schema          |
| `database/migrations/xxxx_create_analytics_daily_summaries_table.php` | `analytics_daily_summaries` schema |
| `app/Models/VisitorSession.php`                                       | Eloquent model                     |
| `app/Models/PageView.php`                                             | Eloquent model                     |
| `app/Models/AnalyticsEvent.php`                                       | Eloquent model                     |
| `app/Models/AnalyticsDailySummary.php`                                | Eloquent model                     |
| `app/Services/AnalyticsService.php`                                   | Core business logic                |
| `app/Http/Middleware/TrackPageView.php`                               | Auto page view capture             |
| `app/Http/Controllers/AnalyticsController.php`                        | Public `/track` endpoint           |
| `app/Http/Controllers/Admin/AnalyticsController.php`                  | Admin dashboard data               |
| `app/Jobs/RecordAnalyticsJob.php`                                     | Queued async write                 |
| `app/Console/Commands/AggregateAnalytics.php`                         | Nightly aggregation + retention    |

### Frontend

| File                                                          | Purpose                             |
| ------------------------------------------------------------- | ----------------------------------- |
| `resources/js/hooks/useAnalytics.ts`                          | React hook for client-side tracking |
| `resources/js/Pages/Admin/Analytics/Index.tsx`                | Main analytics dashboard page       |
| `resources/js/Pages/Admin/Analytics/partials/OverviewTab.tsx` | Overview charts & tables            |
| `resources/js/Pages/Admin/Analytics/partials/EventsTab.tsx`   | Event performance tab               |
| `resources/js/Pages/Admin/Analytics/partials/FunnelTab.tsx`   | Funnel analysis tab                 |
| `resources/js/Pages/Admin/Analytics/partials/RealTimeTab.tsx` | Live visitor tab                    |
| `resources/js/Components/Analytics/EventAnalyticsPanel.tsx`   | Embedded per-event widget           |

### Modified Files

| File                                       | Change                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `bootstrap/app.php`                        | Register `TrackPageView` middleware on public web routes    |
| `routes/web.php`                           | Add `/track` and `/admin/analytics` routes                  |
| `routes/console.php`                       | Register `AggregateAnalytics` schedule                      |
| `resources/js/Layouts/PublicLayout.tsx`    | Mount `useAnalytics` hook                                   |
| `resources/js/Pages/Events/Show.tsx`       | Fire `view.event_detail` and `click.register_button` events |
| `resources/js/Pages/Events/Index.tsx`      | Fire `click.event_card` events                              |
| `resources/js/Pages/Admin/Events/Show.tsx` | Embed `EventAnalyticsPanel` component                       |

---

## 10. Implementation Phases

| Phase                           | Scope                                                                                                      | Output                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **1 — Foundation**              | Migrations, Models, `AnalyticsService`, `TrackPageView` Middleware, `RecordAnalyticsJob`                   | Server-side page views being silently recorded           |
| **2 — Client Events**           | `AnalyticsController` (public `/track`), `useAnalytics` hook, hook mounted in `PublicLayout` and key pages | Client-side events (clicks, funnel steps) being recorded |
| **3 — Admin Dashboard**         | `Admin\AnalyticsController`, `Analytics/Index.tsx`, all tab components, Recharts charts                    | Admins can view analytics data                           |
| **4 — Per-Event Panel**         | `EventAnalyticsPanel` component embedded in event admin page                                               | Per-event conversion metrics visible inline              |
| **5 — Aggregation & Retention** | `AggregateAnalytics` command, scheduler registration                                                       | Nightly summaries, 12-month purge                        |

---

## 11. Acceptance Criteria

| #     | Criteria                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Every public page load creates/updates a `visitor_sessions` row and inserts a `page_views` row without blocking the response |
| AC-2  | Raw IP addresses are never written to any database table                                                                     |
| AC-3  | Requests with `DNT: 1` header produce no analytics writes                                                                    |
| AC-4  | Known bot User-Agents produce no analytics writes                                                                            |
| AC-5  | `/track` endpoint rejects requests exceeding 60/minute per session with HTTP 429                                             |
| AC-6  | `/track` endpoint returns HTTP 422 if `event_label` or `event_data` fails validation                                         |
| AC-7  | Admin analytics dashboard renders all tabs without error                                                                     |
| AC-8  | Date range filter on Overview tab updates all widgets correctly                                                              |
| AC-9  | Per-event conversion rate = (completed registrations ÷ unique event views) × 100                                             |
| AC-10 | Real-Time tab auto-refreshes every 30 seconds; shows sessions with `last_seen_at > now() - 5 minutes`                        |
| AC-11 | `AggregateAnalytics` command completes without error and populates `analytics_daily_summaries`                               |
| AC-12 | `AggregateAnalytics` command deletes rows older than 12 months from raw tables                                               |
| AC-13 | Checkin staff role cannot access any `/admin/analytics` route (403)                                                          |
| AC-14 | `useAnalytics` hook fires no requests on the admin panel (only on public-facing pages)                                       |

---

## 12. Open Questions / Decisions

| #    | Question                                                                                   | Decision                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| OQ-1 | Country detection from IP — use a PHP package or skip for v1?                              | **Skip for v1.** Add `stevebauman/location` in a future iteration. `country_code` column stays nullable. |
| OQ-2 | Should Editor role see all events' analytics or only events they created?                  | **All events** — editors need full picture to compare performance.                                       |
| OQ-3 | Should real-time visitor count be shown publicly on event pages ("X people viewing this")? | **Post-launch feature** — not in this phase.                                                             |
| OQ-4 | Queue worker on shared hosting — is the database queue being processed?                    | **Confirm before Phase 1 cutover.** Run `php artisan queue:work` or set up a cron job.                   |

---

_End of PRD — Analytics Feature_
