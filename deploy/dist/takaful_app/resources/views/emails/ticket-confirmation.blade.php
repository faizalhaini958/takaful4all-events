<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Booking Confirmed – {{ $registration->event->title }}</title>

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

<body style="margin:0;padding:0;background-color:#ebebeb;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ebebeb;">
<tr>
<td style="padding:24px 16px;">

    <!-- Main container -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"
        style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #d8d8d8;">

        <!-- Top accent bar -->
        <tr>
            <td style="background-color:#156486;height:4px;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>

        <!-- Header -->
        <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #eeeeee;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td>
                            <p style="margin:0;font-size:17px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.3px;">{{ $siteName }}</p>
                            <p style="margin:3px 0 0 0;font-size:10px;color:#999999;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Malaysian Takaful Association</p>
                        </td>
                        <td align="right" valign="middle">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#555555;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:1px;border:1px solid #cccccc;padding:5px 10px;">E-TICKET</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Confirmed status -->
        <tr>
            <td style="padding:22px 28px 20px 28px;border-bottom:1px solid #eeeeee;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color:#059669;border-radius:50%;width:34px;height:34px;text-align:center;vertical-align:middle;">
                                        <span style="font-size:17px;color:#ffffff;line-height:34px;display:block;">&#10003;</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td valign="middle">
                            <p style="margin:0 0 2px 0;font-size:17px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif;">Booking Confirmed</p>
                            <p style="margin:0;font-size:12px;color:#777777;font-family:Arial,Helvetica,sans-serif;">Show the QR code below at the entrance.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Event name -->
        <tr>
            <td style="padding:20px 28px 0 28px;">
                <p style="margin:0 0 4px 0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Event</p>
                <p style="margin:0;font-size:19px;font-weight:bold;color:#111111;line-height:1.35;font-family:Georgia,'Times New Roman',serif;">{{ $registration->event->title }}</p>
            </td>
        </tr>

        <!-- Event details table -->
        <tr>
            <td style="padding:16px 28px 24px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                    style="border:1px solid #e4e4e4;border-collapse:collapse;">

                    <!-- Date & Time -->
                    <tr>
                        <td style="padding:10px 14px;width:100px;background-color:#f7f7f7;border-right:1px solid #e4e4e4;border-bottom:1px solid #e4e4e4;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.7px;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">Date &amp; Time</p>
                        </td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e4;">
                            <p style="margin:0;font-size:13px;color:#222222;font-family:Arial,Helvetica,sans-serif;">
                                {{ \Carbon\Carbon::parse($registration->event->start_at)->format('D, d M Y') }}
                                &nbsp;&bull;&nbsp;
                                {{ \Carbon\Carbon::parse($registration->event->start_at)->format('g:i A') }}
                                @if ($registration->event->end_at && $registration->event->end_at != $registration->event->start_at)
                                    &ndash; {{ \Carbon\Carbon::parse($registration->event->end_at)->format('g:i A') }}
                                @endif
                            </p>
                        </td>
                    </tr>

                    <!-- Venue -->
                    <tr>
                        <td style="padding:10px 14px;background-color:#f7f7f7;border-right:1px solid #e4e4e4;border-bottom:1px solid #e4e4e4;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.7px;font-family:Arial,Helvetica,sans-serif;">Venue</p>
                        </td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e4;">
                            @if ($registration->event->venue)
                                <p style="margin:0;font-size:13px;color:#222222;font-family:Arial,Helvetica,sans-serif;">
                                    {{ $registration->event->venue }}@if ($registration->event->city || $registration->event->state), {{ implode(', ', array_filter([$registration->event->city, $registration->event->state])) }}@endif
                                </p>
                            @else
                                <p style="margin:0;font-size:13px;color:#aaaaaa;font-family:Arial,Helvetica,sans-serif;">To be announced</p>
                            @endif
                        </td>
                    </tr>

                    <!-- Reference -->
                    <tr>
                        <td style="padding:10px 14px;background-color:#f7f7f7;border-right:1px solid #e4e4e4;border-bottom:1px solid #e4e4e4;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.7px;font-family:Arial,Helvetica,sans-serif;">Reference</p>
                        </td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e4;">
                            <p style="margin:0;font-size:13px;font-weight:bold;color:#111111;font-family:'Courier New',Courier,monospace;letter-spacing:0.5px;">{{ $registration->reference_no }}</p>
                        </td>
                    </tr>

                    <!-- Ticket -->
                    <tr>
                        <td style="padding:10px 14px;background-color:#f7f7f7;border-right:1px solid #e4e4e4;border-bottom:1px solid #e4e4e4;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.7px;font-family:Arial,Helvetica,sans-serif;">Ticket</p>
                        </td>
                        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e4;">
                            <p style="margin:0;font-size:13px;color:#222222;font-family:Arial,Helvetica,sans-serif;">{{ $registration->ticket?->name ?? '—' }} &times; {{ $registration->quantity }}</p>
                        </td>
                    </tr>

                    <!-- Total Paid -->
                    <tr>
                        <td style="padding:10px 14px;background-color:#f7f7f7;border-right:1px solid #e4e4e4;vertical-align:top;">
                            <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:0.7px;font-family:Arial,Helvetica,sans-serif;">Total Paid</p>
                        </td>
                        <td style="padding:10px 14px;">
                            <p style="margin:0;font-size:14px;font-weight:bold;color:#059669;font-family:Arial,Helvetica,sans-serif;">{{ $registration->currency ?? 'MYR' }} {{ number_format($registration->total_amount, 2) }}</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>

        <!-- Attendees -->
        @if ($registration->attendees->count() > 0)

            <!-- Dashed separator -->
            <tr>
                <td style="padding:0 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                            <td style="border-top:2px dashed #dddddd;font-size:1px;line-height:1px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="padding:16px 28px 10px 28px;">
                    <p style="margin:0;font-size:10px;font-weight:bold;color:#aaaaaa;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Your Ticket{{ $registration->attendees->count() > 1 ? 's' : '' }}</p>
                </td>
            </tr>

            @foreach ($registration->attendees as $attendee)
                <tr>
                    <td style="padding:0 28px {{ $loop->last ? '28px' : '10px' }} 28px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                            style="border:1px solid #e0e0e0;">

                            <!-- Attendee header bar -->
                            <tr>
                                <td style="padding:9px 14px;background-color:#f2f2f2;border-bottom:1px solid #e0e0e0;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td>
                                                <p style="margin:0;font-size:10px;font-weight:bold;color:#555555;text-transform:uppercase;letter-spacing:0.8px;font-family:Arial,Helvetica,sans-serif;">Attendee #{{ $attendee->attendee_no }}</p>
                                            </td>
                                            <td align="right">
                                                <p style="margin:0;font-size:10px;color:#999999;font-family:Arial,Helvetica,sans-serif;">{{ $registration->ticket?->name ?? 'Ticket' }}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Attendee info -->
                            <tr>
                                <td style="padding:14px 14px 12px 14px;">
                                    <p style="margin:0 0 2px 0;font-size:15px;font-weight:bold;color:#111111;font-family:Arial,Helvetica,sans-serif;">{{ $attendee->name }}</p>
                                    <p style="margin:0 0 10px 0;font-size:12px;color:#777777;font-family:Arial,Helvetica,sans-serif;">{{ $attendee->email }}</p>

                                    @if ($attendee->company || $attendee->job_title)
                                        <p style="margin:0 0 8px 0;font-size:12px;color:#444444;font-family:Arial,Helvetica,sans-serif;">
                                            @if ($attendee->company)<strong>{{ $attendee->company }}</strong>@endif
                                            @if ($attendee->company && $attendee->job_title) &bull; @endif
                                            @if ($attendee->job_title){{ $attendee->job_title }}@endif
                                        </p>
                                    @endif

                                    @php
                                        $customFields = $attendee->meta_json['custom_fields'] ?? [];
                                        $regFields = $registration->event->registration_fields ?? [];
                                        $ticketName = $registration->ticket->name ?? null;
                                    @endphp

                                    @if (!empty($customFields) && !empty($regFields))
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                                            style="background-color:#f9f9f9;border:1px solid #e4e4e4;width:100%;">
                                            <tr>
                                                <td style="padding:8px 12px;">
                                                    @foreach ($regFields as $field)
                                                        @if (!in_array($field['key'], ['name', 'email', 'phone']))
                                                            @php
                                                                $scope = $field['ticket_scope'] ?? null;
                                                                $inScope = empty($scope) || ($ticketName && in_array($ticketName, $scope));
                                                                $cfVal = $customFields[$field['key']] ?? null;
                                                            @endphp
                                                            @if ($inScope && !empty($cfVal) && $cfVal !== 'false')
                                                                <p style="margin:2px 0;font-size:12px;color:#333333;font-family:Arial,Helvetica,sans-serif;">
                                                                    <span style="color:#999999;">{{ $field['label_en'] }}:</span>
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

                            <!-- Dashed perforation -->
                            <tr>
                                <td style="padding:0 14px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tr>
                                            <td style="border-top:2px dashed #dddddd;font-size:1px;line-height:1px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- QR Code -->
                            <tr>
                                <td style="padding:20px 14px;text-align:center;background-color:#fafafa;">
                                    @if (!empty($qrCids[$attendee->attendee_no]))
                                        <img src="cid:{{ $qrCids[$attendee->attendee_no] }}"
                                            width="160" height="160"
                                            alt="QR Code"
                                            style="display:inline-block;border:1px solid #cccccc;">
                                    @endif
                                    <p style="margin:10px 0 2px 0;font-size:10px;font-weight:bold;color:#555555;text-transform:uppercase;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Scan at Entrance</p>
                                    <p style="margin:0;font-size:11px;color:#bbbbbb;font-family:'Courier New',Courier,monospace;">{{ $registration->reference_no }}-{{ str_pad($attendee->attendee_no, 2, '0', STR_PAD_LEFT) }}</p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            @endforeach

        @endif

        <!-- Action button -->
        @if (\Illuminate\Support\Facades\Route::has('user.tickets'))
        <tr>
            <td style="padding:20px 28px 28px 28px;border-top:1px solid #eeeeee;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td style="background-color:#156486;text-align:center;">
                            <a href="{{ route('user.tickets') }}" style="display:block;padding:13px 32px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">View My Tickets</a>
                        </td>
                    </tr>
                </table>
                <p style="margin:8px 0 0 0;font-size:11px;color:#aaaaaa;text-align:center;font-family:Arial,Helvetica,sans-serif;">Login required to view your tickets online.</p>
            </td>
        </tr>
        @endif

        <!-- Footer -->
        <tr>
            <td style="background-color:#f5f5f5;padding:18px 28px;text-align:center;border-top:1px solid #e0e0e0;">
                <p style="margin:0 0 4px 0;font-size:12px;font-weight:bold;color:#444444;font-family:Arial,Helvetica,sans-serif;">{{ $siteName }}</p>
                @if ($contactEmail)
                    <p style="margin:0 0 6px 0;font-size:11px;color:#999999;font-family:Arial,Helvetica,sans-serif;">
                        Need help? <a href="mailto:{{ $contactEmail }}" style="color:#156486;text-decoration:none;">{{ $contactEmail }}</a>
                        @if (!empty($contactPhone))
                            or <a href="tel:{{ $contactPhone }}" style="color:#156486;text-decoration:none;">{{ $contactPhone }}</a>
                        @endif
                    </p>
                @endif
                <p style="margin:0;font-size:11px;color:#bbbbbb;font-family:Arial,Helvetica,sans-serif;">&copy; {{ date('Y') }} {{ $siteName }}. All rights reserved.</p>
            </td>
        </tr>

        <!-- Bottom accent bar -->
        <tr>
            <td style="background-color:#156486;height:4px;font-size:1px;line-height:1px;">&nbsp;</td>
        </tr>

    </table>

</td>
</tr>
</table>

</body>

</html>
