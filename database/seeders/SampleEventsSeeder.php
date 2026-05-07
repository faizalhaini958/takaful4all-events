<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventTicket;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SampleEventsSeeder extends Seeder
{
    public function run(): void
    {
        $dietaryOptions = ['None', 'Halal', 'Vegetarian', 'Vegan', 'No Seafood', 'No Pork', 'Other'];
        $dietaryMs      = ['Tiada', 'Halal', 'Vegetarian', 'Vegan', 'Tiada Makanan Laut', 'Tiada Babi', 'Lain-lain'];

        $base = [
            ['key' => 'name',  'label_en' => 'Full Name',     'label_ms' => 'Nama Penuh',     'type' => 'text', 'required' => true,  'sort_order' => 1, 'locked' => true,  'placeholder_en' => 'As per IC / passport', 'placeholder_ms' => 'Seperti dalam IC / pasport'],
            ['key' => 'email', 'label_en' => 'Email Address', 'label_ms' => 'Alamat E-mel',   'type' => 'text', 'required' => true,  'sort_order' => 2, 'locked' => true,  'placeholder_en' => 'your@email.com',        'placeholder_ms' => 'anda@emel.com'],
            ['key' => 'phone', 'label_en' => 'Phone Number',  'label_ms' => 'Nombor Telefon', 'type' => 'text', 'required' => true,  'sort_order' => 3, 'locked' => true,  'placeholder_en' => 'e.g. 012-3456789',      'placeholder_ms' => 'cth. 012-3456789'],
        ];

        $events = [
            // ── 1. Sports ─────────────────────────────────────────────────────
            [
                'event' => [
                    'title'          => 'Takaful4All Green Run 2026',
                    'slug'           => 'takaful4all-green-run-2026',
                    'excerpt'        => 'A 5KM and 10KM eco-themed fun run through the heart of Putrajaya Lake Gardens, celebrating sustainability and healthy living in the Takaful community.',
                    'content_html'   => Str::markdown("## About the Event\n\nJoin us for the **Takaful4All Green Run 2026** — a fun, eco-friendly run winding through the beautiful Putrajaya Lake Gardens. Suitable for all fitness levels, with categories for 5KM and 10KM.\n\n### What's Included\n- Finisher medal for all participants\n- Official running T-shirt\n- Goody bag with sustainability products\n- Post-run refreshments\n- Lucky draw prizes\n\n### Race Categories\n| Category | Distance | Fee |\n|---|---|---|\n| Fun Run | 5KM | RM 45 |\n| Competitive | 10KM | RM 65 |\n\n### Important Info\n- Gun start: 7:00 AM sharp\n- Collection of race pack: Day before at Putrajaya Marriott (8 AM – 8 PM)\n- Parking: Recommended at Dataran Putra\n\nContact: greenrun@takaful4all.com.my"),
                    'start_at'       => Carbon::parse('2026-07-19 06:30:00'),
                    'end_at'         => Carbon::parse('2026-07-19 10:00:00'),
                    'venue'          => 'Putrajaya Lake Gardens (Start: Dataran Putra)',
                    'city'           => 'Putrajaya',
                    'state'          => 'W.P. Putrajaya',
                    'country'        => 'Malaysia',
                    'is_published'   => true,
                    'rsvp_enabled'   => true,
                    'max_attendees'  => 500,
                    'event_category' => 'sports',
                    'registration_fields' => array_merge($base, [
                        ['key' => 'ic_number',               'label_en' => 'IC / Passport Number',       'label_ms' => 'No. IC / Pasport',          'type' => 'text',     'required' => true,  'sort_order' => 4,  'locked' => false, 'placeholder_en' => 'e.g. 900101-01-1234',           'placeholder_ms' => 'cth. 900101-01-1234'],
                        ['key' => 'gender',                  'label_en' => 'Gender',                      'label_ms' => 'Jantina',                   'type' => 'radio',    'required' => true,  'sort_order' => 5,  'locked' => false, 'options_en' => ['Male', 'Female'],                  'options_ms' => ['Lelaki', 'Perempuan']],
                        ['key' => 'date_of_birth',           'label_en' => 'Date of Birth',               'label_ms' => 'Tarikh Lahir',              'type' => 'date',     'required' => true,  'sort_order' => 6,  'locked' => false],
                        ['key' => 'race_category',           'label_en' => 'Race Category',               'label_ms' => 'Kategori Lumba',            'type' => 'select',   'required' => true,  'sort_order' => 7,  'locked' => false, 'options_en' => ['5KM Fun Run', '10KM Competitive'], 'options_ms' => ['Larian Santai 5KM', 'Kompetitif 10KM'], 'placeholder_en' => 'Select category', 'placeholder_ms' => 'Pilih kategori'],
                        ['key' => 'tshirt_size',             'label_en' => 'T-Shirt Size',                'label_ms' => 'Saiz T-Shirt',              'type' => 'select',   'required' => true,  'sort_order' => 8,  'locked' => false, 'options_en' => ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'options_ms' => ['XS', 'S', 'M', 'L', 'XL', 'XXL']],
                        ['key' => 'emergency_contact_name',  'label_en' => 'Emergency Contact Name',      'label_ms' => 'Nama Kenalan Kecemasan',    'type' => 'text',     'required' => true,  'sort_order' => 9,  'locked' => false, 'placeholder_en' => 'Full name',                     'placeholder_ms' => 'Nama penuh'],
                        ['key' => 'emergency_contact_phone', 'label_en' => 'Emergency Contact Phone',     'label_ms' => 'Telefon Kenalan Kecemasan', 'type' => 'text',     'required' => true,  'sort_order' => 10, 'locked' => false, 'placeholder_en' => 'e.g. 012-3456789',              'placeholder_ms' => 'cth. 012-3456789'],
                        ['key' => 'blood_type',              'label_en' => 'Blood Type',                  'label_ms' => 'Kumpulan Darah',            'type' => 'select',   'required' => false, 'sort_order' => 11, 'locked' => false, 'options_en' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], 'options_ms' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu']],
                        ['key' => 'running_club',            'label_en' => 'Running Club / Team',         'label_ms' => 'Kelab / Pasukan Larian',    'type' => 'text',     'required' => false, 'sort_order' => 12, 'locked' => false, 'placeholder_en' => 'Club name (if any)',             'placeholder_ms' => 'Nama kelab (jika ada)'],
                        ['key' => 'waiver_agreed',           'label_en' => 'I agree to the participation waiver and accept all risks associated with this event.', 'label_ms' => 'Saya bersetuju dengan pelepasan penyertaan dan menerima semua risiko berkaitan acara ini.', 'type' => 'checkbox', 'required' => true, 'sort_order' => 13, 'locked' => false],
                    ]),
                ],
                'tickets' => [
                    ['name' => '5KM Fun Run', 'type' => 'paid', 'price' => 45.00, 'early_bird_price' => 35.00, 'early_bird_end_at' => Carbon::parse('2026-06-30'), 'quantity' => 300, 'max_per_order' => 5, 'color' => '#22c55e', 'description' => 'Includes T-shirt, medal, goody bag & refreshments.'],
                    ['name' => '10KM Competitive', 'type' => 'paid', 'price' => 65.00, 'early_bird_price' => 50.00, 'early_bird_end_at' => Carbon::parse('2026-06-30'), 'quantity' => 200, 'max_per_order' => 5, 'color' => '#3b82f6', 'description' => 'Includes T-shirt, medal, goody bag, timing chip & refreshments.'],
                ],
            ],

            // ── 2. Conference ─────────────────────────────────────────────────
            [
                'event' => [
                    'title'          => 'Takaful Digital Summit 2026',
                    'slug'           => 'takaful-digital-summit-2026',
                    'excerpt'        => 'A premier industry conference exploring digital transformation, AI adoption, and the future of InsurTech in the Malaysian Takaful landscape.',
                    'content_html'   => Str::markdown("## Takaful Digital Summit 2026\n\nThe **Takaful Digital Summit 2026** brings together industry leaders, technology innovators, and regulators to explore how digital transformation is reshaping the Takaful sector.\n\n### Conference Themes\n- AI & Machine Learning in Underwriting\n- Digital Distribution Channels\n- Cyber Risk & Takaful\n- RegTech & BNM Compliance Automation\n- Customer Experience in the Digital Age\n\n### Keynote Speakers\n- CEO, Malaysian Takaful Association\n- CTO, Bank Negara Malaysia (Digital Finance Division)\n- Regional Head, Deloitte InsurTech\n\n### Programme\n| Time | Session |\n|---|---|\n| 08:30 | Registration & Networking Breakfast |\n| 09:00 | Opening Address |\n| 09:30 | Keynote: The AI-Powered Takaful Operator |\n| 11:00 | Panel: Digital Distribution Disruption |\n| 13:00 | Networking Lunch |\n| 14:00 | Breakout Sessions (Track A & B) |\n| 16:00 | Closing Keynote & Awards |\n\nCPD points applicable. Certificate of attendance provided."),
                    'start_at'       => Carbon::parse('2026-08-20 08:30:00'),
                    'end_at'         => Carbon::parse('2026-08-20 17:30:00'),
                    'venue'          => 'Grand Ballroom, Hilton Kuala Lumpur',
                    'city'           => 'Kuala Lumpur',
                    'state'          => 'W.P. KL',
                    'country'        => 'Malaysia',
                    'is_published'   => true,
                    'rsvp_enabled'   => true,
                    'max_attendees'  => 300,
                    'event_category' => 'conference',
                    'registration_fields' => array_merge($base, [
                        ['key' => 'company',           'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi',  'type' => 'text',   'required' => true,  'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                        ['key' => 'job_title',         'label_en' => 'Job Title',              'label_ms' => 'Jawatan',                'type' => 'text',   'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Head of IT, CEO',          'placeholder_ms' => 'cth. Ketua IT, CEO'],
                        ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements', 'label_ms' => 'Keperluan Pemakanan', 'type' => 'select', 'required' => false, 'sort_order' => 6, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                        ['key' => 'organization_type', 'label_en' => 'Organisation Type',      'label_ms' => 'Jenis Organisasi',       'type' => 'select', 'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => ['Takaful Operator', 'Insurance Company', 'Bank', 'Regulator', 'Technology Provider', 'Consultant', 'Other'], 'options_ms' => ['Pengendali Takaful', 'Syarikat Insurans', 'Bank', 'Pengawal Selia', 'Penyedia Teknologi', 'Perunding', 'Lain-lain']],
                    ]),
                ],
                'tickets' => [
                    ['name' => 'Early Bird — Full Day', 'type' => 'paid', 'price' => 350.00, 'early_bird_price' => 250.00, 'early_bird_end_at' => Carbon::parse('2026-07-31'), 'quantity' => 100, 'max_per_order' => 3, 'color' => '#6366f1', 'description' => 'Full day access including lunch and networking sessions. Early bird ends 31 July.'],
                    ['name' => 'Standard — Full Day',   'type' => 'paid', 'price' => 350.00, 'quantity' => 200, 'max_per_order' => 5, 'color' => '#8b5cf6', 'description' => 'Full day access including lunch and networking sessions.'],
                    ['name' => 'Complimentary (MTA Members)', 'type' => 'free', 'price' => 0, 'quantity' => 50, 'max_per_order' => 2, 'color' => '#10b981', 'description' => 'Complimentary pass for registered MTA member company staff.'],
                ],
            ],

            // ── 3. Workshop ───────────────────────────────────────────────────
            [
                'event' => [
                    'title'          => 'Takaful Agent Excellence Workshop 2026',
                    'slug'           => 'takaful-agent-excellence-workshop-2026',
                    'excerpt'        => 'A hands-on two-day certification workshop for Takaful agents focusing on needs-based selling, Shariah compliance, digital tools, and building long-term client relationships.',
                    'content_html'   => Str::markdown("## Takaful Agent Excellence Workshop 2026\n\nThis intensive **two-day workshop** is designed for practising Takaful agents who want to sharpen their skills, deepen their Shariah knowledge, and adopt digital-first sales strategies.\n\n### Who Should Attend\n- Practising Takaful agents (all experience levels)\n- Agency leaders and managers\n- New recruits seeking foundation skills\n\n### Workshop Modules\n\n**Day 1 — Foundations & Shariah**\n- Understanding the Takaful contract (Aqad)\n- Needs-based financial planning methodology\n- Shariah-compliant product comparison\n- Hands-on: Client profiling exercise\n\n**Day 2 — Digital & Growth**\n- Social media strategy for agents\n- CRM tools and pipeline management\n- Objection handling masterclass\n- Role-play: End-to-end client conversation\n\n### Certification\nParticipants who complete both days and pass the assessment will receive the **Takaful Agent Excellence Certificate** (MTA-endorsed).\n\n*Light refreshments and lunch provided on both days. Maximum 30 participants per batch.*"),
                    'start_at'       => Carbon::parse('2026-09-10 09:00:00'),
                    'end_at'         => Carbon::parse('2026-09-11 17:00:00'),
                    'venue'          => 'MTA Training Room, Level 5, Menara Takaful Malaysia',
                    'city'           => 'Kuala Lumpur',
                    'state'          => 'W.P. KL',
                    'country'        => 'Malaysia',
                    'is_published'   => true,
                    'rsvp_enabled'   => true,
                    'max_attendees'  => 30,
                    'require_approval' => true,
                    'event_category' => 'workshop',
                    'registration_fields' => array_merge($base, [
                        ['key' => 'company',              'label_en' => 'Agency / Company',       'label_ms' => 'Agensi / Syarikat',     'type' => 'text',     'required' => true,  'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your agency or company name', 'placeholder_ms' => 'Nama agensi atau syarikat anda'],
                        ['key' => 'job_title',            'label_en' => 'Role',                   'label_ms' => 'Peranan',               'type' => 'text',     'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Agent, Agency Leader',   'placeholder_ms' => 'cth. Ejen, Ketua Agensi'],
                        ['key' => 'experience_level',     'label_en' => 'Experience Level',       'label_ms' => 'Tahap Pengalaman',      'type' => 'select',   'required' => true,  'sort_order' => 6, 'locked' => false, 'options_en' => ['Less than 1 year', '1–3 years', '3–5 years', 'More than 5 years'], 'options_ms' => ['Kurang 1 tahun', '1–3 tahun', '3–5 tahun', 'Lebih 5 tahun']],
                        ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements',   'label_ms' => 'Keperluan Pemakanan',   'type' => 'select',   'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                        ['key' => 'learning_goals',       'label_en' => 'Learning Goals',         'label_ms' => 'Matlamat Pembelajaran', 'type' => 'textarea', 'required' => false, 'sort_order' => 8, 'locked' => false, 'placeholder_en' => 'What do you hope to gain from this workshop?', 'placeholder_ms' => 'Apa yang anda harap pelajari daripada bengkel ini?'],
                    ]),
                ],
                'tickets' => [
                    ['name' => 'Two-Day Workshop (Early Bird)', 'type' => 'paid', 'price' => 450.00, 'early_bird_price' => 350.00, 'early_bird_end_at' => Carbon::parse('2026-08-15'), 'quantity' => 30, 'max_per_order' => 1, 'color' => '#f59e0b', 'description' => 'Both days — includes lunch, refreshments and MTA certificate. Early bird: RM350 until 15 Aug.'],
                ],
            ],

            // ── 4. Dinner ─────────────────────────────────────────────────────
            [
                'event' => [
                    'title'          => 'MTA Annual Gala Dinner & Awards 2026',
                    'slug'           => 'mta-annual-gala-dinner-awards-2026',
                    'excerpt'        => 'The Malaysian Takaful Association\'s flagship annual gala dinner celebrating industry excellence, honouring top performers, and raising funds for the Takaful Community Welfare Fund.',
                    'content_html'   => Str::markdown("## MTA Annual Gala Dinner & Awards 2026\n\nJoin us for the **Malaysian Takaful Association Annual Gala Dinner & Awards Night 2026** — an evening of celebration, recognition, and fellowship for the Takaful fraternity.\n\n### Event Highlights\n- **Industry Awards Presentation** — recognising outstanding operators, agents, and individuals\n- **Special Recognition**: Lifetime Achievement Award\n- **Charity Auction** — proceeds to MTA Community Welfare Fund\n- **Live Entertainment** — performing arts by local talent\n- **Gala Networking Dinner** — four-course Halal menu\n\n### Dress Code\n**Formal / Smart Formal** — Baju Melayu / Kebaya / Lounge Suit / Cocktail Dress\n\n### Seating\nTables seat 10 guests. Contact the MTA Secretariat to reserve a full table.\n\n### Programme\n| Time | Programme |\n|---|---|\n| 18:30 | Registration & Welcome Drinks |\n| 19:30 | Arrival of Guest of Honour |\n| 20:00 | Dinner & Awards Presentation |\n| 22:30 | Lucky Draw & Closing |\n\nBlack-tie optional. RSVP deadline: 30 September 2026."),
                    'start_at'       => Carbon::parse('2026-10-17 18:30:00'),
                    'end_at'         => Carbon::parse('2026-10-17 23:00:00'),
                    'venue'          => 'Grand Ballroom, The Majestic Hotel Kuala Lumpur',
                    'city'           => 'Kuala Lumpur',
                    'state'          => 'W.P. KL',
                    'country'        => 'Malaysia',
                    'is_published'   => true,
                    'rsvp_enabled'   => true,
                    'max_attendees'  => 400,
                    'event_category' => 'dinner',
                    'registration_fields' => array_merge($base, [
                        ['key' => 'company',             'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi', 'type' => 'text',     'required' => false, 'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                        ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements',  'label_ms' => 'Keperluan Pemakanan',   'type' => 'select',   'required' => true,  'sort_order' => 5, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                        ['key' => 'table_preference',    'label_en' => 'Table Preference',       'label_ms' => 'Pilihan Meja',          'type' => 'select',   'required' => false, 'sort_order' => 6, 'locked' => false, 'options_en' => ['No Preference', 'Near Stage', 'Near Exit', 'With Colleagues'], 'options_ms' => ['Tiada Pilihan', 'Dekat Pentas', 'Dekat Pintu Keluar', 'Bersama Rakan Sekerja']],
                        ['key' => 'special_assistance',  'label_en' => 'I require special assistance (wheelchair, hearing loop, etc.)', 'label_ms' => 'Saya memerlukan bantuan khas (kerusi roda, gelung pendengaran, dll.)', 'type' => 'checkbox', 'required' => false, 'sort_order' => 7, 'locked' => false],
                        ['key' => 'dress_code_note',     'label_en' => 'Dress Code Notes',       'label_ms' => 'Nota Kod Pakaian',      'type' => 'text',     'required' => false, 'sort_order' => 8, 'locked' => false, 'placeholder_en' => 'Any special requirements regarding dress code', 'placeholder_ms' => 'Sebarang keperluan khas mengenai kod pakaian'],
                    ]),
                ],
                'tickets' => [
                    ['name' => 'Individual Seat (Early Bird)', 'type' => 'paid', 'price' => 350.00, 'early_bird_price' => 280.00, 'early_bird_end_at' => Carbon::parse('2026-09-15'), 'quantity' => 200, 'max_per_order' => 10, 'color' => '#d97706', 'description' => 'Single seat at the gala dinner. Early bird price RM280 until 15 Sep.'],
                    ['name' => 'Table of 10',                  'type' => 'paid', 'price' => 3000.00, 'quantity' => 20,  'max_per_order' => 1,  'color' => '#b45309', 'description' => 'Reserved table for 10 guests. Includes priority seating near stage.'],
                ],
            ],

            // ── 5. Exhibition ─────────────────────────────────────────────────
            [
                'event' => [
                    'title'          => 'Takaful Industry Expo 2026',
                    'slug'           => 'takaful-industry-expo-2026',
                    'excerpt'        => 'Malaysia\'s largest Takaful and Islamic finance exhibition — bringing together operators, fintechs, and industry partners under one roof for two full days of demos, talks, and networking.',
                    'content_html'   => Str::markdown("## Takaful Industry Expo 2026\n\nThe **Takaful Industry Expo 2026** is Malaysia's most anticipated Islamic finance and Takaful exhibition, hosted by the Malaysian Takaful Association.\n\n### What to Expect\n- **60+ exhibitor booths** — Takaful operators, InsurTech startups, investment platforms, and service providers\n- **3 seminar stages** running concurrent sessions throughout both days\n- **Product Showcase Zone** — live demos of the latest Takaful apps and digital tools\n- **Career Fair** — Takaful operator job placements and graduate recruitment\n- **Youth Takaful Zone** — interactive financial literacy activities for students\n\n### Seminar Topics\n- Islamic Wealth Management & Takaful Integration\n- Waqf, Zakat, and Takaful — a holistic protection approach\n- Cybersecurity for Takaful operators\n- ESG Reporting under BNM guidelines\n\n### Entry\nEntry is **free** for all visitors. Seminar seats are limited — pre-register to secure your spot.\n\n### Opening Hours\n- Day 1 (Tue 10 Nov): 9:00 AM – 7:00 PM\n- Day 2 (Wed 11 Nov): 9:00 AM – 6:00 PM"),
                    'start_at'       => Carbon::parse('2026-11-10 09:00:00'),
                    'end_at'         => Carbon::parse('2026-11-11 18:00:00'),
                    'venue'          => 'Hall 1 & 2, Kuala Lumpur Convention Centre (KLCC)',
                    'city'           => 'Kuala Lumpur',
                    'state'          => 'W.P. KL',
                    'country'        => 'Malaysia',
                    'is_published'   => true,
                    'rsvp_enabled'   => true,
                    'max_attendees'  => 2000,
                    'event_category' => 'exhibition',
                    'registration_fields' => array_merge($base, [
                        ['key' => 'company',        'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi', 'type' => 'text',   'required' => false, 'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                        ['key' => 'job_title',      'label_en' => 'Job Title',              'label_ms' => 'Jawatan',               'type' => 'text',   'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Manager, Student',         'placeholder_ms' => 'cth. Pengurus, Pelajar'],
                        ['key' => 'industry',       'label_en' => 'Industry',               'label_ms' => 'Industri',              'type' => 'text',   'required' => false, 'sort_order' => 6, 'locked' => false, 'placeholder_en' => 'e.g. Financial Services, Education', 'placeholder_ms' => 'cth. Perkhidmatan Kewangan, Pendidikan'],
                        ['key' => 'booth_interest', 'label_en' => 'Booth Interest',         'label_ms' => 'Minat Gerai',           'type' => 'select', 'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => ['Takaful Products', 'Digital & InsurTech', 'Investment & Wealth', 'Career Opportunities', 'General Visit'], 'options_ms' => ['Produk Takaful', 'Digital & InsurTech', 'Pelaburan & Kekayaan', 'Peluang Kerjaya', 'Lawatan Umum']],
                        ['key' => 'business_card',  'label_en' => 'I will bring a business card for networking.', 'label_ms' => 'Saya akan membawa kad nama untuk rangkaian.', 'type' => 'checkbox', 'required' => false, 'sort_order' => 8, 'locked' => false],
                    ]),
                ],
                'tickets' => [
                    ['name' => 'General Visitor (Free)',        'type' => 'free', 'price' => 0, 'quantity' => 1500, 'max_per_order' => 5, 'color' => '#0ea5e9', 'description' => 'Free entry to all exhibition halls for both days.'],
                    ['name' => 'Seminar Pass — All Sessions',   'type' => 'paid', 'price' => 150.00, 'early_bird_price' => 100.00, 'early_bird_end_at' => Carbon::parse('2026-10-20'), 'quantity' => 300, 'max_per_order' => 3, 'color' => '#7c3aed', 'description' => 'Access to all seminar sessions across both days. Early bird RM100 until 20 Oct.'],
                ],
            ],
        ];

        foreach ($events as $item) {
            $event = Event::updateOrCreate(
                ['slug' => $item['event']['slug']],
                $item['event']
            );

            // Remove existing tickets before re-seeding
            $event->tickets()->delete();

            foreach ($item['tickets'] as $i => $ticketData) {
                $event->tickets()->create(array_merge([
                    'currency'      => 'MYR',
                    'is_active'     => true,
                    'sort_order'    => $i + 1,
                    'max_per_order' => $ticketData['max_per_order'] ?? 5,
                ], $ticketData));
            }

            $this->command->info("Seeded [{$item['event']['event_category']}]: {$event->slug} with " . count($item['tickets']) . ' ticket(s)');
        }
    }
}
