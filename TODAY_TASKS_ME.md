# Today Tasks - Owner A (You)

Date: April 24, 2026
Goal: Stabilize check-in reliability and improve DB performance.

## Priority 1 - Critical Reliability

- [ ] Run migration status check
    - Command: `php artisan migrate:status`
- [ ] Apply pending migrations
    - Command: `php artisan migrate`
- [ ] Verify attendee check-in column exists
    - Confirm `event_registration_attendees.checked_in_at` exists and updates correctly

## Priority 2 - Database Performance

- [ ] Add index for registration admin filtering
    - `event_registrations (status, event_id)`
- [ ] Add index for event listing performance
    - `events (is_published, start_at)`
- [ ] Add index for post listing performance
    - `posts (is_published, type, published_at)`
- [ ] Add check-in analytics index
    - `event_registration_attendees (registration_id, checked_in_at)`

## Priority 3 - End-to-End Validation

- [ ] Test check-in by QR code
- [ ] Test check-in by manual code with suffix (example: `EVT-YYYYMMDD-XXXX-02`)
- [ ] Confirm only the selected attendee is marked checked in
- [ ] Confirm no SQL errors in logs

## Deliverables Before EOD

- [ ] Migration and index updates completed
- [ ] Short validation summary posted to team:
    - Commands executed
    - What passed
    - Any blocker

## Done Criteria

- [ ] Check-in works without SQLSTATE errors
- [ ] `checked_in_at` updates for the correct attendee
- [ ] Admin pages load faster after indexes
- [ ] No new critical error in `storage/logs/laravel.log`
