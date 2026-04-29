# Inline QR Code in Email — Implementation Guide

> Written based on real production experience. Follow this exactly to avoid wasting hours on dead ends.

---

## 🎯 Goal

Embed a QR code **directly inside a confirmation email** so users can scan it without downloading any PDF or attachment. Like RedBus or airline e-tickets.

**Result looks like this:**

- Email opens → QR code visible immediately
- User scans QR with phone at entrance
- QR contains registration reference + attendee number

---

## ⚙️ Tech Stack

- Laravel 11
- Symfony Mailer (built into Laravel 11 — replaces old SwiftMailer)
- `simplesoftwareio/simple-qrcode` v4.x
- Queue: database driver
- Email: SMTP

---

## 📦 Install QR Package

```bash
composer require simplesoftwareio/simple-qrcode
```

> Requires `ext-gd` or `ext-imagick` on the server for PNG format.

---

## ✅ The Working Solution (Use This — Skip Everything Else)

### Step 1: The Mailable Class

```php
<?php

namespace App\Mail;

use App\Models\EventRegistration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Symfony\Component\Mime\Email as SymfonyEmail;
use Symfony\Component\Mime\Part\DataPart;

class RegistrationConfirmationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly EventRegistration $registration,
    ) {}

    public function build(): static
    {
        $registration = $this->registration;
        $registration->loadMissing(['event', 'attendees']);

        // Build QR codes for each attendee
        $qrCids  = [];
        $qrParts = [];

        foreach ($registration->attendees as $attendee) {
            try {
                // Define what the QR code contains when scanned
                $qrPayload = json_encode([
                    'ref'         => $registration->reference_no,
                    'attendee_no' => $attendee->attendee_no,
                ]);

                // IMPORTANT: Cast to (string) — QrCode::generate() returns HtmlString object, not string
                $qrPng = (string) QrCode::format('png')
                    ->size(300)
                    ->margin(0)
                    ->generate($qrPayload);

                // Unique CID per attendee
                $cid = 'qr-' . $registration->id . '-' . $attendee->attendee_no . '@yourdomain.com';

                // Create Symfony inline attachment
                $part = (new DataPart($qrPng, "qr-{$attendee->attendee_no}.png", 'image/png'))
                    ->asInline()
                    ->setContentId($cid);

                $qrCids[$attendee->attendee_no]  = $cid;
                $qrParts[$attendee->attendee_no] = $part;

            } catch (\Exception $e) {
                Log::error('Failed to generate QR code for attendee in email', [
                    'registration_id' => $registration->id,
                    'attendee_no'     => $attendee->attendee_no,
                    'error'           => $e->getMessage(),
                ]);
            }
        }

        // Attach QR parts directly to the Symfony Email object (the ONLY way in Laravel 11)
        $this->withSymfonyMessage(function (SymfonyEmail $email) use ($qrParts) {
            foreach ($qrParts as $part) {
                $email->addPart($part);
            }
        });

        return $this
            ->subject('Registration Confirmed – ' . $registration->event?->title)
            ->view('emails.ticket-confirmation', [
                'registration' => $registration,
                'qrCids'       => $qrCids,
            ]);
    }
}
```

---

### Step 2: The Blade Template

Use a **table-based HTML layout** (no flexbox/grid — email clients don't support them).

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
    </head>
    <body>
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    {{-- Loop attendees --}} @foreach ($registration->attendees
                    as $attendee)
                    <table width="600" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <p>{{ $attendee->full_name }}</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                {{-- Reference the QR by CID --}} @if
                                (!empty($qrCids[$attendee->attendee_no]))
                                <img
                                    src="cid:{{ $qrCids[$attendee->attendee_no] }}"
                                    width="220"
                                    height="220"
                                    alt="Ticket QR Code"
                                    style="display: block;"
                                />
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <p>Scan at entrance</p>
                                <p>
                                    Ref: {{ $registration->reference_no }}-0{{
                                    $attendee->attendee_no }}
                                </p>
                            </td>
                        </tr>
                    </table>
                    @endforeach
                </td>
            </tr>
        </table>
    </body>
</html>
```

---

### Step 3: Dispatch the Email

In your Observer or Controller:

```php
Mail::to($registration->email)
    ->queue(new RegistrationConfirmationMail($registration));
```

---

## ❌ Dead Ends — Do NOT Use These

| Approach                                  | Why It Fails                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `Attachment::fromData()->inline()`        | `inline()` method does not exist in Laravel 11                         |
| `Attachment::fromData()->withContentId()` | `withContentId()` method does not exist in Laravel 11                  |
| `<img src="data:image/png;base64,...">`   | Gmail **blocks** base64 data URIs as a security policy                 |
| `$message->embedData()` in Blade          | Only worked with SwiftMailer (Laravel ≤8). Not available in Laravel 11 |

---

## ⚠️ Critical Gotcha

```php
// ❌ WRONG — returns HtmlString object, DataPart will crash
$qrPng = QrCode::format('png')->generate($data);

// ✅ CORRECT — cast to plain string first
$qrPng = (string) QrCode::format('png')->generate($data);
```

`QrCode::generate()` from `simplesoftwareio/simple-qrcode` returns `Illuminate\Support\HtmlString`, not a plain PHP string. Symfony's `DataPart` requires a plain string. Without the `(string)` cast, the job will fail silently in the queue with:

```
TypeError: The body of "Symfony\Component\Mime\Part\TextPart" must be a string,
a resource, or an instance of "Symfony\Component\Mime\Part\File"
(got "Illuminate\Support\HtmlString")
```

---

## 🔍 How to Debug If QR Doesn't Show

### 1. Check failed jobs first

```bash
php artisan tinker
>>> DB::table('failed_jobs')->orderBy('failed_at','desc')->value('exception');
```

### 2. Run queue manually to see errors instantly

```bash
php artisan queue:work --once
```

### 3. Preview the email as HTML file

```bash
php artisan email:preview-confirmation {registration_id}
# Opens: storage/app/private/email-previews/preview-{id}.html
```

> Note: QR will show as broken image in HTML preview — this is expected.
> CID images only render inside a real email client (Gmail, Outlook etc.)

### 4. Send directly to inbox to verify

```bash
php artisan email:preview-confirmation {registration_id} --to=your@email.com
```

### 5. Flush failed jobs and retry after fixing

```bash
php artisan queue:flush
# Then trigger registration again via tinker
```

---

## 📋 Queue Setup Checklist

- [ ] `QUEUE_CONNECTION=database` in `.env`
- [ ] `jobs` and `failed_jobs` tables exist (`php artisan queue:table && php artisan migrate`)
- [ ] Cron job running on server:
    ```
    * * * * * /usr/local/bin/php /path/to/artisan queue:work --once --tries=3 --timeout=120
    ```
- [ ] After every deployment, check `failed_jobs` table for any errors

---

## ✅ Verify It Works

1. Register a test user for an event
2. Set payment to `paid` via tinker
3. Wait 1 minute for cron to process the queue job
4. Open Gmail — QR should be visible inline
5. Scan QR with phone — should return JSON: `{"ref":"EVT-xxx","attendee_no":1}`

---

## 📁 Files Involved

| File                                                   | Purpose                                |
| ------------------------------------------------------ | -------------------------------------- |
| `app/Mail/RegistrationConfirmationMail.php`            | Mailable — generates QR + builds email |
| `resources/views/emails/ticket-confirmation.blade.php` | Email HTML template                    |
| `app/Observers/EventRegistrationObserver.php`          | Triggers email when payment = paid     |
| `app/Console/Commands/PreviewConfirmationEmail.php`    | Testing tool                           |

---

_Guide written: April 2026 | Laravel 11 | Symfony Mailer_
