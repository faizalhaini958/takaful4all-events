# Today Tasks - Owner B (Partner)

Date: April 24, 2026
Goal: Improve admin attendee visibility and search usability.

## Priority 1 - Admin Data Visibility

- [ ] Confirm global registrations query eager loads attendees
    - Controller: `app/Http/Controllers/Admin/EventRegistrationController.php`
    - Method: `all()` should include `attendees`
- [ ] Verify attendee details render in admin registration detail modal
    - Page: `resources/js/Pages/Admin/Events/Registrations/Index.tsx`

## Priority 2 - Admin Search Improvement

- [ ] Extend global registration search to include attendee fields
    - Include attendee name and attendee email in search scope
- [ ] Validate search behavior for:
    - Primary registration name/email
    - Secondary attendee name/email

## Priority 3 - UX Polishing (Small, High Value)

- [ ] Add attendee status clarity in detail modal
    - Clear badge for `Checked In` vs `Pending`
- [ ] Add attendee count summary
    - Example: `3 attendees / 2 checked in`
- [ ] Add clear empty-state text when no attendees exist

## Test Scenarios

- [ ] Single-attendee registration shows correct data
- [ ] Multi-attendee registration shows all attendee rows
- [ ] Search by attendee email returns correct registration
- [ ] Search by attendee name returns correct registration

## Deliverables Before EOD

- [ ] Working search for attendee name/email in global admin page
- [ ] Updated admin registration UI with clear attendee/check-in state
- [ ] Short demo notes posted to team:
    - What changed
    - 2-3 screenshots or quick test proof
    - Any known limitation

## Done Criteria

- [ ] Global admin registration list can find attendee records
- [ ] Detail modal always shows attendee list when available
- [ ] UI communicates check-in status clearly
- [ ] No regression in existing event-specific registrations page
