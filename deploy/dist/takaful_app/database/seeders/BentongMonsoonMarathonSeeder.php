<?php

namespace Database\Seeders;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BentongMonsoonMarathonSeeder extends Seeder
{
    public function run(): void
    {
        $tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

        $registrationFields = [
            ['key' => 'name',                    'label_en' => 'Full Name',               'label_ms' => 'Nama Penuh',               'type' => 'text',   'required' => true,  'sort_order' => 1,  'locked' => true,  'placeholder_en' => 'As per IC / passport',       'placeholder_ms' => 'Seperti dalam IC / pasport'],
            ['key' => 'email',                   'label_en' => 'Email Address',            'label_ms' => 'Alamat E-mel',             'type' => 'text',   'required' => true,  'sort_order' => 2,  'locked' => true,  'placeholder_en' => 'your@email.com',              'placeholder_ms' => 'anda@emel.com'],
            ['key' => 'phone',                   'label_en' => 'Contact No.',              'label_ms' => 'No. Telefon',              'type' => 'text',   'required' => true,  'sort_order' => 3,  'locked' => true,  'placeholder_en' => 'e.g. 012-3456789',           'placeholder_ms' => 'cth. 012-3456789'],
            ['key' => 'ic_number',               'label_en' => 'IC Number',                'label_ms' => 'No. IC',                   'type' => 'text',   'required' => true,  'sort_order' => 4,  'locked' => false, 'placeholder_en' => 'e.g. 900101-01-1234',        'placeholder_ms' => 'cth. 900101-01-1234'],
            ['key' => 'passport',                'label_en' => 'Passport',                 'label_ms' => 'Pasport',                  'type' => 'text',   'required' => false, 'sort_order' => 5,  'locked' => false, 'placeholder_en' => 'For non-Malaysian only',     'placeholder_ms' => 'Untuk bukan warganegara sahaja'],
            ['key' => 'date_of_birth',           'label_en' => 'Date of Birth',            'label_ms' => 'Tarikh Lahir',             'type' => 'date',   'required' => true,  'sort_order' => 6,  'locked' => false],
            ['key' => 'gender',                  'label_en' => 'Gender',                   'label_ms' => 'Jantina',                  'type' => 'radio',  'required' => true,  'sort_order' => 7,  'locked' => false, 'options_en' => ['Male', 'Female'],               'options_ms' => ['Lelaki', 'Perempuan']],
            ['key' => 'nationality',             'label_en' => 'Nationality',              'label_ms' => 'Kewarganegaraan',          'type' => 'select', 'required' => true,  'sort_order' => 8,  'locked' => false, 'options_en' => ['Malaysian', 'Non-Malaysian'],   'options_ms' => ['Warganegara Malaysia', 'Bukan Warganegara'], 'placeholder_en' => 'Select nationality', 'placeholder_ms' => 'Pilih kewarganegaraan'],
            ['key' => 'address',                 'label_en' => 'Address',                  'label_ms' => 'Alamat',                   'type' => 'text',   'required' => false, 'sort_order' => 9,  'locked' => false, 'placeholder_en' => 'Street address',             'placeholder_ms' => 'Alamat jalan'],
            ['key' => 'postcode',                'label_en' => 'Postcode',                 'label_ms' => 'Poskod',                   'type' => 'text',   'required' => false, 'sort_order' => 10, 'locked' => false, 'placeholder_en' => 'e.g. 28700',                'placeholder_ms' => 'cth. 28700'],
            ['key' => 'state',                   'label_en' => 'State',                    'label_ms' => 'Negeri',                   'type' => 'select', 'required' => true,  'sort_order' => 11, 'locked' => false, 'options_en' => ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. KL', 'W.P. Labuan', 'W.P. Putrajaya'], 'options_ms' => ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. KL', 'W.P. Labuan', 'W.P. Putrajaya'], 'placeholder_en' => 'Select state', 'placeholder_ms' => 'Pilih negeri'],
            ['key' => 'country',                 'label_en' => 'Country',                  'label_ms' => 'Negara',                   'type' => 'select', 'required' => true,  'sort_order' => 12, 'locked' => false, 'options_en' => ['Malaysia', 'Singapore', 'Indonesia', 'Thailand', 'Brunei', 'Other'], 'options_ms' => ['Malaysia', 'Singapura', 'Indonesia', 'Thailand', 'Brunei', 'Lain-lain'], 'placeholder_en' => 'Select country', 'placeholder_ms' => 'Pilih negara'],
            ['key' => 'event_tee_size',          'label_en' => 'Event Tee Size',           'label_ms' => 'Saiz Baju Event',          'type' => 'select', 'required' => true,  'sort_order' => 13, 'locked' => false, 'options_en' => $tshirtSizes, 'options_ms' => $tshirtSizes, 'placeholder_en' => 'Select size', 'placeholder_ms' => 'Pilih saiz'],
            ['key' => 'finisher_tee_size',       'label_en' => 'Finisher Tee Size',        'label_ms' => 'Saiz Baju Finisher',      'type' => 'select', 'required' => true,  'sort_order' => 14, 'locked' => false, 'options_en' => $tshirtSizes, 'options_ms' => $tshirtSizes, 'placeholder_en' => 'Select size', 'placeholder_ms' => 'Pilih saiz', 'ticket_scope' => ['42km Full Marathon', '21km Half Marathon']],
            ['key' => 'emergency_contact_name',  'label_en' => 'Emergency Contact Name',   'label_ms' => 'Nama Kenalan Kecemasan',  'type' => 'text',   'required' => true,  'sort_order' => 15, 'locked' => false, 'placeholder_en' => 'Full name',                  'placeholder_ms' => 'Nama penuh'],
            ['key' => 'emergency_contact_phone', 'label_en' => 'Emergency Contact Phone',  'label_ms' => 'Tel Kenalan Kecemasan',   'type' => 'text',   'required' => true,  'sort_order' => 16, 'locked' => false, 'placeholder_en' => 'e.g. 012-3456789',           'placeholder_ms' => 'cth. 012-3456789'],
        ];

        $contentHtml = <<<HTML
<h2>Welcome to Bentong Monsoon Marathon 2026!</h2>
<p>Mark your calendar for the <strong>28th of November 2026</strong> — Bentong Monsoon Marathon 2026 is going to be a grand, fun time!</p>
<p>Bentong Monsoon Marathon 2026 registration is now open and the closing date is on the <strong>16th of September 2026</strong> or when all of the slots are filled.</p>
<p>If you missed the previous Bentong Monsoon Marathon, now is your chance to join. Get in now as <strong>limited slots are available!</strong></p>
<h3>About the Race</h3>
<ul>
  <li>📅 <strong>Date:</strong> 28 November 2026 (Saturday)</li>
  <li>⏰ <strong>Flag Off:</strong> 1:30 AM</li>
  <li>📍 <strong>Location:</strong> Padang Sekolah Janda Baik, Bentong, Pahang</li>
  <li>🏃 <strong>Categories:</strong> 42km, 21km, 12km</li>
  <li>👥 <strong>Participant Limit:</strong> 3,000 only</li>
</ul>
<h3>Race Categories</h3>
<table>
  <thead><tr><th>Category</th><th>Distance</th></tr></thead>
  <tbody>
    <tr><td>Full Marathon</td><td>42km</td></tr>
    <tr><td>Half Marathon</td><td>21km</td></tr>
    <tr><td>Trail Run</td><td>12km</td></tr>
  </tbody>
</table>
<h3>About Howei</h3>
<p>Here at Howei, our goal is to create a happier and healthier Malaysia by showcasing and helping you to find the best events near you!</p>
<p>We provide an online registration platform par excellence to event organisers, in addition to helpdesk and marketing services. We automate and simplify the registration process, making every organizers' job much easier.</p>
<p>Through our event portal, we hope to bring sports enthusiasts together to connect through sporting events in Malaysia.</p>
<p>For more information, please visit <a href="https://howei.com" target="_blank">Howei.com</a> or email us at <a href="mailto:helpdesk@howei.com">helpdesk@howei.com</a>.</p>
HTML;

        $metaJson = [
            'sponsors' => [
                [
                    'name'     => 'Majlis Perbandaran Bentong',
                    'role'     => 'Official Organizer',
                    'logo_url' => '',
                ],
            ],
            'custom_tabs' => [
                [
                    'label'        => 'Flag Off',
                    'type'         => 'image',
                    'content_html' => '',
                    'images'       => [],
                ],
                [
                    'label'        => 'Categories & Fees',
                    'type'         => 'image',
                    'content_html' => '',
                    'images'       => [],
                ],
                [
                    'label'        => 'Entitlements',
                    'type'         => 'image',
                    'content_html' => '',
                    'images'       => [],
                ],
                [
                    'label'        => 'T-shirt & Medal',
                    'type'         => 'image',
                    'content_html' => '',
                    'images'       => [],
                ],
                [
                    'label'        => 'Sizing Chart',
                    'type'         => 'image',
                    'content_html' => '',
                    'images'       => [],
                ],
            ],
        ];

        $event = Event::updateOrCreate(
            ['slug' => 'bentong-monsoon-marathon-2026'],
            [
                'title'               => 'Bentong Monsoon Marathon 2026',
                'slug'                => 'bentong-monsoon-marathon-2026',
                'excerpt'             => 'Join the Bentong Monsoon Marathon 2026 on 28 November 2026 at Padang Sekolah Janda Baik, Bentong, Pahang. Categories: 42km, 21km & 12km. Limited to 3,000 participants only!',
                'content_html'        => $contentHtml,
                'start_at'            => Carbon::parse('2026-11-28 01:30:00'),
                'end_at'              => null,
                'venue'               => 'Padang Sekolah Janda Baik',
                'city'                => 'Bentong',
                'state'               => 'Pahang',
                'country'             => 'Malaysia',
                'registration_url'    => 'https://howei.com/event_details/bentongmonsoonmarathon2026',
                'is_published'        => true,
                'rsvp_enabled'        => true,
                'rsvp_deadline'       => Carbon::parse('2026-09-16 23:59:59'),
                'max_attendees'       => 3000,
                'require_approval'    => false,
                'event_category'      => 'sports',
                'registration_fields' => $registrationFields,
                'meta_json'           => $metaJson,
            ]
        );

        // Remove existing tickets before re-seeding
        $event->tickets()->delete();

        $tickets = [
            [
                'name'           => '42km Full Marathon',
                'type'           => 'paid',
                'price'          => 130.00,
                'early_bird_price' => null,
                'quantity'       => 500,
                'max_per_order'  => 1,
                'color'          => '#ef4444',
                'description'    => 'Full marathon 42km. Includes BIB, timing chip, e-certificate, event T-shirt, finisher T-shirt, finisher medal, insurance & medical, refreshment, water station, trophy top 10, cash prize.',
                'is_active'      => true,
                'currency'       => 'MYR',
                'sort_order'     => 1,
            ],
            [
                'name'           => '21km Half Marathon',
                'type'           => 'paid',
                'price'          => 100.00,
                'early_bird_price' => null,
                'quantity'       => 1000,
                'max_per_order'  => 1,
                'color'          => '#f97316',
                'description'    => 'Half marathon 21km. Includes BIB, timing chip, e-certificate, event T-shirt, finisher T-shirt, finisher medal, insurance & medical, refreshment, water station, trophy top 10, cash prize.',
                'is_active'      => true,
                'currency'       => 'MYR',
                'sort_order'     => 2,
            ],
            [
                'name'           => '12km Trail Run',
                'type'           => 'paid',
                'price'          => 75.00,
                'early_bird_price' => null,
                'quantity'       => 1500,
                'max_per_order'  => 1,
                'color'          => '#22c55e',
                'description'    => '12km trail run. Includes BIB, timing chip, e-certificate, event T-shirt, finisher medal, insurance & medical, refreshment, water station, trophy top 10, cash prize.',
                'is_active'      => true,
                'currency'       => 'MYR',
                'sort_order'     => 3,
            ],
        ];

        foreach ($tickets as $ticketData) {
            $event->tickets()->create($ticketData);
        }

        $this->command->info("Seeded [sports]: bentong-monsoon-marathon-2026 with " . count($tickets) . ' ticket(s)');
    }
}
