<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventTicket;
use App\Models\EventProduct;
use App\Models\EventRegistration;
use App\Models\EventRegistrationProduct;
use App\Models\UserPaymentMethod;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        // Enable RSVP on the first upcoming event (Takaful Leadership Summit 2026)
        $summit = Event::where('title', 'like', '%Leadership Summit%')->first();

        if (!$summit) {
            $this->command->warn('No "Leadership Summit" event found. Skipping registration seeder.');
            return;
        }

        // Enable RSVP
        $summit->update([
            'rsvp_enabled'     => true,
            'rsvp_deadline'    => $summit->start_at->subDays(3),
            'max_attendees'    => 500,
            'require_approval' => false,
        ]);

        // Create tickets
        $earlyBird = EventTicket::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Early Bird'],
            [
                'description'   => 'Limited early bird pricing — includes lunch and conference materials',
                'type'          => 'paid',
                'price'         => 150.00,
                'currency'      => 'MYR',
                'quantity'      => 100,
                'max_per_order' => 5,
                'sale_end_at'   => $summit->start_at->subDays(14),
                'is_active'     => true,
                'sort_order'    => 0,
            ]
        );

        $standard = EventTicket::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Standard'],
            [
                'description'   => 'Standard admission — includes lunch and conference materials',
                'type'          => 'paid',
                'price'         => 250.00,
                'currency'      => 'MYR',
                'quantity'      => 300,
                'max_per_order' => 10,
                'is_active'     => true,
                'sort_order'    => 1,
            ]
        );

        $vip = EventTicket::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'VIP'],
            [
                'description'   => 'Front row seating, VIP lounge access, networking dinner, and exclusive swag bag',
                'type'          => 'paid',
                'price'         => 500.00,
                'currency'      => 'MYR',
                'quantity'      => 50,
                'max_per_order' => 3,
                'is_active'     => true,
                'sort_order'    => 2,
            ]
        );

        $freeOnline = EventTicket::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Online Stream (Free)'],
            [
                'description'   => 'Watch the live stream from anywhere — no physical access',
                'type'          => 'free',
                'price'         => 0,
                'currency'      => 'MYR',
                'quantity'      => null,  // unlimited
                'max_per_order' => 1,
                'is_active'     => true,
                'sort_order'    => 3,
            ]
        );

        // Create products
        EventProduct::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Official Event T-Shirt'],
            [
                'description'   => 'Premium cotton t-shirt with event logo',
                'price'         => 45.00,
                'currency'      => 'MYR',
                'variants_json' => [
                    ['label' => 'Size', 'options' => ['S', 'M', 'L', 'XL', 'XXL']],
                ],
                'stock'         => 200,
                'is_active'     => true,
                'sort_order'    => 0,
            ]
        );

        EventProduct::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Conference Tote Bag'],
            [
                'description'   => 'Eco-friendly canvas tote bag with event branding',
                'price'         => 25.00,
                'currency'      => 'MYR',
                'variants_json' => null,
                'stock'         => 150,
                'is_active'     => true,
                'sort_order'    => 1,
            ]
        );

        EventProduct::updateOrCreate(
            ['event_id' => $summit->id, 'name' => 'Takaful Hoodie'],
            [
                'description'   => 'Zip-up hoodie with MTA logo',
                'price'         => 85.00,
                'currency'      => 'MYR',
                'variants_json' => [
                    ['label' => 'Size', 'options' => ['S', 'M', 'L', 'XL']],
                    ['label' => 'Color', 'options' => ['Navy', 'White']],
                ],
                'stock'         => 100,
                'is_active'     => true,
                'sort_order'    => 2,
            ]
        );

        // Create sample registrations
        $sampleAttendees = [
            ['name' => 'Ahmad bin Ibrahim',    'email' => 'ahmad@example.com',    'company' => 'Takaful Malaysia',       'job_title' => 'Senior Manager',   'ticket' => $standard, 'status' => 'confirmed'],
            ['name' => 'Siti Nurhaliza',       'email' => 'siti@example.com',     'company' => 'Etiqa Takaful',          'job_title' => 'VP Operations',    'ticket' => $vip,      'status' => 'confirmed'],
            ['name' => 'Raj Kumar',            'email' => 'raj@example.com',      'company' => 'AIA PUBLIC Takaful',     'job_title' => 'Agent',            'ticket' => $earlyBird,'status' => 'confirmed'],
            ['name' => 'Fatimah binti Hassan', 'email' => 'fatimah@example.com',  'company' => 'Zurich Takaful',         'job_title' => 'Director',         'ticket' => $standard, 'status' => 'pending'],
            ['name' => 'Lee Wei Ming',         'email' => 'weiming@example.com',  'company' => 'FWD Takaful',            'job_title' => 'Consultant',       'ticket' => $freeOnline,'status' => 'confirmed'],
        ];

        foreach ($sampleAttendees as $attendee) {
            EventRegistration::updateOrCreate(
                ['event_id' => $summit->id, 'email' => $attendee['email']],
                [
                    'ticket_id'      => $attendee['ticket']->id,
                    'name'           => $attendee['name'],
                    'phone'          => '+60 12-' . rand(100, 999) . ' ' . rand(1000, 9999),
                    'company'        => $attendee['company'],
                    'job_title'      => $attendee['job_title'],
                    'status'         => $attendee['status'],
                    'quantity'       => 1,
                    'subtotal'       => $attendee['ticket']->price,
                    'products_total' => 0,
                    'total_amount'   => $attendee['ticket']->price,
                    'payment_status' => $attendee['ticket']->price > 0 ? 'paid' : 'na',
                ]
            );
        }

        // Also enable RSVP on the Innovation Conference if it exists
        $innovation = Event::where('title', 'like', '%Innovation Conference%')->first();
        if ($innovation) {
            $innovation->update([
                'rsvp_enabled'     => true,
                'rsvp_deadline'    => $innovation->start_at->subDays(5),
                'max_attendees'    => 300,
                'require_approval' => true,
            ]);

            EventTicket::updateOrCreate(
                ['event_id' => $innovation->id, 'name' => 'General Admission'],
                [
                    'description'   => 'Full-day access to all sessions',
                    'type'          => 'paid',
                    'price'         => 200.00,
                    'currency'      => 'MYR',
                    'quantity'      => 300,
                    'max_per_order' => 5,
                    'is_active'     => true,
                    'sort_order'    => 0,
                ]
            );

            EventTicket::updateOrCreate(
                ['event_id' => $innovation->id, 'name' => 'Student'],
                [
                    'description'   => 'Discounted rate for students with valid student ID',
                    'type'          => 'paid',
                    'price'         => 80.00,
                    'currency'      => 'MYR',
                    'quantity'      => 100,
                    'max_per_order' => 1,
                    'is_active'     => true,
                    'sort_order'    => 1,
                ]
            );
        }

        // ─── Seed registrations for the regular user (user@takaful.com) ───────
        $this->seedUserRegistrations($summit, $innovation);

        $this->command->info('Event registration data seeded successfully.');
    }

    /**
     * Create tickets, orders, and a saved payment method for the demo user.
     */
    private function seedUserRegistrations(?Event $summit, ?Event $innovation): void
    {
        $user = User::where('email', 'user@takaful.com')->first();
        if (!$user) {
            $this->command->warn('Demo user (user@takaful.com) not found — skipping user registrations.');
            return;
        }

        // ── 1. VIP ticket for the Leadership Summit (upcoming, paid) ──────────
        if ($summit) {
            $vipTicket = EventTicket::where('event_id', $summit->id)->where('name', 'VIP')->first();
            $tshirt    = EventProduct::where('event_id', $summit->id)->where('name', 'like', '%T-Shirt%')->first();
            $toteBag   = EventProduct::where('event_id', $summit->id)->where('name', 'like', '%Tote Bag%')->first();

            if ($vipTicket) {
                $qty = 5;
                $productsTotal = ($tshirt ? $tshirt->price : 0) + ($toteBag ? $toteBag->price : 0);

                // Additional attendees (attendees 2–5)
                $additionalAttendees = [
                    [
                        'name'                 => 'Nurul Aisyah binti Kamal',
                        'email'                => 'nurul.aisyah@takaful-ikhlas.com.my',
                        'phone'                => '+60 13-987 6543',
                        'company'              => 'Takaful Ikhlas',
                        'job_title'            => 'Underwriting Manager',
                        'dietary_requirements' => '',
                    ],
                    [
                        'name'                 => 'Muhammad Hafiz bin Osman',
                        'email'                => 'hafiz.osman@takaful-ikhlas.com.my',
                        'phone'                => '+60 11-222 3344',
                        'company'              => 'Takaful Ikhlas',
                        'job_title'            => 'Senior Actuary',
                        'dietary_requirements' => 'Vegetarian',
                    ],
                    [
                        'name'                 => 'Siti Mariam binti Abdullah',
                        'email'                => 'mariam.abdullah@takaful-ikhlas.com.my',
                        'phone'                => '+60 12-555 6677',
                        'company'              => 'Takaful Ikhlas',
                        'job_title'            => 'Head of Marketing',
                        'dietary_requirements' => '',
                    ],
                    [
                        'name'                 => 'Tan Wei Liang',
                        'email'                => 'weiliang.tan@takaful-ikhlas.com.my',
                        'phone'                => '+60 16-888 9900',
                        'company'              => 'Takaful Ikhlas',
                        'job_title'            => 'IT Director',
                        'dietary_requirements' => 'No seafood',
                    ],
                ];

                $reg = EventRegistration::updateOrCreate(
                    ['event_id' => $summit->id, 'email' => $user->email],
                    [
                        'ticket_id'         => $vipTicket->id,
                        'name'              => $user->name,
                        'phone'             => '+60 12-345 6789',
                        'company'           => 'Takaful Ikhlas',
                        'job_title'         => 'Product Manager',
                        'dietary_requirements' => 'No pork, no lard',
                        'status'            => 'confirmed',
                        'quantity'          => $qty,
                        'subtotal'          => $vipTicket->price * $qty,
                        'products_total'    => $productsTotal,
                        'total_amount'      => ($vipTicket->price * $qty) + $productsTotal,
                        'payment_status'    => 'paid',
                        'payment_method'    => 'FPX',
                        'payment_reference' => 'FPX-' . now()->format('Ymd') . '-V' . rand(10000, 99999),
                        'meta_json'         => ['attendees' => $additionalAttendees],
                    ]
                );

                // Attach products
                if ($tshirt) {
                    EventRegistrationProduct::updateOrCreate(
                        ['registration_id' => $reg->id, 'product_id' => $tshirt->id],
                        ['variant' => 'L', 'quantity' => 1, 'unit_price' => $tshirt->price]
                    );
                }
                if ($toteBag) {
                    EventRegistrationProduct::updateOrCreate(
                        ['registration_id' => $reg->id, 'product_id' => $toteBag->id],
                        ['variant' => null, 'quantity' => 1, 'unit_price' => $toteBag->price]
                    );
                }
            }
        }

        // ── 2. General Admission for Innovation Conference (upcoming, pending) ─
        if ($innovation) {
            $gaTicket = EventTicket::where('event_id', $innovation->id)->where('name', 'General Admission')->first();
            if ($gaTicket) {
                EventRegistration::updateOrCreate(
                    ['event_id' => $innovation->id, 'email' => $user->email],
                    [
                        'ticket_id'      => $gaTicket->id,
                        'name'           => $user->name,
                        'phone'          => '+60 12-345 6789',
                        'company'        => 'Takaful Ikhlas',
                        'job_title'      => 'Product Manager',
                        'status'         => 'pending',
                        'quantity'       => 2,
                        'subtotal'       => $gaTicket->price * 2,
                        'products_total' => 0,
                        'total_amount'   => $gaTicket->price * 2,
                        'payment_status' => 'pending',
                        'payment_method' => 'Card',
                        'payment_reference' => null,
                    ]
                );
            }
        }

        // ── 3. Past event — Awareness Week (attended, free) ───────────────────
        $awareness = Event::where('title', 'like', '%Awareness Week%')->first();
        if ($awareness) {
            // Create a free ticket for it if none exists
            $freeTicket = EventTicket::updateOrCreate(
                ['event_id' => $awareness->id, 'name' => 'Free Admission'],
                [
                    'type'          => 'free',
                    'price'         => 0,
                    'currency'      => 'MYR',
                    'quantity'      => null,
                    'max_per_order' => 5,
                    'is_active'     => true,
                    'sort_order'    => 0,
                ]
            );

            EventRegistration::updateOrCreate(
                ['event_id' => $awareness->id, 'email' => $user->email],
                [
                    'ticket_id'      => $freeTicket->id,
                    'name'           => $user->name,
                    'phone'          => '+60 12-345 6789',
                    'company'        => 'Takaful Ikhlas',
                    'status'         => 'attended',
                    'quantity'       => 1,
                    'subtotal'       => 0,
                    'products_total' => 0,
                    'total_amount'   => 0,
                    'payment_status' => 'na',
                    'checked_in_at'  => $awareness->start_at->addHours(1),
                ]
            );
        }

        // ── 4. Past event — Annual Dinner (confirmed, paid) ───────────────────
        $dinner = Event::where('title', 'like', '%Annual Dinner%')->first();
        if ($dinner) {
            $dinnerTicket = EventTicket::updateOrCreate(
                ['event_id' => $dinner->id, 'name' => 'Dinner Seat'],
                [
                    'type'          => 'paid',
                    'price'         => 350.00,
                    'currency'      => 'MYR',
                    'quantity'      => 200,
                    'max_per_order' => 10,
                    'is_active'     => true,
                    'sort_order'    => 0,
                ]
            );

            EventRegistration::updateOrCreate(
                ['event_id' => $dinner->id, 'email' => $user->email],
                [
                    'ticket_id'         => $dinnerTicket->id,
                    'name'              => $user->name,
                    'phone'             => '+60 12-345 6789',
                    'company'           => 'Takaful Ikhlas',
                    'job_title'         => 'Product Manager',
                    'status'            => 'attended',
                    'quantity'          => 1,
                    'subtotal'          => 350.00,
                    'products_total'    => 0,
                    'total_amount'      => 350.00,
                    'payment_status'    => 'paid',
                    'payment_method'    => 'FPX',
                    'payment_reference' => 'FPX-20250811-D' . rand(10000, 99999),
                    'checked_in_at'     => $dinner->start_at->addMinutes(30),
                ]
            );
        }

        // ── 5. Saved payment methods ──────────────────────────────────────────
        UserPaymentMethod::updateOrCreate(
            ['user_id' => $user->id, 'label' => 'Maybank FPX'],
            [
                'type'       => 'fpx',
                'bank_name'  => 'Maybank',
                'is_default' => true,
            ]
        );

        UserPaymentMethod::updateOrCreate(
            ['user_id' => $user->id, 'label' => 'Personal Visa'],
            [
                'type'       => 'card',
                'last4'      => '4242',
                'is_default' => false,
            ]
        );

        $this->command->info("Demo user (user@takaful.com) seeded with 4 registrations + 2 payment methods.");
    }
}
