<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
        }
        .invoice-container {
            padding: 40px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 20px;
        }
        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }
        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 40%;
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
        }
        .company-details {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a5f;
        }
        .invoice-number {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        /* Info section */
        .info-section {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .info-block {
            display: table-cell;
            vertical-align: top;
            width: 33%;
        }
        .info-label {
            font-size: 10px;
            font-weight: bold;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 12px;
            color: #333;
        }

        /* Event section */
        .event-section {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 25px;
        }
        .event-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a5f;
        }
        .event-detail {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }

        /* Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background-color: #1e3a5f;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table th:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 12px;
        }
        .items-table td:last-child {
            text-align: right;
        }
        .items-table tbody tr:last-child td {
            border-bottom: 2px solid #1e3a5f;
        }

        /* Totals */
        .totals-section {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        .totals-qr {
            display: table-cell;
            vertical-align: top;
            width: 40%;
        }
        .totals-table {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }
        .total-row {
            display: table;
            width: 100%;
            padding: 5px 0;
        }
        .total-label {
            display: table-cell;
            text-align: right;
            padding-right: 20px;
            width: 70%;
            font-size: 12px;
        }
        .total-value {
            display: table-cell;
            text-align: right;
            width: 30%;
            font-size: 12px;
        }
        .total-row.grand {
            border-top: 2px solid #1e3a5f;
            margin-top: 5px;
            padding-top: 8px;
        }
        .total-row.grand .total-label,
        .total-row.grand .total-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
        }

        /* QR Code */
        .qr-section {
            text-align: center;
        }
        .qr-section img {
            width: 120px;
            height: 120px;
        }
        .qr-label {
            font-size: 9px;
            color: #999;
            margin-top: 5px;
        }

        /* Footer */
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
        .footer p {
            margin-bottom: 3px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        {{-- Header --}}
        <div class="header">
            <div class="header-left">
                <div class="company-name">{{ $settings['company_name'] ?? 'Malaysian Takaful Association' }}</div>
                <div class="company-details">
                    @if(!empty($settings['company_registration_no']))
                        Reg No: {{ $settings['company_registration_no'] }}<br>
                    @endif
                    @if(!empty($settings['company_address']))
                        {{ $settings['company_address'] }}
                    @endif
                </div>
            </div>
            <div class="header-right">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">
                    {{ $invoice->invoice_number }}<br>
                    Date: {{ $invoice->issued_at->format('d M Y') }}
                </div>
            </div>
        </div>

        {{-- Bill To / Event / Reference --}}
        <div class="info-section">
            <div class="info-block">
                <div class="info-label">Bill To</div>
                <div class="info-value">
                    <strong>{{ $registration->name }}</strong><br>
                    {{ $registration->email }}<br>
                    @if($registration->phone){{ $registration->phone }}<br>@endif
                    @if($invoice->company_name)
                        {{ $invoice->company_name }}<br>
                    @endif
                    @if($invoice->company_registration_no)
                        Reg No: {{ $invoice->company_registration_no }}
                    @endif
                </div>
            </div>
            <div class="info-block">
                <div class="info-label">Reference</div>
                <div class="info-value">
                    <strong>{{ $registration->reference_no }}</strong><br>
                    Status: {{ ucfirst($registration->payment_status) }}<br>
                    @if($registration->payment_reference)
                        Payment Ref: {{ $registration->payment_reference }}
                    @endif
                </div>
            </div>
            <div class="info-block">
                <div class="info-label">Event Details</div>
                <div class="info-value">
                    <strong>{{ $event->title }}</strong><br>
                    @if($event->start_at)
                        {{ \Carbon\Carbon::parse($event->start_at)->format('d M Y, g:i A') }}<br>
                    @endif
                    @if($event->venue)
                        {{ $event->venue }}@if($event->city), {{ $event->city }}@endif
                    @endif
                </div>
            </div>
        </div>

        {{-- Line Items --}}
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th style="width: 15%; text-align: center">Qty</th>
                    <th style="width: 15%; text-align: right">Unit Price</th>
                    <th style="width: 20%; text-align: right">Amount (MYR)</th>
                </tr>
            </thead>
            <tbody>
                {{-- Ticket --}}
                <tr>
                    <td>
                        {{ $ticket->name }}
                        @if($ticket->description)<br><span style="font-size: 10px; color: #666;">{{ $ticket->description }}</span>@endif
                    </td>
                    <td style="text-align: center">{{ $registration->quantity }}</td>
                    <td style="text-align: right">{{ number_format($ticket->price, 2) }}</td>
                    <td style="text-align: right">{{ number_format($registration->subtotal, 2) }}</td>
                </tr>

                {{-- Products --}}
                @foreach($products as $item)
                    <tr>
                        <td>
                            {{ $item->product?->name ?? 'Add-on Product' }}
                            @if($item->variant)<br><span style="font-size: 10px; color: #666;">Variant: {{ $item->variant }}</span>@endif
                        </td>
                        <td style="text-align: center">{{ $item->quantity }}</td>
                        <td style="text-align: right">{{ number_format($item->unit_price, 2) }}</td>
                        <td style="text-align: right">{{ number_format($item->unit_price * $item->quantity, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Totals + QR --}}
        <div class="totals-section">
            <div class="totals-qr">
                @if($qrCode)
                    <div class="qr-section">
                        <img src="data:image/png;base64,{{ $qrCode }}" alt="QR Code">
                        <div class="qr-label">Scan for booking confirmation</div>
                    </div>
                @endif
            </div>
            <div class="totals-table">
                <div class="total-row">
                    <div class="total-label">Subtotal</div>
                    <div class="total-value">MYR {{ number_format($invoice->subtotal, 2) }}</div>
                </div>
                @if($invoice->discount_amount > 0)
                    <div class="total-row">
                        <div class="total-label" style="color: #dc2626;">
                            Discount
                            @if(!empty($registration->meta_json['discount_label']))
                                ({{ $registration->meta_json['discount_label'] }})
                            @endif
                        </div>
                        <div class="total-value" style="color: #dc2626;">- MYR {{ number_format($invoice->discount_amount, 2) }}</div>
                    </div>
                @endif
                @if($registration->products_total > 0)
                    <div class="total-row">
                        <div class="total-label">Products</div>
                        <div class="total-value">MYR {{ number_format($registration->products_total, 2) }}</div>
                    </div>
                @endif
                <div class="total-row grand">
                    <div class="total-label">Total</div>
                    <div class="total-value">MYR {{ number_format($invoice->total_amount, 2) }}</div>
                </div>
            </div>
        </div>

        {{-- Footer --}}
        <div class="footer">
            <p><strong>{{ $settings['company_name'] ?? 'Malaysian Takaful Association' }}</strong></p>
            <p>This is a computer-generated invoice. No signature is required.</p>
            <p>For enquiries, please contact us at {{ $settings['contact_email'] ?? 'info@takaful4all.org' }}</p>
        </div>
    </div>
</body>
</html>
