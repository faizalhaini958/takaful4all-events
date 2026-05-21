# PRD — Ticket Eligibility Rules & Per-Ticket Field Option Overrides

**Project:** Takaful4All Events Platform
**Author:** Development
**Date:** May 12, 2026
**Status:** Planning
**Depends On:** PRD_CUSTOM_REGISTRATION_FIELDS.md, PRD_TICKET_SCOPED_FIELDS.md (must be completed first)

---

## 1. Background & Problem Statement

The Custom Registration Fields system stores one field list per event. The Ticket-Scoped Fields system (PRD_TICKET_SCOPED_FIELDS.md) added the ability to show or hide entire fields based on ticket selection.

However, two problems remain unresolved for multi-category sports events:

### Problem 1 — Same Field, Different Options Per Ticket

A marathon event has a T-shirt field with different size availability per distance category:

| Ticket             | T-shirt Sizes Available   |
| ------------------ | ------------------------- |
| 42KM Full Marathon | XS, S, M, L, XL, XXL, 3XL |
| 21KM Half Marathon | S, M, L, XL, XXL          |
| 5KM Fun Run        | S, M, L                   |

The current system defines one global `options_en` list on the field. Every ticket sees the same options. A 5KM registrant sees 3XL as a valid choice even though that size is not available for their category. This produces incorrect data and fulfilment problems for the organiser.

### Problem 2 — Age & Gender Restriction Per Ticket Category

A running event (e.g. Malaysia Northern Run, Penang Edition) has age-stratified and gender-stratified ticket categories:

| Ticket                              | Age Range | Gender |
| ----------------------------------- | --------- | ------ |
| 10KM Junior Boys (13-17 years)      | 13–17     | Male   |
| 10KM Junior Girls (13-17 years)     | 13–17     | Female |
| 10KM Men Open (18-39 years)         | 18–39     | Male   |
| 10KM Women Open (18-39 years)       | 18–39     | Female |
| 10KM Men Veteran (40-59 years)      | 40–59     | Male   |
| 10KM Women Veteran (40-59 years)    | 40–59     | Female |
| 10KM Men Senior Veteran (60+ years) | 60+       | Male   |

Currently the system has no way to enforce these restrictions. A 45-year-old man can successfully register for "10KM Junior Boys" because the ticket has no age or gender constraints. This creates:

- Incorrect race category assignments
- Operational burden on organisers who must manually check every registration
- Potential legal and insurance issues if age-restricted categories are not enforced

---

## 2. Goals

### Feature A — Per-Ticket Field Option Overrides

1. Allow an admin to define different dropdown/radio options for a field on a per-ticket basis
2. When a registrant selects a ticket, the overridden options replace the event-level default options for that field
3. If no override is set for a ticket, the field's default event-level options are used
4. Option overrides are configured inside the existing field editor — no new admin page required
5. Backend validation enforces that the submitted value is within the allowed options for the selected ticket

### Feature B — Ticket Eligibility Rules

1. Allow an admin to set `min_age`, `max_age`, and `allowed_gender` on each ticket
2. These rules are enforced at registration time against the registrant's submitted Date of Birth and Gender field values
3. A registrant who does not meet the rules is blocked from completing registration with a clear, localised error message
4. Rules are nullable — a ticket with no rules has no restrictions (default, backward compatible)
5. Rules are configured inside the existing ticket create/edit modal — no new admin page required

---

## 3. Non-Goals (Out of Scope)

- Conditional fields ("show field B only if field A = Yes") — separate future feature
- Option overrides for text/date/checkbox field types — only dropdown and radio types are in scope
- Restricting options for event-level locked fields (Name, Email, Phone) — locked fields cannot have overrides
- Membership or club verification as an eligibility rule
- Automatic ticket category suggestion based on registrant's age/gender
- Changing ticket capacity or pricing based on eligibility rules
- Eligibility enforcement for admin-created registrations (admin bypass is acceptable)

---

## 4. Solution Design

---

### 4A — Per-Ticket Field Option Overrides

#### 4A.1 Core Concept

Extend the existing `RegistrationField` interface with one new optional property: `options_override`.

This is a map of ticket name → options array. When the registrant selects a ticket, the system looks up that ticket name in the map. If found, those options are used instead of the field's default `options_en`/`options_ms`. If not found, the default options apply.

Ticket names (strings) are used as keys for the same reason as `ticket_scope` in the previous PRD: they are the human-readable identifier already used everywhere in the system, and they do not change unless explicitly renamed by the admin (which triggers a sweep, covered in Section 4A.4).

#### 4A.2 Data Structure Change

**Current `RegistrationField` interface:**

```typescript
interface RegistrationField {
    key: string;
    label_en: string;
    label_ms: string;
    type: RegistrationFieldType;
    required: boolean;
    options_en?: string[];
    options_ms?: string[];
    placeholder_en?: string;
    placeholder_ms?: string;
    sort_order: number;
    locked?: boolean;
    ticket_scope?: string[] | null;
}
```

**After (add one optional property):**

```typescript
interface RegistrationField {
    key: string;
    label_en: string;
    label_ms: string;
    type: RegistrationFieldType;
    required: boolean;
    options_en?: string[];
    options_ms?: string[];
    placeholder_en?: string;
    placeholder_ms?: string;
    sort_order: number;
    locked?: boolean;
    ticket_scope?: string[] | null;
    options_override?: Record<
        string,
        { options_en: string[]; options_ms: string[] }
    > | null; // NEW
}
```

**Example stored value:**

```json
{
    "key": "tshirt_size",
    "type": "dropdown",
    "label_en": "T-shirt Size",
    "label_ms": "Saiz Baju T",
    "required": true,
    "options_en": ["S", "M", "L", "XL"],
    "options_ms": ["S", "M", "L", "XL"],
    "options_override": {
        "42KM Full Marathon": {
            "options_en": ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
            "options_ms": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
        },
        "21KM Half Marathon": {
            "options_en": ["S", "M", "L", "XL", "XXL"],
            "options_ms": ["S", "M", "L", "XL", "XXL"]
        }
    }
}
```

**No database migration required.** `registration_fields` is already stored as JSON. Adding a new property is backward compatible.

#### 4A.3 Option Resolution Logic

A single helper function is used in all touch points:

```
function resolveFieldOptions(field, ticketName, locale):
    // ticket_scope takes priority — if field is hidden for this ticket, options are irrelevant
    if fieldIsHiddenForTicket(field, ticketName):
        return []

    if field.options_override exists AND field.options_override[ticketName] exists:
        // BM always mirrors English — options_ms is identical to options_en
        return field.options_override[ticketName].options_en
    else:
        return locale === "ms" ? field.options_ms : field.options_en
```

This function is implemented once in TypeScript (frontend) and once in PHP (backend). Both must use identical logic.

**Priority rule:** `ticket_scope` is evaluated first. If `fieldAppliesToTicket(field, ticketName)` returns false, `resolveFieldOptions` is never called — the field is not rendered at all.

**BM mirroring:** `options_override` stores only `options_en`. When saving an override, the backend automatically copies `options_en` to `options_ms`. No separate BM input is shown in the admin UI for overrides.

#### 4A.4 Ticket Rename Safety

When an admin renames a ticket, `options_override` keys that reference the old name become orphaned (the override silently stops applying).

**Required behaviour:** The ticket update action must, inside the same database transaction as the rename, scan `event->registration_fields` and for each field that has `options_override`, rename the key from the old ticket name to the new ticket name.

This sweep is identical in pattern to the `ticket_scope` sweep already defined in PRD_TICKET_SCOPED_FIELDS.md Section 7. Both sweeps run together in the same transaction.

#### 4A.5 Backend Validation

When building validation rules for a submitted registration, for each dropdown or radio field that is in scope for the selected ticket:

1. Resolve the allowed options using `resolveFieldOptions(field, ticketName, 'en')`
2. Add a Laravel `in:` validation rule using those options

This ensures a 5KM registrant cannot submit "3XL" even if they manipulate the form payload directly.

---

### 4B — Ticket Eligibility Rules

#### 4B.1 Core Concept

Add three nullable columns directly to the `event_tickets` table. These are SQL columns (not JSON) because:

- They are finite and well-known — there will not be 50 different rule types
- They need to be queryable — organisers will want to filter/export tickets with age restrictions
- They map directly to Laravel validation rules — no parsing overhead
- Any developer reading the schema immediately understands what they do

#### 4B.2 Database Migration

Add to `event_tickets`:

| Column           | Type                   | Nullable | Description                                |
| ---------------- | ---------------------- | -------- | ------------------------------------------ |
| `min_age`        | `tinyInteger unsigned` | Yes      | Minimum age (inclusive). Null = no minimum |
| `max_age`        | `tinyInteger unsigned` | Yes      | Maximum age (inclusive). Null = no maximum |
| `allowed_gender` | `string(10)`           | Yes      | `"male"`, `"female"`, or null = any gender |

Age is stored as integers (years). Validation calculates age from the submitted Date of Birth field value at the time of registration.

#### 4B.3 Eligibility Resolution Logic

Eligibility is checked **after** field-level validation passes. It is a separate validation step, not part of field validation.

```
function checkTicketEligibility(ticket, submittedFields, event):

    // Age check
    if ticket.min_age OR ticket.max_age is set:
        dobField = find field in event.registration_fields where type = "date" AND key contains "dob" or "birth"
        if dobField exists in submitted fields:
            age = calculateAgeFromDOB(submittedFields[dobField.key])
            if ticket.min_age is set AND age < ticket.min_age → FAIL
            if ticket.max_age is set AND age > ticket.max_age → FAIL

    // Gender check
    if ticket.allowed_gender is set:
        genderField = find field in event.registration_fields where key = "gender"
        if genderField exists in submitted fields:
            submittedGender = normalize(submittedFields["gender"]) // lowercase
            if submittedGender != ticket.allowed_gender → FAIL

    return PASS
```

**Important:** The DOB and Gender field keys are not hardcoded. The system resolves them by finding the first field of type `date` with a key containing "dob" or "birth_date", and the first field with key `gender`. This makes the check resilient to field key naming variations without requiring strict coupling.

**Edge case:** If the event does not have a Date of Birth field configured but the ticket has `min_age` set, the eligibility check is skipped for age (no field to validate against). The admin is responsible for ensuring the event has the necessary fields configured.

#### 4B.4 Error Messages

Eligibility failures return localised error messages:

| Failure      | English Message                                                            | Bahasa Malaysia Message                                                      |
| ------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Too young    | "This ticket category is for participants aged {min_age} and above."       | "Kategori tiket ini adalah untuk peserta berumur {min_age} tahun ke atas."   |
| Too old      | "This ticket category is for participants aged {max_age} and below."       | "Kategori tiket ini adalah untuk peserta berumur {max_age} tahun ke bawah."  |
| Age range    | "This ticket category is for participants aged {min_age}–{max_age} years." | "Kategori tiket ini adalah untuk peserta berumur {min_age}–{max_age} tahun." |
| Wrong gender | "This ticket category is for {gender} participants only."                  | "Kategori tiket ini adalah untuk peserta {gender} sahaja."                   |

Errors are shown inline on the registration form, attached to the relevant DOB or Gender field.

#### 4B.5 Admin Bypass

Eligibility rules are only enforced on the **public registration form**. Admin-created registrations (created via the admin panel) bypass eligibility checks. This allows organisers to handle exceptional cases (e.g. manual override for a specific athlete).

---

## 5. Affected Touch Points

### Feature A — Option Overrides

| Touch Point                                        | Change Required                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `RegistrationField` TypeScript type                | Add `options_override` property                                   |
| `Register.tsx` (public form)                       | Use `resolveFieldOptions()` when rendering dropdown/radio options |
| `StoreEventRegistrationRequest.php`                | Use `resolveFieldOptions()` when building `in:` validation rules  |
| `RegistrationFieldBuilder.tsx` (admin)             | New "Options by ticket" sub-panel per dropdown/radio field        |
| `StoreEventRequest.php` / `UpdateEventRequest.php` | Allow `options_override` through validation                       |
| Ticket rename action (controller)                  | Sweep `options_override` keys on rename                           |

### Feature B — Eligibility Rules

| Touch Point                                  | Change Required                                       |
| -------------------------------------------- | ----------------------------------------------------- |
| `event_tickets` migration                    | Add `min_age`, `max_age`, `allowed_gender` columns    |
| `EventTicket` model                          | Add new columns to `$fillable` and `$casts`           |
| `StoreEventRegistrationRequest.php`          | Add eligibility check step after field validation     |
| Ticket create/edit modal (`TicketModal.tsx`) | New "Eligibility Rules" section                       |
| Ticket store/update controller               | Accept and save the new columns                       |
| `Register.tsx` — ticket selection step       | Show eligibility badges on ticket cards               |
| `Register.tsx` — form submission             | Display eligibility error inline on DOB/Gender fields |

---

## 6. Admin UI

### 6A — Option Override Editor (inside Field Builder)

Location: Inside `RegistrationFieldBuilder.tsx`, in the expanded `FieldCard` panel, below the existing options editor.

Visible only for `dropdown` and `radio` field types, and only when the event has at least one ticket saved (same condition as `ticket_scope` section).

**UI layout:**

- Section title: **"Options by ticket"**
- A collapsed/expandable sub-section per ticket name
- Each sub-section shows a copy of the options editor (same component as the global options editor)
- If a ticket has no override defined, its sub-section shows "Using default options" in grey
- Admin can click "Customise" on any ticket sub-section to enable override mode and edit options
- Admin can click "Remove override" to revert back to default options

### 6B — Eligibility Rules (inside Ticket Modal)

Location: New section inside the ticket create/edit modal, below the existing fields.

**UI layout:**

- Section title: **"Eligibility Rules"** with a subtitle "Restrict this ticket to specific age or gender."
- **Minimum Age** — number input, placeholder "No minimum", nullable
- **Maximum Age** — number input, placeholder "No maximum", nullable
- **Allowed Gender** — radio with three options: `Any (default)`, `Male only`, `Female only`
- Inline helper text: "Leave blank for no restriction. Age is calculated from the Date of Birth field."

### 6C — Eligibility Display on Ticket Selection Step (Public Form)

Decision: Eligibility rules are shown upfront on the ticket selection step so registrants know restrictions before filling the form.

**UI layout:**

- On each ticket card in step 1 of the public registration form, if the ticket has `min_age`, `max_age`, or `allowed_gender` set, show a small info badge below the ticket name
- Example badges: `Age: 13–17` · `Male only` · `Age: 40–59` · `Age: 60+`
- Badge is informational only — it does not block selection. The hard block happens on form submission
- If no eligibility rules are set on a ticket, no badge is shown
- Badges are localised (EN/BM)

---

## 7. Backward Compatibility

| Scenario                                                                       | Behaviour                                            |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Existing event with no `options_override` on any field                         | Default options used — no change                     |
| Existing ticket with no `min_age`/`max_age`/`allowed_gender`                   | All three columns are null — no restrictions applied |
| Existing registration — admin views it                                         | No change — eligibility is not retroactively checked |
| New registration on event without DOB field but ticket has `min_age`           | Age check is skipped — no error                      |
| New registration on event without Gender field but ticket has `allowed_gender` | Gender check is skipped — no error                   |

No existing events, tickets, or registrations are affected.

---

## 8. Validation Rules Update

### StoreEventRequest / UpdateEventRequest

```php
'registration_fields.*.options_override'                => 'nullable|array',
'registration_fields.*.options_override.*.options_en'   => 'required_with:registration_fields.*.options_override.*|array',
'registration_fields.*.options_override.*.options_en.*' => 'string|max:100',
// options_ms is not accepted from the frontend — it is auto-mirrored from options_en on the backend
```

### StoreTicketRequest (new or updated)

```php
'min_age'        => 'nullable|integer|min:1|max:120',
'max_age'        => 'nullable|integer|min:1|max:120|gte:min_age',
'allowed_gender' => 'nullable|in:male,female',
```

---

## 9. Acceptance Criteria

### Feature A — Option Overrides

#### Admin Panel

- [ ] A dropdown or radio field in the field builder shows an "Options by ticket" section when the event has tickets
- [ ] Admin can define custom options per ticket name for any dropdown/radio field
- [ ] Admin UI shows only one options input (English) — no separate BM input for overrides
- [ ] Backend automatically copies `options_en` to `options_ms` when saving an override
- [ ] Admin can remove an override and revert to default options
- [ ] Renaming a ticket updates `options_override` keys in all fields of that event

#### Public Registration Form

- [ ] Selecting "42KM Full Marathon" shows the 42KM-specific T-shirt sizes
- [ ] Selecting "5KM Fun Run" shows the 5KM-specific T-shirt sizes
- [ ] Selecting a ticket with no override shows the default event-level options
- [ ] Changing ticket selection re-renders the field with the correct options
- [ ] A field that is hidden via `ticket_scope` does not render options even if `options_override` is set for that ticket

#### Backend Validation

- [ ] Submitting "3XL" for a 5KM ticket where "3XL" is not in the 5KM override fails validation
- [ ] Submitting "3XL" for a 42KM ticket where "3XL" is in the 42KM override passes validation
- [ ] Submitting a valid option for a ticket with no override passes validation using default options
- [ ] The validation resolves options from the database, not from the submitted request payload

### Feature B — Eligibility Rules

#### Admin Panel

- [ ] The ticket create/edit modal shows a new "Eligibility Rules" section
- [ ] Admin can set min_age, max_age, and allowed_gender on any ticket
- [ ] All three fields are nullable — leaving blank saves null
- [ ] max_age must be greater than or equal to min_age if both are set

#### Public Registration Form — Ticket Selection Step

- [ ] Tickets with `min_age` or `max_age` set show an age badge (e.g. "Age: 13–17") on the ticket card
- [ ] Tickets with `allowed_gender` set show a gender badge (e.g. "Male only") on the ticket card
- [ ] Tickets with no eligibility rules show no badge
- [ ] Badges are shown in the correct language (EN/BM)

#### Public Registration Form — Submission

- [ ] A 35-year-old submitting for "10KM Junior Boys (13-17 years)" receives an age error
- [ ] A 15-year-old male submitting for "10KM Junior Boys (13-17 years)" passes
- [ ] A 15-year-old female submitting for "10KM Junior Boys (13-17 years)" receives a gender error
- [ ] A ticket with no eligibility rules accepts any registrant
- [ ] Error messages are displayed in the correct language (English/BM based on locale)

#### Admin Bypass

- [ ] An admin creating a registration via the admin panel is not blocked by eligibility rules

---

## 10. Implementation Order

Features A and B are independent and can be developed in parallel. Within each feature:

### Feature A — Option Overrides

1. TypeScript type update — add `options_override` to `RegistrationField`
2. PHP validation rules update — allow `options_override` through `StoreEventRequest`
3. `resolveFieldOptions()` helper — TypeScript and PHP implementations
4. Public form (`Register.tsx`) — use `resolveFieldOptions()` when rendering options
5. Backend validation (`StoreEventRegistrationRequest.php`) — use `resolveFieldOptions()` for `in:` rules
6. Admin field builder UI — "Options by ticket" sub-panel
7. Ticket rename sweep — extend existing sweep to cover `options_override` keys

### Feature B — Eligibility Rules

1. Database migration — add `min_age`, `max_age`, `allowed_gender` to `event_tickets`
2. `EventTicket` model — add new columns to `$fillable` and `$casts`
3. Ticket controller — accept and save new columns
4. Eligibility check logic — PHP service/method
5. Backend validation integration — call eligibility check after field validation
6. Ticket modal UI — "Eligibility Rules" section
7. Public form error display — show eligibility errors inline

---

## 11. Decisions (Closed)

| #   | Question                                                                                                                                                        | Decision                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Should the public form show the eligibility requirements upfront (e.g. "Age: 13–17") on the ticket selection step, so registrants know before filling the form? | **Yes** — show age range and gender restriction as a badge/label on each ticket card in step 1                                                 |
| 2   | If both `ticket_scope` (field hidden for this ticket) and `options_override` (options set for this ticket) are set on the same field, which takes priority?     | **`ticket_scope` wins** — if the field is hidden for a ticket, any `options_override` for that ticket is ignored                               |
| 3   | Should option overrides support Bahasa Malaysia separately, or always mirror English?                                                                           | **Always mirror** — `options_ms` in an override is always set to the same values as `options_en`. No separate BM input needed in the admin UI. |
