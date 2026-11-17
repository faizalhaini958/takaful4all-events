<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventProduct;
use App\Models\EventTicket;
use Illuminate\Database\Seeder;

/**
 * One upcoming event with both MYR and USD tickets and add-ons,
 * for testing the multi-currency ticket flow.
 */
class InternationalSummitSeeder extends Seeder
{
    public function run(): void
    {
        $event = Event::updateOrCreate(
            ['slug' => 'international-takaful-summit-2027'],
            [
                'title'            => 'International Takaful Summit 2027',
                'excerpt'          => 'Two days of keynotes, panels and networking for takaful professionals from Malaysia and around the world.',
                'meta_description' => 'Join the International Takaful Summit 2027 in Kuala Lumpur. Tickets available in MYR and USD.',
                'content_html'     => '<h2>International Takaful Summit 2027</h2>'
                    . '<p>Meet industry leaders, regulators and innovators from across the globe in Kuala Lumpur.</p>'
                    . '<ul><li>Keynotes and panel discussions</li><li>Networking lunch</li><li>Exhibition floor</li></ul>',
                'start_at'         => '2027-03-12 09:00:00',
                'end_at'           => '2027-03-13 17:00:00',
                'venue'            => 'Kuala Lumpur Convention Centre',
                'city'             => 'Kuala Lumpur',
                'state'            => 'Wilayah Persekutuan',
                'country'          => 'MY',
                'is_published'     => true,
                'rsvp_enabled'     => true,
                'event_category'   => 'conference',
                'meta_json'        => [
                    'sponsors' => [
                        ['name' => 'Malaysian Takaful Association', 'role' => 'Official Organizer', 'logo_url' => ''],
                    ],
                ],
            ],
        );

        $tickets = [
            [
                'name'              => 'Malaysian Delegate (MYR)',
                'description'       => 'Full access for delegates based in Malaysia. Priced in Malaysian Ringgit.',
                'currency'          => 'MYR',
                'price'             => 450,
                'early_bird_price'  => 350,
                'early_bird_end_at' => '2027-01-31 23:59:59',
                'quantity'          => 200,
                'sort_order'        => 1,
            ],
            [
                'name'              => 'International Delegate (USD)',
                'description'       => 'Full access for delegates travelling from outside Malaysia. Priced in US Dollars.',
                'currency'          => 'USD',
                'price'             => 150,
                'early_bird_price'  => null,
                'early_bird_end_at' => null,
                'quantity'          => 100,
                'sort_order'        => 2,
            ],
        ];

        foreach ($tickets as $data) {
            EventTicket::updateOrCreate(
                ['event_id' => $event->id, 'name' => $data['name']],
                $data + [
                    'event_id'      => $event->id,
                    'type'          => 'paid',
                    'max_per_order' => 5,
                    'min_per_order' => 1,
                    'is_active'     => true,
                ],
            );
        }

        // One add-on per currency, to check that only the matching one is offered
        $products = [
            ['name' => 'Gala Dinner (MYR)', 'currency' => 'MYR', 'price' => 120, 'sort_order' => 1],
            ['name' => 'Gala Dinner (USD)', 'currency' => 'USD', 'price' => 30,  'sort_order' => 2],
        ];

        foreach ($products as $data) {
            EventProduct::updateOrCreate(
                ['event_id' => $event->id, 'name' => $data['name']],
                $data + [
                    'event_id'    => $event->id,
                    'description' => 'Closing gala dinner on 12 March 2027.',
                    'stock'       => null,
                    'is_active'   => true,
                ],
            );
        }
    }
}
