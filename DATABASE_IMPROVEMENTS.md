# Database & System Improvements - Handoff Document

**Created**: April 23, 2026  
**For**: Junior Developer  
**Priority**: Follow in order  
**Estimated Time**: 6-8 hours total

---

## 🚨 CRITICAL - DO FIRST (30 mins)

### Issue: `checked_in_at` Column Missing

**Current Status**: Migration created but NOT applied to database

**Steps**:
1. Open terminal and run:
   ```bash
   php artisan migrate
   ```
2. Verify it worked:
   ```bash
   php artisan tinker
   >>> DB::table('event_registration_attendees')->first();
   # Should show 'checked_in_at' field in output
   ```
3. Test check-in feature end-to-end:
   - Go to admin check-in page
   - Scan a QR code
   - Verify attendee marked as checked in (no SQL error)

**Files Involved**:
- Migration: `database/migrations/2026_04_23_000002_add_checked_in_at_to_event_registration_attendees_table.php`
- Model: `app/Models/EventRegistrationAttendee.php` (has `checked_in_at` in casts)

---

## Phase 1: Performance Improvements (1-2 hours)

### Task 1.1: Add Missing Database Indexes

**Why**: Current queries are slow because they scan entire tables. Indexes make lookups 10-100x faster.

**Run this SQL** (or create migration):

```sql
-- Registration status queries (used frequently in admin)
ALTER TABLE event_registrations ADD INDEX idx_status_event (status, event_id);

-- Email lookups (used in check-in, search)
ALTER TABLE event_registrations ADD INDEX idx_email (email);

-- Content discovery (posts filtered by published + type + date)
ALTER TABLE posts ADD INDEX idx_published_type (is_published, type, published_at DESC);

-- Event listing (published + upcoming events)
ALTER TABLE events ADD INDEX idx_published_start (is_published, start_at DESC);

-- Check-in analytics (find checked-in attendees per registration)
ALTER TABLE event_registration_attendees ADD INDEX idx_registration_checked_in (registration_id, checked_in_at);
```

**How to run**:
- Option A (Quick): Paste into MySQL console
- Option B (Proper): Create migration file:
  ```bash
  php artisan make:migration add_performance_indexes --create=false
  ```
  Then paste SQL into the migration's `up()` method

**Verify**: After running, query should execute instantly:
```sql
SELECT COUNT(*) FROM event_registrations WHERE status = 'completed' AND event_id = 1;
```

---

## Phase 2: Missing Core Fields (2-3 hours)

### Task 2.1: Add Promotion Code Tracking

**Why**: Users need to know which promo codes were used to get discounts

**Create Migration**:
```bash
php artisan make:migration add_promo_code_to_event_registrations
```

**Migration Content**:
```php
public function up()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->string('promo_code')->nullable()->after('discount');
        $table->decimal('discount_amount', 10, 2)->nullable()->after('promo_code');
        $table->string('discount_source')->nullable()->comment('e.g., promo_code, bulk_tier, early_bird')->after('discount_amount');
        $table->index(['promo_code']);
    });
}

public function down()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->dropColumn(['promo_code', 'discount_amount', 'discount_source']);
    });
}
```

**Then run**: `php artisan migrate`

---

### Task 2.2: Add Registration Source Tracking

**Why**: Marketing needs to know where registrations come from (email, social, direct, etc.)

**Create Migration**:
```bash
php artisan make:migration add_source_to_event_registrations
```

**Migration Content**:
```php
public function up()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->string('source')->nullable()->comment('direct, email_campaign, social_media, referral, etc.')->after('notes');
        $table->string('source_detail')->nullable()->comment('e.g., LinkedIn, Instagram, Agent name')->after('source');
        $table->index(['source']);
    });
}

public function down()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->dropColumn(['source', 'source_detail']);
    });
}
```

**Then run**: `php artisan migrate`

---

### Task 2.3: Add Admin Notes Field

**Why**: Admin staff need to add internal comments about registrations

**Create Migration**:
```bash
php artisan make:migration add_notes_to_event_registrations
```

**Migration Content**:
```php
public function up()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->text('admin_notes')->nullable()->after('user_id');
        $table->dateTime('notes_updated_at')->nullable()->after('admin_notes');
    });
}

public function down()
{
    Schema::table('event_registrations', function (Blueprint $table) {
        $table->dropColumn(['admin_notes', 'notes_updated_at']);
    });
}
```

**Then run**: `php artisan migrate`

---

## Phase 3: Audit & Compliance (3-4 hours)

### Task 3.1: Create Audit Logs Table

**Why**: Track all check-ins, cancellations, and changes for compliance and debugging

**Create Migration**:
```bash
php artisan make:migration create_audit_logs_table
```

**Migration Content**:
```php
public function up()
{
    Schema::create('audit_logs', function (Blueprint $table) {
        $table->id();
        $table->string('action')->comment('checked_in, registration_created, cancelled, updated, etc.');
        $table->string('entity_type')->comment('EventRegistration, EventRegistrationAttendee, etc.');
        $table->unsignedBigInteger('entity_id');
        $table->unsignedBigInteger('user_id')->nullable()->comment('Who performed the action');
        $table->json('changes')->nullable()->comment('What changed: old values, new values');
        $table->string('ip_address')->nullable();
        $table->timestamps();
        
        $table->index(['action', 'entity_type']);
        $table->index(['entity_id', 'entity_type']);
        $table->index(['user_id']);
        $table->index(['created_at']);
        
        $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
    });
}

public function down()
{
    Schema::dropIfExists('audit_logs');
}
```

**Then run**: `php artisan migrate`

**Update EventRegistrationAttendee Model** to log check-ins:

In `app/Models/EventRegistrationAttendee.php`, update `markAsCheckedIn()`:
```php
public function markAsCheckedIn(): void
{
    $this->update(['checked_in_at' => now()]);
    
    // Log to audit trail
    AuditLog::create([
        'action' => 'checked_in',
        'entity_type' => 'EventRegistrationAttendee',
        'entity_id' => $this->id,
        'user_id' => auth()->id(),
        'changes' => [
            'checked_in_at' => now(),
            'registration_id' => $this->registration_id,
            'attendee_no' => $this->attendee_no,
        ],
        'ip_address' => request()->ip(),
    ]);
}
```

---

### Task 3.2: Create Payment Transactions Table

**Why**: Log all ChipIn payment attempts and results for reconciliation

**Create Migration**:
```bash
php artisan make:migration create_payment_transactions_table
```

**Migration Content**:
```php
public function up()
{
    Schema::create('payment_transactions', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('registration_id');
        $table->unsignedBigInteger('user_id')->nullable();
        $table->decimal('amount', 10, 2);
        $table->string('currency')->default('MYR');
        $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
        $table->string('payment_method')->comment('credit_card, fpx, online_banking');
        $table->string('transaction_id')->nullable()->comment('ChipIn transaction ID');
        $table->string('reference_number')->nullable()->comment('Our reference for payment');
        $table->json('response')->nullable()->comment('Full ChipIn API response');
        $table->text('error_message')->nullable();
        $table->dateTime('completed_at')->nullable();
        $table->timestamps();
        
        $table->foreign('registration_id')->references('id')->on('event_registrations')->onDelete('cascade');
        $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        $table->index(['transaction_id']);
        $table->index(['status', 'created_at']);
        $table->index(['registration_id']);
    });
}

public function down()
{
    Schema::dropIfExists('payment_transactions');
}
```

**Then run**: `php artisan migrate`

---

## Phase 4: Data Fixes (1 hour)

### Task 4.1: Fix Event Zones Issue

**Current Status**: `event_zones` table exists but is empty, blocking zone feature

**Check if zones are used**:
```sql
SELECT COUNT(*) FROM event_tickets WHERE event_zone_id IS NOT NULL;
```

**If result is 0 (zones not used)**:
- Tickets work fine as-is, zone feature incomplete but not breaking

**If result > 0 (zones ARE used)**:
- Need to populate zones for these events
- Contact event organizers for zone information
- Populate table before running queries

---

### Task 4.2: Verify Empty Tables

These tables are expected to be empty. If they should have data, investigate:

| Table | Current | Expected | Action |
|-------|---------|----------|--------|
| `ticket_discount_tiers` | 0 | Any? | Check if bulk discounts are offered |
| `invoices` | 0 | Should auto-generate | Not implemented yet |
| `event_zones` | 0 | 0 or more | See Task 4.1 |

---

## Reference: Database Structure

### Core Tables (Working)
- ✅ `users` - User accounts (8 records)
- ✅ `event_registrations` - Registrations (21 records)
- ✅ `event_registration_attendees` - Per-seat attendees (26 records) **← This is the new system**
- ✅ `events` - Event definitions (11 records)
- ✅ `event_tickets` - Ticket types (10 records)
- ✅ `event_products` - Add-on products (5 records)
- ✅ `posts` - Content (31 records: podcasts, webinars, articles)
- ✅ `pages` - Static pages (7 records)

### Supporting Tables
- ✅ `media` - Images/files (38 records)
- ✅ `settings` - Configuration (13 records)
- ✅ `menus` - Navigation (3 menus)
- ✅ `user_payment_methods` - Payment info (2 records)

### Incomplete/Empty Tables
- ⚠️ `event_zones` - 0 records (not fully implemented)
- ⚠️ `ticket_discount_tiers` - 0 records (no bulk discounts configured)
- ⚠️ `invoices` - 0 records (auto-generation not implemented)

---

## Testing Checklist

After each migration/change, test:

- [ ] Migration runs without errors: `php artisan migrate`
- [ ] Rollback works: `php artisan migrate:rollback`
- [ ] No SQL errors in Laravel logs: `storage/logs/laravel.log`
- [ ] Admin pages still load
- [ ] Check-in feature still works
- [ ] Registrations can be viewed

---

## Questions?

If you get stuck:
1. Check migration order: `php artisan migrate:status`
2. Run rollback: `php artisan migrate:rollback`
3. Check Laravel logs: `tail -f storage/logs/laravel.log`
4. Ask the senior dev (whoever assigned this)

---

**Next Steps After Completion**:
1. Test all migrations
2. Update frontend forms to use new fields (promo_code, source, admin_notes)
3. Build admin dashboard to display audit logs
4. Generate reports by source/promo_code

Good luck! 🚀
