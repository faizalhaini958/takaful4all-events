# PRD — Custom Registration Fields System

**Project:** Takaful4All Events Platform  
**Author:** Development  
**Date:** May 6, 2026  
**Status:** Planning

---

## 1. Background & Problem Statement

The current registration form collects a fixed set of fields for every event:
`name`, `email`, `phone`, `company`, `job_title`, `dietary_requirements`

This is insufficient because different event types require fundamentally different information:

- A **marathon** needs IC number, gender, emergency contact, blood type, race category — but not company or job title
- A **conference** needs company and job title — but not IC or emergency contact
- A **dinner/gala** needs dietary requirements and seating preference — but not race category

The client will encounter this gap when creating their next event. Without a fix, they either collect irrelevant data (bad registrant UX) or miss critical data (operational and legal risk).

---

## 2. Goals

1. Allow the admin to configure a custom set of registration fields per event
2. Use event categories to auto-load sensible field templates (fast setup)
3. Allow the admin to customise/override the template fields per event
4. Render the correct fields on the public registration form
5. Store and display custom field answers in the admin panel
6. Support both English and Bahasa Malaysia field labels
7. Keep all existing registrations intact — zero data loss

---

## 3. Non-Goals (Out of Scope — Phase 2)

- Conditional/logic fields ("show this field only if gender = Female")
- File upload fields (e.g. medical certificate)
- Multi-select / checkbox group fields
- Age category auto-calculation from date of birth
- Custom fields on the PDF ticket (ticket keeps its current design)
- Client-editable categories (categories are system-fixed)

---

## 4. Event Categories

The system will have **7 fixed categories**. Categories are not editable by the client.

| #   | Category Key    | Display Name            | Primary Use Case                           |
| --- | --------------- | ----------------------- | ------------------------------------------ |
| 1   | `sports`        | Sports & Fitness        | Marathon, fun run, cycling, triathlon      |
| 2   | `conference`    | Conference & Seminar    | Corporate talks, AGMs, forums              |
| 3   | `workshop`      | Workshop & Training     | Hands-on training, courses                 |
| 4   | `dinner`        | Dinner, Awards & Gala   | Annual dinners, award nights, performances |
| 5   | `entertainment` | Entertainment & Concert | Concerts, shows, performances              |
| 6   | `exhibition`    | Exhibition & Trade Show | Trade fairs, product expos                 |
| 7   | `general`       | General                 | Anything that doesn't fit above            |

---

## 5. Field Types

The system will support **6 field types** in Phase 1.

| Type       | Description                           | Example Use                                     |
| ---------- | ------------------------------------- | ----------------------------------------------- |
| `text`     | Single-line free text                 | IC Number, Emergency Contact, Bib Name          |
| `select`   | Dropdown — single choice              | Race Category, Dietary, Arrival Time Slot       |
| `radio`    | Visible radio buttons — single choice | Gender (2–3 options max)                        |
| `date`     | Date picker                           | Date of Birth                                   |
| `textarea` | Multi-line free text                  | Special medical conditions, accessibility needs |
| `checkbox` | Single tick — yes/no                  | Waiver agreement, photography consent           |

---

## 6. Default Field Templates Per Category

These fields are **pre-loaded** when the admin picks a category. They can be modified before saving.

### 6.1 Sports & Fitness

| Field                           | Type     | Required |
| ------------------------------- | -------- | -------- |
| Full Name                       | text     | Yes      |
| Email                           | text     | Yes      |
| Phone Number                    | text     | Yes      |
| IC Number                       | text     | Yes      |
| Gender                          | radio    | Yes      |
| Date of Birth                   | date     | Yes      |
| Race Category                   | select   | Yes      |
| T-shirt Size                    | select   | Yes      |
| Emergency Contact Name          | text     | Yes      |
| Emergency Contact Phone         | text     | Yes      |
| Blood Type                      | select   | No       |
| Running Club / Team             | text     | No       |
| I agree to the waiver and terms | checkbox | Yes      |

### 6.2 Conference & Seminar

| Field                  | Type   | Required |
| ---------------------- | ------ | -------- |
| Full Name              | text   | Yes      |
| Email                  | text   | Yes      |
| Phone Number           | text   | Yes      |
| Company / Organisation | text   | Yes      |
| Job Title              | text   | No       |
| Dietary Requirements   | select | No       |
| Arrival Time Slot      | select | No       |

### 6.3 Workshop & Training

| Field                  | Type     | Required |
| ---------------------- | -------- | -------- |
| Full Name              | text     | Yes      |
| Email                  | text     | Yes      |
| Phone Number           | text     | Yes      |
| Company / Organisation | text     | No       |
| Job Title              | text     | No       |
| Experience Level       | select   | No       |
| Special Requirements   | textarea | No       |

### 6.4 Dinner, Awards & Gala

| Field                      | Type     | Required |
| -------------------------- | -------- | -------- |
| Full Name                  | text     | Yes      |
| Email                      | text     | Yes      |
| Phone Number               | text     | Yes      |
| Company / Organisation     | text     | Yes      |
| Job Title                  | text     | No       |
| Dietary Requirements       | select   | Yes      |
| Seating / Table Preference | text     | No       |
| Special Requirements       | textarea | No       |

### 6.5 Entertainment & Concert

| Field        | Type | Required |
| ------------ | ---- | -------- |
| Full Name    | text | Yes      |
| Email        | text | Yes      |
| Phone Number | text | Yes      |

### 6.6 Exhibition & Trade Show

| Field                  | Type   | Required |
| ---------------------- | ------ | -------- |
| Full Name              | text   | Yes      |
| Email                  | text   | Yes      |
| Phone Number           | text   | Yes      |
| Company / Organisation | text   | Yes      |
| Job Title              | text   | No       |
| Industry               | select | No       |

### 6.7 General

| Field        | Type | Required |
| ------------ | ---- | -------- |
| Full Name    | text | Yes      |
| Email        | text | Yes      |
| Phone Number | text | Yes      |

---

## 7. Field Configuration Structure (JSON Schema)

Each field in `registration_fields` on the `events` table follows this structure:

```json
{
    "key": "race_category",
    "label_en": "Race Category",
    "label_ms": "Kategori Lumba",
    "type": "select",
    "required": true,
    "options_en": ["5km", "10km", "21km - Half Marathon"],
    "options_ms": ["5km", "10km", "21km - Separuh Maraton"],
    "placeholder_en": "Select your race category",
    "placeholder_ms": "Pilih kategori lumba anda",
    "sort_order": 5
}
```

**Notes:**

- `key` must be unique within an event. Used as the JSON key in `attendee.meta_json`
- `label_en` / `label_ms` — bilingual label support
- `options_en` / `options_ms` — only used for `select` and `radio` types
- `placeholder_en` / `placeholder_ms` — optional hint text
- `sort_order` — determines render order on the form

---

## 8. Database Changes

### 8.1 New migration — `add_custom_fields_to_events_and_attendees`

**Table: `events`** — Add 2 columns

```
event_category       string, nullable, default null
registration_fields  json, nullable
```

**Table: `event_registration_attendees`** — Add 1 column

```
meta_json   json, nullable
```

> Note: `meta_json` is declared in the model `$fillable` and `$casts` but the column was never created in any migration. This migration fixes that.

### 8.2 What stays unchanged

- All existing fixed columns on `event_registration_attendees` (`company`, `job_title`, `dietary_requirements`) are **kept** for backward compatibility
- All existing `event_registrations` data is untouched
- No columns are dropped or modified

### 8.3 Seeding existing events

After migration, existing events will have `registration_fields = null`. A seeder will be written to assign the correct `event_category` and `registration_fields` to each existing event based on the admin's guidance.

---

## 9. Admin UX Flow

### 9.1 Create / Edit Event Form

1. Admin fills in event title, date, venue (existing)
2. Admin selects **Event Category** from dropdown (new — Step 1 of form)
3. On category selection — a **"Registration Fields"** section below auto-populates with the template fields for that category
4. Admin can then:
    - ✏️ Edit field label (EN and BM)
    - 🔘 Toggle required / optional
    - ➕ Add a new custom field (choose type, enter labels, options if applicable)
    - ❌ Remove a field
    - ↑↓ Reorder fields using up/down arrow buttons
5. Admin saves the event — `event_category` and `registration_fields` are stored

### 9.2 Field Builder UI Rules

- Fields with `key` = `name`, `email`, `phone` are **locked** — cannot be removed (always required baseline)
- When a field is removed that was part of the original template, show a subtle warning badge ("Recommended field removed") but allow it
- When adding a `select` or `radio` type, admin must enter at least 2 options before saving
- Up/down arrows are used for reordering (no drag-and-drop dependency)

---

## 10. Public Registration Form

### 10.1 Form Rendering

- Form reads `event.registration_fields` passed from the controller
- Renders fields dynamically in `sort_order` order per attendee
- If `registration_fields` is null or empty — falls back to the current hardcoded fields (backward compat)
- Label shown in the active locale (EN or BM based on `useTranslation`)

### 10.2 Validation (Frontend)

- `required: true` fields show validation error if empty on submit
- `date` type uses a date input with proper format
- `checkbox` required means it must be ticked to submit
- `select` / `radio` required means a non-empty option must be chosen

### 10.3 Form Data Submitted

Custom field answers are submitted nested under each attendee:

```json
{
    "attendees": [
        {
            "name": "Ahmad",
            "email": "ahmad@email.com",
            "phone": "0123456789",
            "custom_fields": {
                "ic_number": "901234-01-1234",
                "gender": "Male",
                "race_category": "21km - Half Marathon",
                "emergency_contact_name": "Siti 0129876543",
                "waiver_agreed": true
            }
        }
    ]
}
```

---

## 11. Backend Changes

### 11.1 `StoreEventRegistrationRequest`

- Load the event's `registration_fields` within the request
- Dynamically build validation rules:
    - `required: true` → `'required|...'`
    - `required: false` → `'nullable|...'`
    - `type: date` → adds `'date'` rule
    - `type: checkbox` → adds `'boolean'` rule
- Maintain existing hardcoded rules for `name`, `email`, `phone` (always required)

### 11.2 `EventRegistrationController@store`

- After saving the attendee, write `custom_fields` answers to `attendee->meta_json`
- For backward compatibility — if `registration_fields` is null, save to fixed columns as before

---

## 12. Admin Registrations View

### 12.1 Index (list)

- No change — list only shows name, email, ticket, status, amount

### 12.2 Show (detail)

- "Attendee Details" section currently shows fixed fields
- After change: show fixed fields first (if populated), then loop through `meta_json` and display each key-value pair
- Use the event's `registration_fields` to get the human-readable label for each key
- Fallback: if label not found, display the raw key formatted nicely

---

## 13. Email & PDF

### 13.1 Confirmation Email (`ticket-confirmation.blade.php`)

- Currently shows `$attendee->company` and `$attendee->job_title` if present
- After change: keep existing fixed-field display for old records
- For new records with `meta_json` — append a simple list of custom field answers below the existing attendee info block
- Format: **Label:** Value (one per line)

### 13.2 PDF Ticket (`tickets/template.blade.php`)

- **No changes** — ticket keeps its current clean design
- Custom fields do not appear on the ticket PDF
- The ticket remains: name, email, event info, QR code, reference number

---

## 14. Bilingual Support

- Field labels have `label_en` and `label_ms`
- Field options have `options_en` and `options_ms`
- The public registration form uses the active locale to pick the right label/options
- Admin field builder shows both EN and BM input side by side for each field label
- If `label_ms` is empty — fall back to `label_en` for BM locale

---

## 15. Implementation Order

The build will follow this sequence to minimise risk:

| Phase | Task                                                                |
| ----- | ------------------------------------------------------------------- |
| **A** | Database migration (additive only)                                  |
| **B** | Update Event model + TypeScript types                               |
| **C** | Admin field builder UI in EventForm                                 |
| **D** | Public Register.tsx — dynamic field rendering                       |
| **E** | Backend validation — dynamic rules in StoreEventRegistrationRequest |
| **F** | Controller store — save meta_json on attendee                       |
| **G** | Admin Registrations Show — display custom field answers             |
| **H** | Email template — append meta_json fields                            |
| **I** | Seed existing events with category + field config                   |
| **J** | End-to-end testing across all 7 category types                      |

---

## 16. Open Questions (Resolved)

| #   | Question                      | Answer                                                    |
| --- | ----------------------------- | --------------------------------------------------------- |
| 1   | Field types supported         | `text`, `select`, `radio`, `date`, `textarea`, `checkbox` |
| 2   | Separate Sports categories?   | Combined into one `sports` category                       |
| 3   | Exhibition/Trade Show needed? | Yes, keep it                                              |
| 4   | Any missing categories?       | No, 7 is sufficient                                       |
| 5   | Current events in DB          | Seed after migration — details TBD                        |
| 6   | Custom fields on PDF ticket?  | No — ticket keeps current design                          |
| 7   | Field builder reorder UX      | Up/down arrow buttons (no drag-and-drop)                  |
| 8   | Bilingual labels?             | Yes — EN + BM for labels and options                      |

---

_This PRD is the single source of truth for this feature. Any scope changes must be reviewed here before implementation begins._
