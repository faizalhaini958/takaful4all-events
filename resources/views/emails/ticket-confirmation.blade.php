<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Registration Confirmed – {{ $registration->event->title }}</title>

    @if ($registration->event)
        @php
            // Build Schema.org EventReservation structured data for Gmail rich cards
            $schemaData = [
                '@context' => 'http://schema.org',
                '@type' => 'EventReservation',
                'reservationNumber' => $registration->reference_no,
                'reservationStatus' =>
                    $registration->payment_status === 'paid'
                        ? 'http://schema.org/ReservationConfirmed'
                        : 'http://schema.org/ReservationPending',
                'underName' => [
                    '@type' => 'Person',
                    'name' => $registration->name,
                    'email' => $registration->email,
                ],
                'reservationFor' => [
                    '@type' => 'Event',
                    'name' => $registration->event->title,
                    'startDate' => \Carbon\Carbon::parse($registration->event->start_at)->toIso8601String(),
                    'endDate' => $registration->event->end_at
                        ? \Carbon\Carbon::parse($registration->event->end_at)->toIso8601String()
                        : \Carbon\Carbon::parse($registration->event->start_at)->addHours(3)->toIso8601String(),
                ],
                'modifyReservationUrl' => \Illuminate\Support\Facades\Route::has('user.tickets')
                    ? route('user.tickets')
                    : config('app.url'),
                'ticketToken' =>
                    'qrCode:' .
                    json_encode([
                        'ref' => $registration->reference_no,
                        'attendee_no' => 1,
                    ]),
            ];

            // Add location if venue exists
            if ($registration->event->venue) {
                $addressParts = array_filter([
                    $registration->event->venue,
                    $registration->event->city,
                    $registration->event->state,
                    $registration->event->country ?? 'Malaysia',
                ]);

                $schemaData['reservationFor']['location'] = [
                    '@type' => 'Place',
                    'name' => $registration->event->venue,
                    'address' => implode(', ', $addressParts),
                ];
            }
        @endphp

        <script type="application/ld+json">
        {!! json_encode($schemaData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) !!}
    </script>
    @endif
</head>

<body style="margin: 0; padding: 0; background-color: #EEF2F7; font-family: Arial, Helvetica, sans-serif;">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background-color: #EEF2F7;">
        <tr>
            <td style="padding: 32px 16px;">

                <!-- Main container -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"
                    style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);">

                    <!-- Gold top accent stripe -->
                    <tr>
                        <td style="background-color: #1d8bc9; height: 5px; font-size: 1px; line-height: 1px;">&nbsp;
                        </td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #156486; padding: 28px 32px 24px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td>
                                        <h1
                                            style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.5px;">
                                            {{ $siteName }}
                                        </h1>
                                        <p
                                            style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.65); font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
                                            Malaysian Takaful Association
                                        </p>
                                    </td>
                                    <td align="right" valign="middle">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td
                                                    style="background-color: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.4); border-radius: 6px; padding: 6px 14px;">
                                                    <p
                                                        style="margin: 0; font-size: 11px; font-weight: bold; color: #ffffff; font-family: Arial, Helvetica, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                                                        E-Ticket
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero confirmed banner -->
                    <tr>
                        <td style="background: #156486; padding: 0 32px 28px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                                style="background-color: rgba(255,255,255,0.1); border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);">
                                <tr>
                                    <td style="padding: 24px 28px;">
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right: 16px; vertical-align: middle;">
                                                    <!-- Checkmark circle -->
                                                    <table role="presentation" cellpadding="0" cellspacing="0"
                                                        border="0">
                                                        <tr>
                                                            <td
                                                                style="background-color: #059669; border-radius: 50%; width: 44px; height: 44px; text-align: center; vertical-align: middle;">
                                                                <span
                                                                    style="font-size: 22px; color: #ffffff; line-height: 44px; display: block;">&#10003;</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td>
                                                    <p
                                                        style="margin: 0 0 2px 0; font-size: 20px; font-weight: bold; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                                                        Registration Confirmed!
                                                    </p>
                                                    <p
                                                        style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.7); font-family: Arial, Helvetica, sans-serif;">
                                                        Show the QR code below at the entrance
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- White body start -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 32px 32px 0 32px;">

                            <!-- Event title -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                                style="border-left: 4px solid #1d8bc9; padding-left: 0; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding-left: 16px;">
                                        <p
                                            style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #1d8bc9; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Event
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 20px; font-weight: bold; color: #156486; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">
                                            {{ $registration->event->title }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- 2-column: Date + Venue -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                                style="margin-bottom: 20px;">
                                <tr>
                                    <!-- Date -->
                                    <td width="50%" valign="top"
                                        style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 18px;">
                                        <p
                                            style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #1d8bc9; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Date &amp; Time
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 13px; color: #156486; font-weight: bold; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                                            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('D, d M Y') }}
                                        </p>
                                        <p
                                            style="margin: 2px 0 0 0; font-size: 13px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                                            {{ \Carbon\Carbon::parse($registration->event->start_at)->format('g:i A') }}
                                            @if ($registration->event->end_at && $registration->event->end_at != $registration->event->start_at)
                                                –
                                                {{ \Carbon\Carbon::parse($registration->event->end_at)->format('g:i A') }}
                                            @endif
                                        </p>
                                    </td>

                                    <td width="12px"></td>

                                    <!-- Venue -->
                                    <td width="50%" valign="top"
                                        style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 18px;">
                                        <p
                                            style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #1d8bc9; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Venue
                                        </p>
                                        @if ($registration->event->venue)
                                            <p
                                                style="margin: 0; font-size: 13px; color: #156486; font-weight: bold; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                                                {{ $registration->event->venue }}
                                            </p>
                                            <p
                                                style="margin: 2px 0 0 0; font-size: 13px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                                                @if ($registration->event->city || $registration->event->state)
                                                    {{ implode(', ', array_filter([$registration->event->city, $registration->event->state])) }}
                                                @endif
                                            </p>
                                        @else
                                            <p
                                                style="margin: 0; font-size: 13px; color: #9CA3AF; font-family: Arial, Helvetica, sans-serif;">
                                                To be announced
                                            </p>
                                        @endif
                                    </td>
                                </tr>
                            </table>

                            <!-- 3-column: Ref + Ticket + Total -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                                style="margin-bottom: 32px;">
                                <tr>
                                    <!-- Reference Number -->
                                    <td width="40%" valign="top"
                                        style="background-color: #156486; border-radius: 8px; padding: 16px 18px;">
                                        <p
                                            style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Reference No.
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 15px; font-weight: bold; color: #ffffff; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">
                                            {{ $registration->reference_no }}
                                        </p>
                                    </td>

                                    <td width="12px"></td>

                                    <!-- Ticket Type -->
                                    <td width="30%" valign="top"
                                        style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 18px;">
                                        <p
                                            style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #1d8bc9; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Ticket
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 13px; color: #156486; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
                                            {{ $registration->ticket?->name ?? '—' }}
                                        </p>
                                        <p
                                            style="margin: 2px 0 0 0; font-size: 13px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                                            x{{ $registration->quantity }}
                                        </p>
                                    </td>

                                    <td width="12px"></td>

                                    <!-- Total Paid -->
                                    <td width="30%" valign="top"
                                        style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 18px;">
                                        <p
                                            style="margin: 0 0 6px 0; font-size: 10px; font-weight: bold; color: #1d8bc9; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                            Total Paid
                                        </p>
                                        <p
                                            style="margin: 0; font-size: 16px; font-weight: bold; color: #059669; font-family: Arial, Helvetica, sans-serif;">
                                            {{ $registration->currency ?? 'MYR' }}
                                            {{ number_format($registration->total_amount, 2) }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- YOUR TICKETS section header -->
                    @if ($registration->attendees->count() > 0)
                        <tr>
                            <td style="background-color: #ffffff; padding: 0 32px 16px 32px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                                    width="100%" style="border-top: 2px dashed #E2E8F0;">
                                    <tr>
                                        <td style="padding-top: 24px;">
                                            <p
                                                style="margin: 0; font-size: 12px; font-weight: bold; color: #6B7280; text-transform: uppercase; letter-spacing: 1.5px; font-family: Arial, Helvetica, sans-serif;">
                                                Your Tickets
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Attendee ticket cards -->
                        <tr>
                            <td style="background-color: #ffffff; padding: 0 32px 28px 32px;">

                                @foreach ($registration->attendees as $attendee)
                                    <!-- Ticket card with perforated top -->
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                                        width="100%"
                                        style="border: 1px solid #E2E8F0; border-radius: 10px; margin-bottom: 20px; overflow: hidden;">

                                        <!-- Ticket card top bar -->
                                        <tr>
                                            <td style="background-color: #156486; padding: 12px 20px;">
                                                <table role="presentation" cellpadding="0" cellspacing="0"
                                                    border="0" width="100%">
                                                    <tr>
                                                        <td>
                                                            <p
                                                                style="margin: 0; font-size: 12px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                                                Attendee #{{ $attendee->attendee_no }}
                                                            </p>
                                                        </td>
                                                        <td align="right">
                                                            <p
                                                                style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.6); font-family: Arial, Helvetica, sans-serif;">
                                                                {{ $registration->ticket?->name ?? 'Ticket' }}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- Ticket card body -->
                                        <tr>
                                            <td style="background-color: #ffffff; padding: 20px;">
                                                <table role="presentation" cellpadding="0" cellspacing="0"
                                                    border="0" width="100%">
                                                    <tr>
                                                        <!-- Attendee info (left) -->
                                                        <td valign="top">
                                                            <p
                                                                style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: #156486; font-family: Arial, Helvetica, sans-serif;">
                                                                {{ $attendee->name }}
                                                            </p>
                                                            <p
                                                                style="margin: 0 0 10px 0; font-size: 13px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                                                                {{ $attendee->email }}
                                                            </p>
                                                            @if ($attendee->company || $attendee->job_title)
                                                                <table role="presentation" cellpadding="0"
                                                                    cellspacing="0" border="0"
                                                                    style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px;">
                                                                    <tr>
                                                                        <td style="padding: 6px 12px;">
                                                                            <p
                                                                                style="margin: 0; font-size: 12px; color: #374151; font-family: Arial, Helvetica, sans-serif;">
                                                                                @if ($attendee->company)
                                                                                    <strong>{{ $attendee->company }}</strong>
                                                                                @endif
                                                                                @if ($attendee->company && $attendee->job_title)
                                                                                    &bull;
                                                                                @endif
                                                                                @if ($attendee->job_title)
                                                                                    {{ $attendee->job_title }}
                                                                                @endif
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            @endif
                                                            @php
                                                                $customFields =
                                                                    $attendee->meta_json['custom_fields'] ?? [];
                                                                $regFields =
                                                                    $registration->event->registration_fields ?? [];
                                                                $ticketName = $registration->ticket->name ?? null;
                                                            @endphp
                                                            @if (!empty($customFields) && !empty($regFields))
                                                                <table role="presentation" cellpadding="0"
                                                                    cellspacing="0" border="0"
                                                                    style="margin-top: 8px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; width: 100%;">
                                                                    <tr>
                                                                        <td style="padding: 6px 12px;">
                                                                            @foreach ($regFields as $field)
                                                                                @if (!in_array($field['key'], ['name', 'email', 'phone']))
                                                                                    @php
                                                                                        $scope =
                                                                                            $field['ticket_scope'] ??
                                                                                            null;
                                                                                        $inScope =
                                                                                            empty($scope) ||
                                                                                            ($ticketName &&
                                                                                                in_array(
                                                                                                    $ticketName,
                                                                                                    $scope,
                                                                                                ));
                                                                                        $cfVal =
                                                                                            $customFields[
                                                                                                $field['key']
                                                                                            ] ?? null;
                                                                                    @endphp
                                                                                    @if ($inScope && !empty($cfVal) && $cfVal !== 'false')
                                                                                        <p
                                                                                            style="margin: 2px 0; font-size: 12px; color: #374151; font-family: Arial, Helvetica, sans-serif;">
                                                                                            <span
                                                                                                style="color: #6B7280;">{{ $field['label_en'] }}:</span>
                                                                                            <strong>{{ $field['type'] === 'checkbox' ? '✓ Yes' : $cfVal }}</strong>
                                                                                        </p>
                                                                                    @endif
                                                                                @endif
                                                                            @endforeach
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            @endif
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- Dashed divider (perforated effect) -->
                                        <tr>
                                            <td style="padding: 0 20px;">
                                                <table role="presentation" cellpadding="0" cellspacing="0"
                                                    border="0" width="100%">
                                                    <tr>
                                                        <td
                                                            style="border-top: 2px dashed #E2E8F0; font-size: 1px; line-height: 1px;">
                                                            &nbsp;</td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- QR code section -->
                                        <tr>
                                            <td
                                                style="background-color: #FAFAFA; padding: 24px 20px; text-align: center;">
                                                @if (!empty($qrCids[$attendee->attendee_no]))
                                                    <table role="presentation" cellpadding="0" cellspacing="0"
                                                        border="0" align="center"
                                                        style="background-color: #ffffff; border: 3px solid #156486; border-radius: 10px; padding: 8px;">
                                                        <tr>
                                                            <td style="padding: 8px;">
                                                                <img src="cid:{{ $qrCids[$attendee->attendee_no] }}"
                                                                    width="180" height="180"
                                                                    alt="Ticket QR Code" style="display: block;">
                                                            </td>
                                                        </tr>
                                                    </table>
                                                @endif
                                                <p
                                                    style="margin: 14px 0 2px 0; font-size: 12px; font-weight: bold; color: #156486; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">
                                                    Scan at Entrance
                                                </p>
                                                <p
                                                    style="margin: 0; font-size: 12px; color: #9CA3AF; font-family: 'Courier New', Courier, monospace;">
                                                    {{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}
                                                </p>
                                            </td>
                                        </tr>

                                    </table>
                                @endforeach

                            </td>
                        </tr>
                    @endif

                    <!-- Action buttons -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 0 32px 32px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                                width="100%" style="border-top: 1px solid #E2E8F0; padding-top: 0;">
                                <tr>
                                    <td style="padding-top: 24px;">

                                        @if ($ticketUrl && $ticketUrl !== '#')
                                            <table role="presentation" cellpadding="0" cellspacing="0"
                                                border="0" width="100%" style="margin-bottom: 10px;">
                                                <tr>
                                                    <td
                                                        style="background-color: #156486; border-radius: 8px; text-align: center;">
                                                        <a href="{{ $ticketUrl }}"
                                                            style="display: block; padding: 15px 32px; font-size: 15px; font-weight: bold; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">
                                                            Download Ticket PDF
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif

                                        @if ($invoiceUrl)
                                            <table role="presentation" cellpadding="0" cellspacing="0"
                                                border="0" width="100%" style="margin-bottom: 10px;">
                                                <tr>
                                                    <td
                                                        style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; text-align: center;">
                                                        <a href="{{ $invoiceUrl }}"
                                                            style="display: block; padding: 13px 32px; font-size: 14px; font-weight: bold; color: #156486; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">
                                                            Download Invoice
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif

                                        @if (\Illuminate\Support\Facades\Route::has('user.tickets'))
                                            <table role="presentation" cellpadding="0" cellspacing="0"
                                                border="0" width="100%">
                                                <tr>
                                                    <td
                                                        style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; text-align: center;">
                                                        <a href="{{ route('user.tickets') }}"
                                                            style="display: block; padding: 13px 32px; font-size: 14px; font-weight: bold; color: #156486; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">
                                                            View My Tickets
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td
                            style="background-color: #156486; padding: 24px 32px; text-align: center; border-top: 3px solid #1d8bc9;">
                            <p
                                style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                                {{ $siteName }}
                            </p>
                            @if ($contactEmail)
                                <p
                                    style="margin: 0 0 10px 0; font-size: 12px; color: #94A3B8; font-family: Arial, Helvetica, sans-serif;">
                                    Need help? <a href="mailto:{{ $contactEmail }}"
                                        style="color: #1d8bc9; text-decoration: none;">{{ $contactEmail }}</a>
                                </p>
                            @endif
                            <p
                                style="margin: 0 0 4px 0; font-size: 11px; color: #64748B; font-family: Arial, Helvetica, sans-serif;">
                                &copy; {{ date('Y') }} {{ $siteName }}. All rights reserved.
                            </p>
                            <p
                                style="margin: 0; font-size: 11px; color: #475569; font-family: Arial, Helvetica, sans-serif;">
                                You are receiving this email because you registered for an event.
                            </p>
                        </td>
                    </tr>

                    <!-- Bottom gold stripe -->
                    <tr>
                        <td style="background-color: #1d8bc9; height: 5px; font-size: 1px; line-height: 1px;">&nbsp;
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>

</html>
