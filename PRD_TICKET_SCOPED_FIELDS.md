# PRD — Ticket-Scoped Registration Fields

**Project:** Takaful4All Events Platform  
**Author:** Development  
**Date:** May 8, 2026  
**Status:** Planning  
**Depends On:** PRD_CUSTOM_REGISTRATION_FIELDS.md (must be completed first)

---

## 1. Background & Problem Statement

The Custom Registration Fields system (PRD_CUSTOM_REGISTRATION_FIELDS.md) introduced a per-event field list stored in `events.registration_fields`. This field list is **shared across all tickets** of that event.

This works for single-ticket events but breaks for multi-ticket events where different ticket categories include different entitlements. Concrete example from Bentong Monsoon Marathon 2026:

| Ticket             | Event T-shirt | Finisher T-shirt |
| ------------------ | ------------- | ---------------- |
| 42km Full Marathon | Yes           | Yes              |
| 21km Half Marathon | Yes           | Yes              |
| 12km Trail Run     | Yes           | **No**           |

The current system shows the "42km Finisher Tee Size" field to every registrant regardless of which ticket they picked. A 12km registrant:

- Sees a field that has nothing to do with their package
- Is asked for a size for an item they will never receive
- Gets a confirmation email listing "42km Finisher Tee Size: —" which looks like a data error

This problem scales: any multi-ticket event where different categories carry different inclusions will have this issue. Left unresolved it will create organiser confusion, registrant frustration, and dirty data in reports and exports.

---

## 2. Goals

1. Allow specific registration fields to be restricted to one or more ticket categories
2. The restriction is set inside the existing field editor — no new admin page required
3. Fields with no restriction continue to apply to all tickets (backward compatible)
4. The public registration form shows only the fields relevant to the selected ticket
5. The backend validator enforces only the fields relevant to the submitted ticket
6. The confirmation email and admin registration detail view display only the fields relevant to that registration's ticket
7. The seeder and future seeders can declare ticket scope at field definition time
8. When a ticket is renamed, all field scopes referencing the old name are automatically updated

---

## 3. Non-Goals (Out of Scope)

- Showing different field options (dropdown values) per ticket — only field visibility/requirement is in scope
- Per-ticket pricing of registration fields
- Conditional fields based on a field's answered value (e.g. show field B only if field A = "Yes") — this is a separate Phase 3 feature
- Changing the PDF ticket layout — PDF is already safe (does not display custom fields)
- Per-attendee ticket scope in multi-quantity registrations — all attendees in one order use the same ticket type, so scope applies uniformly

---

## 4. Solution Design

### 4.1 Core Concept

Add one optional property `ticket_scope` to the `RegistrationField` data structure.

```
ticket_scope: null        → field applies to ALL tickets (default, backward compatible)
ticket_scope: []          → effectively hidden from all tickets (edge case, allowed)
ticket_scope: ["42km Full Marathon", "21km Half Marathon"]  → only these tickets
```

Ticket names (strings) are used instead of ticket IDs (integers) because:

- Ticket IDs are auto-increment and change if a ticket is deleted and recreated during event setup
- Ticket names are the human-readable identifiers already displayed in the admin, PDF, and emails
- String-based matching is readable in raw JSON without cross-referencing another table

### 4.2 Data Structure Change

**Before (current `RegistrationField` interface):**

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
    ticket_scope?: string[] | null; // NEW — null = all tickets
}
```

**No database migration is required.** `registration_fields` is already stored as JSON in `events.registration_fields`. Adding a new property to the JSON structure is backward compatible — existing rows without `ticket_scope` will simply return `null` from PHP and `undefined` from TypeScript, both of which resolve to "applies to all tickets."

### 4.3 Scope Resolution Logic

A single helper function is used in all 4 touch points:

```
function fieldAppliesToTicket(field, ticketName):
    if field.ticket_scope is null or undefined → return true
    if field.ticket_scope is empty array → return false
    return field.ticket_scope includes ticketName
```

This function is implemented once in TypeScript (frontend) and once in PHP (backend). Both must use identical logic to avoid inconsistency.

---

## 5. Affected Touch Points

All 4 touch points must be updated together. Updating fewer than 4 will create inconsistencies that are difficult to debug in production.

### Touch Point 1 — Public Registration Form (`Register.tsx`)

**Current behaviour:** `sortedFields` is built from all `event.registration_fields` sorted by `sort_order`. Ticket selection has no effect on which fields are shown.

**Required change:** After ticket selection (step 1), the fields shown in step 2 (Your Info) must be filtered through `fieldAppliesToTicket(field, selectedTicket.name)`. Fields outside scope are hidden and their inputs are not rendered (not just visually hidden — they must not exist in the DOM to prevent accidental submission of blank required fields).

**Step transition:** The "Next: Your Info" button is already gated on `!data.ticket_id`. No change needed here. Field filtering happens after the ticket is selected and the user proceeds to step 2.

### Touch Point 2 — Backend Validation (`StoreEventRegistrationRequest.php`)

**Current behaviour:** The backend builds dynamic validation rules from `event->registration_fields` and applies `required` rules without checking which ticket was selected.

**Required change:** During rule building, resolve the selected ticket name from `ticket_id` (which is submitted in the same request payload). Filter fields using `fieldAppliesToTicket` before building validation rules. A field that is out of scope for the selected ticket must not have a `required` rule applied, regardless of its `required` flag in the field definition.

**Security note:** The ticket name used for filtering must be read from the database (via `ticket_id → EventTicket::find → name`), not from the request payload. Accepting ticket names directly from the user is an injection risk.

### Touch Point 3 — Confirmation Email (`ticket-confirmation.blade.php`)

**Current behaviour:** Line 384 reads `$registration->event->registration_fields` and iterates over all fields to display answers. Fields with blank answers (because they were out of scope) show as "—" in the email.

**Required change:** Filter the field list using `fieldAppliesToTicket($field, $registration->ticket->name)` before rendering the custom fields section. Out-of-scope fields must not appear in the email at all.

### Touch Point 4 — Admin Registration Detail View (`Registrations/Show.tsx`)

**Current behaviour:** Lines 109–180 iterate `event.registration_fields` to display custom field answers. Out-of-scope fields show with blank values, which admins mistake for missing data.

**Required change:** Filter fields by `fieldAppliesToTicket(field, registration.ticket.name)` before rendering. The `registration` prop already carries `ticket_id`; the ticket name must be included in the prop passed from the controller.

---

## 6. Admin UI — Field Scope Editor

### 6.1 Where it lives

Inside `RegistrationFieldBuilder.tsx`, in the existing `FieldCard` expanded editor panel. A new section is added below the "Required" toggle.

### 6.2 Behaviour

- The section is titled **"Applies to tickets"**
- It renders only when the event has at least one ticket saved (i.e., on the **Edit event** page, not the **Create event** page — tickets do not exist yet during creation)
- On the Create event page, the section is hidden entirely (no tickets to select from yet)
- The field lists available ticket names, sourced from a `tickets` prop passed to the event edit page

### 6.3 UI Controls

| State                           | Display                                            |
| ------------------------------- | -------------------------------------------------- |
| `ticket_scope = null` (default) | "All tickets" chip — full-width, teal/green colour |
| One or more tickets selected    | Chips showing selected ticket names                |
| None selected (empty array)     | Warning state — "Not shown to any ticket" in amber |

The admin interacts with **checkbox toggles**, one per ticket name. Toggling all tickets on is equivalent to setting `null`. Toggling all off is allowed but shows the amber warning.

### 6.4 Locked fields

The three locked fields (Full Name, Email, Phone) cannot have `ticket_scope` set. They always apply to all tickets. The scope section is hidden for locked fields.

---

## 7. Ticket Rename Safety

When an admin renames a ticket, the old name may be referenced in `ticket_scope` arrays of the event's `registration_fields`.

**Required behaviour:** The ticket controller's update action, after saving the new ticket name, must scan `event->registration_fields` for any field where `ticket_scope` contains the old name, replace it with the new name, and save the updated `registration_fields` back to the event.

This must happen inside the same database transaction as the ticket name update to prevent partial updates.

---

## 8. Seeder Behaviour

Seeders that define registration fields can now include `ticket_scope` in the field definition array. Since ticket IDs are not known at the time the `$registrationFields` array is declared (tickets are created after the event), ticket names must be used.

**Pattern for seeders:**

```php
// Fields array is declared first, referencing ticket names
$registrationFields = [
    // ...shared fields (no ticket_scope key = applies to all)...
    ['key' => 'finisher_tee_size', ..., 'ticket_scope' => ['42km Full Marathon', '21km Half Marathon']],
    // 12km Trail Run is intentionally excluded
];

// Event is then created/updated with those fields
$event = Event::updateOrCreate([...], ['registration_fields' => $registrationFields, ...]);

// Tickets are created after — names must match exactly what is in ticket_scope above
$event->tickets()->create(['name' => '42km Full Marathon', ...]);
$event->tickets()->create(['name' => '21km Half Marathon', ...]);
$event->tickets()->create(['name' => '12km Trail Run', ...]);
```

---

## 9. Backward Compatibility

| Scenario                                                 | Behaviour                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Existing event with no `ticket_scope` on any field       | All fields shown to all tickets — no change                  |
| Existing registration record — admin views it            | All fields shown (no ticket scope filtering, same as before) |
| Existing registration record — resend confirmation email | All fields shown (same as before)                            |
| New field added via admin panel                          | `ticket_scope` defaults to `null` — applies to all tickets   |
| Event with single ticket                                 | `ticket_scope` has no practical effect — no UI to set it     |

No data migration is required. No existing event, registration, or attendee record is affected.

---

## 10. Validation Rules Update

The `registration_fields.*.ticket_scope` property must be allowed through the `StoreEventRequest` and `UpdateEventRequest` validation rules.

```php
'registration_fields.*.ticket_scope' => 'nullable|array',
'registration_fields.*.ticket_scope.*' => 'nullable|string|max:255',
```

---

## 11. Acceptance Criteria

### Admin Panel

- [ ] On the event edit page, each non-locked field in the field builder shows an "Applies to tickets" section
- [ ] The section shows checkboxes for each ticket belonging to the event
- [ ] Default state (no selection made) = all tickets = `ticket_scope: null`
- [ ] Selecting specific tickets saves `ticket_scope: ["Ticket Name A", "Ticket Name B"]` into the field JSON
- [ ] The "Applies to tickets" section does NOT appear on the event create page
- [ ] Renaming a ticket updates all `ticket_scope` references in the event's `registration_fields`

### Public Registration Form

- [ ] When a ticket is selected in step 1, only fields with matching or null `ticket_scope` are shown in step 2
- [ ] A field outside scope is not rendered in the DOM (not just hidden with CSS)
- [ ] Changing ticket selection clears and re-renders the form with the correct fields
- [ ] A field marked `required: true` but outside scope for the selected ticket does not block form submission

### Backend Validation

- [ ] Submitting a registration for "12km Trail Run" without `finisher_tee_size` passes validation
- [ ] Submitting a registration for "42km Full Marathon" without `finisher_tee_size` fails validation (field is required and in scope)
- [ ] The ticket name for scope resolution is always read from the database, never from the request payload

### Confirmation Email

- [ ] A 12km registrant's confirmation email does not show "42km Finisher Tee Size"
- [ ] A 42km registrant's confirmation email shows "42km Finisher Tee Size" with their selected size
- [ ] No "—" / blank values appear for out-of-scope fields

### Admin Registration Detail

- [ ] Viewing a 12km registration in the admin does not show "42km Finisher Tee Size" with a blank value
- [ ] Viewing a 42km registration shows all in-scope fields including Finisher Tee Size
- [ ] No data appears to be "missing" for out-of-scope fields

### Seeder

- [ ] Running the Bentong Monsoon Marathon seeder produces: `finisher_tee_size` is shown for 42km and 21km, hidden for 12km
- [ ] Existing events without `ticket_scope` in their field definitions are unaffected

---

## 12. Implementation Order

The 4 touch points must be implemented in this order to avoid introducing bugs at any intermediate state:

1. **Data layer** — Add `ticket_scope` to `RegistrationField` TypeScript type + PHP validation rules
2. **Seeder** — Update `BentongMonsoonMarathonSeeder` with `ticket_scope` on `finisher_tee_size`
3. **Frontend form** — Filter fields in `Register.tsx` by selected ticket name
4. **Backend validation** — Filter required rules in `StoreEventRegistrationRequest.php`
5. **Admin field editor** — Add "Applies to tickets" UI in `RegistrationFieldBuilder.tsx`
6. **Admin detail view** — Filter fields in `Registrations/Show.tsx`
7. **Confirmation email** — Filter fields in `ticket-confirmation.blade.php`
8. **Ticket rename safety** — Update ticket controller to sync `ticket_scope` on name change

---

## 13. Files to Be Changed

| File                                                     | Change Type                                         |
| -------------------------------------------------------- | --------------------------------------------------- |
| `resources/js/types/index.ts`                            | Add `ticket_scope` to `RegistrationField` interface |
| `resources/js/Pages/Public/Events/Register.tsx`          | Filter `sortedFields` by selected ticket name       |
| `resources/js/Components/RegistrationFieldBuilder.tsx`   | Add "Applies to tickets" UI section                 |
| `resources/js/Pages/Admin/Events/Registrations/Show.tsx` | Filter fields by registration ticket name           |
| `app/Http/Requests/StoreEventRegistrationRequest.php`    | Scope-aware required validation                     |
| `app/Http/Requests/StoreEventRequest.php`                | Allow `ticket_scope` through validation             |
| `app/Http/Requests/UpdateEventRequest.php` (if exists)   | Allow `ticket_scope` through validation             |
| `app/Http/Controllers/EventTicketController.php`         | Sync `ticket_scope` on ticket rename                |
| `resources/views/emails/ticket-confirmation.blade.php`   | Filter fields by ticket name                        |
| `database/seeders/BentongMonsoonMarathonSeeder.php`      | Add `ticket_scope` to `finisher_tee_size`           |

---

## 14. Risk Register

| Risk                                                                                       | Likelihood                       | Impact                                     | Mitigation                                                          |
| ------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Frontend filters field but backend still validates it as required                          | High (if partial implementation) | High — form submission blocked silently    | Implement Touch Points 3 and 4 together, test with unit test        |
| Ticket renamed, scope references become orphaned                                           | Medium                           | Medium — field shows for all tickets again | Implement rename sync in ticket controller (Touch Point 8)          |
| Admin confused by empty "Applies to tickets" section on Create page                        | Medium                           | Low — cosmetic confusion                   | Hide section entirely on Create page                                |
| `ticket_scope: []` (empty array) causes field to disappear for all tickets with no warning | Low                              | Medium — data collection gap               | Show amber warning in admin UI when all tickets are deselected      |
| Report/export feature (future) reads all fields without scope filtering                    | High (future)                    | Medium — blank columns in export           | Document scope resolution logic in a shared helper for future reuse |
