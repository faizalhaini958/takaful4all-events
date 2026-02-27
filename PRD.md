# Product Requirements Document (PRD)
# Takaful Events Platform — v1.0

**Project:** Takaful Events Management System  
**Owner:** Malaysian Takaful Association (MTA)  
**Reference Site:** https://events.takaful4all.org/  
**Date:** 24 February 2026  
**Status:** Approved for Development

---

## 1. Executive Summary

Rebuild the existing WordPress/Elementor-based Takaful events website into a fully custom, production-ready system using a single Laravel 12 application powered by **Inertia.js**. The public frontend uses React + TypeScript + TailwindCSS; the admin panel uses React + shadcn/ui. Inertia.js eliminates any REST API layer — Laravel controllers pass data directly to React page components. No separate frontend or backend repositories. The system must be WordPress-independent, fully dynamic, scalable, and maintainable.

---

## 2. Project Goals

| Goal | Description |
|---|---|
| Decouple CMS | Remove dependency on WordPress/Elementor |
| Single Laravel App | One repo — Laravel 12 + Inertia.js + React, no API separation |
| Dynamic Content | All pages, events, posts managed via admin panel |
| Role-Based Access | Admin and Editor roles |
| Performance | Optimized queries, caching, image compression |
| Security | Session auth, CSRF, input validation, HTML sanitization |

---

## 3. Stakeholders

| Role | Responsibility |
|---|---|
| MTA Admin | Manage events, pages, media, posts |
| MTA Editor | Create/edit content (no delete/user management) |
| Public User | Browse events, view content, register for events |
| Developer | Build, deploy, maintain |

---

## 4. Functional Requirements

### 4.1 Public Website

#### Pages
| Route | Description |
|---|---|
| `/` | Homepage — Hero, Upcoming Events, Previous Events, About, Our Aims, Podcasts, Webinars, Footer |
| `/about` | About Us page — rendered from `pages` table |
| `/events` | All events listing with filters (upcoming/past) |
| `/events/:slug` | Single event detail — renders `content_html` |
| `/contact` | Contact page |
| `/terms` | Terms & Conditions |
| `/privacy-policy` | Privacy Policy |
| `/cancellation-refund` | Cancellation & Refund policy |

#### Homepage Sections
1. **Hero** — Full-width banner with headline "The Leading Platform for Takaful Meet Up & Conferences"
2. **Upcoming Events Grid** — Cards from props passed by `HomeController` (`Event::upcoming()->get()`)
3. **Previous Events Grid** — Cards from props passed by `HomeController` (`Event::past()->take(12)->get()`)
4. **About Section** — Text block from `Page::where('slug','about')` passed as prop
5. **Our Aims** — 3 feature cards (knowledge sharing, networking, thought leadership)
6. **Podcasts Section** — Horizontal scrollable cards from `Post::where('type','podcast')` prop
7. **Webinars Section** — Grid from `Post::where('type','webinar')` prop
8. **Footer** — Navigation links, social media icons, copyright

#### Event Detail Page
- Featured image (full-width)
- Event title, date, venue
- Registration button (external URL)
- HTML content block: `<div dangerouslySetInnerHTML={{ __html: event.content_html }} />`
- Related events

### 4.2 Admin Panel

#### Authentication
- Login with email + password via Sanctum
- Protected routes — redirect to login if unauthenticated
- Logout clears session

#### Dashboard
- Total events count (by status)
- Total posts count (by type)
- Total pages count
- Total media count
- Recent events table

#### Events Module
- DataTable with columns: Title, Status, Start Date, City, Actions
- Create/Edit form: title, slug (auto-generated), excerpt, content editor (HTML), start_at, end_at, venue_name, venue_address, city, state, country, registration_url, featured image picker, status (draft/upcoming/past), meta_json
- Delete with confirmation dialog
- Pagination

#### Pages Module
- DataTable: Title, Slug, Published, Actions
- Create/Edit: title, slug, HTML content, meta_json, is_published toggle

#### Posts Module
- DataTable: Title, Type, Published At, Actions
- Type filter (podcast/webinar/article)
- Create/Edit: title, slug, type selector, excerpt, HTML content, featured_image_id, published_at, meta_json

#### Media Manager
- Grid view of uploaded files
- Upload via drag-and-drop or file picker (`POST /api/admin/media/upload`)
- Preview modal
- Copy URL button
- Delete with confirmation
- Shows: filename, size, dimensions, upload date

#### Menu Management
- Create/edit navigation menus
- Drag-and-drop menu item ordering
- Nested items (parent_id)

---

## 5. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Response Time | API < 200ms for cached, < 500ms for complex queries |
| Availability | 99.9% uptime target |
| Scalability | Horizontal scaling via stateless API |
| Security | OWASP Top 10 compliance |
| Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) |
| Mobile | Fully responsive (320px–2560px) |
| SEO | Meta tags per page, Open Graph support |
| Accessibility | WCAG 2.1 AA baseline |

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Single Laravel 12 Application              │
│                    Port: 8000                           │
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐   │
│  │  Public React Pages  │  │   Admin React Pages   │   │
│  │  React + TypeScript  │  │  React + shadcn/ui    │   │
│  │  TailwindCSS         │  │  TailwindCSS          │   │
│  └──────────┬───────────┘  └──────────┬────────────┘   │
│             └──────────────────────────┘               │
│                  Inertia.js (no REST API)               │
│             ┌──────────────────────────┐               │
│  ┌──────────▼───────────────────────────────────────┐  │
│  │              Controllers + Services               │  │
│  │   routes/web.php — all routes                     │  │
│  │   Inertia::render('Page', ['data' => ...])        │  │
│  │   Auth Middleware (session-based, Breeze)         │  │
│  └──────────────────────┬─────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼─────────────────────────┐    │
│  │                   Models                        │    │
│  └──────────────────────┬─────────────────────────┘    │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│             MySQL Database (XAMPP)                       │
│   DB_DATABASE : takaful-events                          │
│   DB_HOST     : localhost                               │
│   DB_PORT     : 3306                                    │
│   DB_USERNAME : root                                    │
│   DB_PASSWORD : (empty)                                 │
└─────────────────────────────────────────────────────────┘
```

### 6.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Laravel | 12.x |
| Backend Language | PHP | 8.2+ |
| Authentication | Laravel Breeze (Inertia + React) | Latest |
| Database | MySQL (via XAMPP) | 8.0+ |
| Frontend Bridge | Inertia.js | 2.x |
| Frontend Language | TypeScript | 5.x |
| Public Frontend | React | 19.x |
| Admin Frontend | React + shadcn/ui | Latest |
| Build Tool | Vite (bundled with Laravel) | 6.x |
| Styling | TailwindCSS | 4.x |
| Form Handling | React Hook Form + Zod | Latest |
| Admin Tables | TanStack Table (via shadcn DataTable) | Latest |

### 6.2 Local Environment (.env)

```env
APP_NAME="Takaful Events"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=takaful-events
DB_USERNAME=root
DB_PASSWORD=
```

> **Note:** Start Apache and MySQL in XAMPP before running `php artisan serve`. Create the database `takaful-events` in phpMyAdmin before running migrations.

---

## 7. Database Schema

### 7.1 users
```sql
id              BIGINT UNSIGNED AUTO_INCREMENT PK
name            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL
role            ENUM('admin','editor') DEFAULT 'editor'
remember_token  VARCHAR(100) NULLABLE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 7.2 events
```sql
id                  BIGINT UNSIGNED AUTO_INCREMENT PK
title               VARCHAR(255) NOT NULL
slug                VARCHAR(255) UNIQUE NOT NULL
excerpt             TEXT NULLABLE
content_html        LONGTEXT NULLABLE
start_at            DATETIME NOT NULL
end_at              DATETIME NOT NULL
venue_name          VARCHAR(255) NULLABLE
venue_address       TEXT NULLABLE
city                VARCHAR(100) NULLABLE
state               VARCHAR(100) NULLABLE
country             VARCHAR(100) DEFAULT 'Malaysia'
registration_url    VARCHAR(500) NULLABLE
featured_image_id   BIGINT UNSIGNED NULLABLE FK(media.id)
status              ENUM('draft','upcoming','past') DEFAULT 'draft'
meta_json           JSON NULLABLE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### 7.3 pages
```sql
id              BIGINT UNSIGNED AUTO_INCREMENT PK
title           VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE NOT NULL
content_html    LONGTEXT NULLABLE
meta_json       JSON NULLABLE
is_published    BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 7.4 posts
```sql
id                  BIGINT UNSIGNED AUTO_INCREMENT PK
type                ENUM('podcast','webinar','article') NOT NULL
title               VARCHAR(255) NOT NULL
slug                VARCHAR(255) UNIQUE NOT NULL
excerpt             TEXT NULLABLE
content_html        LONGTEXT NULLABLE
featured_image_id   BIGINT UNSIGNED NULLABLE FK(media.id)
published_at        DATETIME NULLABLE
meta_json           JSON NULLABLE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### 7.5 media
```sql
id          BIGINT UNSIGNED AUTO_INCREMENT PK
disk        VARCHAR(50) DEFAULT 'public'
path        VARCHAR(500) NOT NULL
url         VARCHAR(500) NOT NULL
alt         VARCHAR(255) NULLABLE
title       VARCHAR(255) NULLABLE
mime        VARCHAR(100) NULLABLE
size        BIGINT NULLABLE
width       INT NULLABLE
height      INT NULLABLE
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### 7.6 menus
```sql
id          BIGINT UNSIGNED AUTO_INCREMENT PK
name        VARCHAR(255) UNIQUE NOT NULL
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### 7.7 menu_items
```sql
id          BIGINT UNSIGNED AUTO_INCREMENT PK
menu_id     BIGINT UNSIGNED NOT NULL FK(menus.id)
label       VARCHAR(255) NOT NULL
url         VARCHAR(500) NOT NULL
order       INT DEFAULT 0
parent_id   BIGINT UNSIGNED NULLABLE FK(menu_items.id)
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

## 8. Route Specification

### 8.1 Public Web Routes (`routes/web.php`)

| Method | Route | Controller | Description |
|---|---|---|---|
| GET | `/` | `HomeController@index` | Homepage |
| GET | `/about` | `PageController@show` | About page |
| GET | `/events` | `EventController@index` | Events listing |
| GET | `/events/{slug}` | `EventController@show` | Event detail |
| GET | `/contact` | `PageController@show` | Contact page |
| GET | `/terms` | `PageController@show` | Terms page |
| GET | `/privacy-policy` | `PageController@show` | Privacy Policy |
| GET | `/cancellation-refund` | `PageController@show` | Cancellation policy |

### 8.2 Admin Web Routes (`routes/web.php`, `auth` middleware)

| Method | Route | Controller | Description |
|---|---|---|---|
| GET | `/admin` | `Admin\DashboardController` | Dashboard |
| GET/POST | `/admin/events` | `Admin\EventController` | List / Create |
| GET/PUT/DELETE | `/admin/events/{id}` | `Admin\EventController` | Show / Update / Delete |
| GET/POST | `/admin/pages` | `Admin\PageController` | List / Create |
| GET/PUT/DELETE | `/admin/pages/{id}` | `Admin\PageController` | Show / Update / Delete |
| GET/POST | `/admin/posts` | `Admin\PostController` | List / Create |
| GET/PUT/DELETE | `/admin/posts/{id}` | `Admin\PostController` | Show / Update / Delete |
| GET/POST | `/admin/media` | `Admin\MediaController` | List / Upload |
| DELETE | `/admin/media/{id}` | `Admin\MediaController` | Delete |
| GET/POST | `/admin/menus` | `Admin\MenuController` | List / Create |
| GET/PUT/DELETE | `/admin/menus/{id}` | `Admin\MenuController` | Show / Update / Delete |

### 8.3 Auth Routes

| Method | Route | Description |
|---|---|---|
| GET/POST | `/login` | Session login (Laravel Breeze) |
| POST | `/logout` | Session logout |

---

## 9. Event Status Logic

```
fn compute_status(start_at, end_at, now):
  if start_at > now  → "upcoming"
  if end_at < now    → "past"
  else               → "ongoing"
```

Status is stored in the `status` column but can be automatically computed via an Eloquent accessor for display purposes.

---

## 10. Security Requirements

| Concern | Implementation |
|---|---|
| Authentication | Laravel Breeze with Inertia + React (session-based) |
| CSRF | Inertia automatically includes CSRF token on every request |
| Authorization | `role` check middleware (admin/editor gates) |
| Input Validation | Laravel Form Request classes per controller action |
| Slug Uniqueness | DB unique constraint + validation rule |
| File Upload | MIME validation (`image/jpeg`, `image/png`, `image/webp`) max 5MB |
| HTML Sanitization | `HTMLPurifier` / `strip_tags` on `content_html` input |
| Rate Limiting | `throttle:60,1` on public routes, `throttle:10,1` on login |
| CORS | Not needed — same-origin single app |

---

## 11. Performance Requirements

| Concern | Implementation |
|---|---|
| DB Indexes | `slug` columns indexed on all tables |
| Query Optimization | Eager loading (`with(['featuredImage'])`) |
| Caching | Homepage queries cached 15 minutes via `Cache::remember` |
| Pagination | Default 12 items per page |
| Image Optimization | Resize on upload using `Intervention\Image` (max 1920px wide) |
| Lazy Loading | `loading="lazy"` on all `<img>` tags |
| Code Splitting | Vite splits React pages per route automatically via Inertia |

---

## 12. Admin Panel Modules

### Module Hierarchy
```
Admin Panel
├── Dashboard
│   ├── Stats Cards (Events, Posts, Pages, Media)
│   └── Recent Events Table
├── Events
│   ├── List (DataTable + pagination)
│   ├── Create
│   └── Edit
├── Pages
│   ├── List
│   ├── Create
│   └── Edit
├── Posts
│   ├── List (with type filter tabs)
│   ├── Create
│   └── Edit
├── Media
│   └── Manager (upload + grid + delete)
└── Settings
    └── Menu Manager
```

---

## 13. Frontend Component Tree

### Public (React + TailwindCSS)
```
resources/js/
├── Layouts/
│   └── PublicLayout.tsx        (Navbar + Footer)
├── Pages/Public/
│   ├── Home.tsx
│   │   ├── HeroSection.tsx
│   │   ├── UpcomingEventsSection.tsx
│   │   ├── PreviousEventsSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── OurAimsSection.tsx
│   │   ├── PodcastsSection.tsx
│   │   └── WebinarsSection.tsx
│   ├── Events/
│   │   ├── Index.tsx           (listing + filter)
│   │   └── Show.tsx            (event detail)
│   └── Page.tsx                (about, contact, terms, privacy, cancellation)
└── Components/
    ├── EventCard.tsx
    ├── PostCard.tsx
    ├── SectionHeader.tsx
    └── LoadingSpinner.tsx
```

### Admin (React + shadcn/ui)
```
resources/js/
├── Layouts/
│   └── AdminLayout.tsx         (sidebar + topbar using shadcn)
└── Pages/Admin/
    ├── Dashboard.tsx           (stats cards + recent events table)
    ├── Events/
    │   ├── Index.tsx           (shadcn DataTable + pagination)
    │   ├── Create.tsx
    │   └── Edit.tsx
    ├── Pages/
    │   ├── Index.tsx
    │   ├── Create.tsx
    │   └── Edit.tsx
    ├── Posts/
    │   ├── Index.tsx           (with type filter tabs)
    │   ├── Create.tsx
    │   └── Edit.tsx
    ├── Media/
    │   └── Index.tsx           (drag-and-drop upload + grid)
    └── Menus/
        └── Index.tsx           (drag-and-drop ordering)
```

---

## 14. Folder Structure

### Single Laravel 12 Application
```
takaful-events/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── HomeController.php
│   │   │   ├── EventController.php
│   │   │   ├── PageController.php
│   │   │   └── Admin/
│   │   │       ├── DashboardController.php
│   │   │       ├── EventController.php
│   │   │       ├── PageController.php
│   │   │       ├── PostController.php
│   │   │       ├── MediaController.php
│   │   │       └── MenuController.php
│   │   ├── Middleware/
│   │   │   └── AdminOnly.php
│   │   └── Requests/
│   │       ├── StoreEventRequest.php
│   │       ├── UpdateEventRequest.php
│   │       ├── StorePageRequest.php
│   │       ├── StorePostRequest.php
│   │       └── MediaUploadRequest.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Event.php
│   │   ├── Page.php
│   │   ├── Post.php
│   │   ├── Media.php
│   │   ├── Menu.php
│   │   └── MenuItem.php
│   └── Services/
│       └── MediaService.php
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── UserSeeder.php
│       ├── EventSeeder.php
│       ├── PageSeeder.php
│       ├── PostSeeder.php
│       └── MenuSeeder.php
├── resources/
│   ├── js/
│   │   ├── app.tsx                    # Inertia + React bootstrap
│   │   ├── Layouts/
│   │   │   ├── PublicLayout.tsx
│   │   │   └── AdminLayout.tsx        # shadcn sidebar layout
│   │   ├── Pages/
│   │   │   ├── Public/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Events/
│   │   │   │   │   ├── Index.tsx
│   │   │   │   │   └── Show.tsx
│   │   │   │   └── Page.tsx
│   │   │   └── Admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Events/
│   │   │       ├── Pages/
│   │   │       ├── Posts/
│   │   │       ├── Media/
│   │   │       └── Menus/
│   │   ├── Components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── EventCard.tsx
│   │   │   ├── PostCard.tsx
│   │   │   └── SectionHeader.tsx
│   │   └── types/                     # TypeScript interfaces
│   ├── css/
│   │   └── app.css                    # TailwindCSS 4 entry
│   └── views/
│       └── app.blade.php              # Single Inertia root template
├── routes/
│   └── web.php                        # All routes (public + admin)
└── vite.config.ts
```

---

## 15. Milestones

| Milestone | Deliverable | Target |
|---|---|---|
| M1 | Migrations, models, seeders complete | Week 1 |
| M2 | Public Blade views + controllers complete | Week 2 |
| M3 | Admin panel (Blade + Livewire) complete | Week 3 |
| M4 | Integration testing + full seeding | Week 4 |
| M5 | Production deployment ready | Week 5 |

---

## 16. Out of Scope (v1.0)

- Email notifications / RSVP system
- Payment processing
- Multi-language support
- User registration (public)
- Social login
- Analytics dashboard (3rd party)
- Real-time features (WebSockets)

---

## 17. Acceptance Criteria

- [ ] All public routes render correct React pages via Inertia
- [ ] Auth middleware protects all `/admin/*` routes (session-based)
- [ ] Events correctly resolve status based on dates
- [ ] CRUD operations work for Events, Pages, Posts
- [ ] Media upload stores file and returns URL
- [ ] Public frontend renders all sections from data passed by controllers
- [ ] Admin login/logout works (Laravel Breeze + Inertia)
- [ ] All admin CRUD operations functional via React + shadcn/ui forms
- [ ] Pagination works on events listing (Inertia-based)
- [ ] Slugs are unique and validated
- [ ] Mobile responsive at 320px, 768px, 1280px

---

*End of PRD*
