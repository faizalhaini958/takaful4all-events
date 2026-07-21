<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventCategorySeeder extends Seeder
{
    /**
     * Assign event_category and registration_fields to existing events.
     */
    public function run(): void
    {
        $mappings = [
            'takaful-leadership-summit-2025'              => 'conference',
            'takaful-leadership-summit-2026'              => 'conference',
            'takaful-innovation-conference-2026'          => 'conference',
            'digital-takaful-future-of-protection-in-malaysia' => 'conference',
            'takaful4all-larian-hero-hijau'               => 'sports',
            'takaful4all-inter-to-bowling-tournament'     => 'sports',
            'takaful4all-sustainability-day'              => 'general',
            'takaful-awareness-week-2025'                 => 'exhibition',
            'mta-annual-dinner-awards-2025'               => 'dinner',
            'takaful-agent-certification-workshop-batch-3' => 'workshop',
        ];

        foreach ($mappings as $slug => $category) {
            $event = Event::where('slug', $slug)->first();
            if (! $event) {
                $this->command->warn("Event not found: {$slug}");
                continue;
            }

            // Only set fields if not already configured
            $fields = $event->registration_fields;
            if (empty($fields)) {
                $fields = $this->templateFor($category);
            }

            $event->update([
                'event_category'     => $category,
                'registration_fields' => $fields,
            ]);

            $this->command->info("Updated [{$category}]: {$slug}");
        }
    }

    /**
     * Returns the default registration field template for a given category.
     * Mirrors the TypeScript templates in resources/js/lib/registration-templates.ts.
     */
    private function templateFor(string $category): array
    {
        $base = [
            ['key' => 'name',  'label_en' => 'Full Name',     'label_ms' => 'Nama Penuh',       'type' => 'text',  'required' => true,  'sort_order' => 1, 'locked' => true,  'placeholder_en' => 'Your full name as per IC/passport', 'placeholder_ms' => 'Nama penuh seperti dalam IC/pasport'],
            ['key' => 'email', 'label_en' => 'Email Address', 'label_ms' => 'Alamat E-mel',      'type' => 'text',  'required' => true,  'sort_order' => 2, 'locked' => true,  'placeholder_en' => 'your@email.com', 'placeholder_ms' => 'anda@emel.com'],
            ['key' => 'phone', 'label_en' => 'Phone Number',  'label_ms' => 'Nombor Telefon',   'type' => 'text',  'required' => true,  'sort_order' => 3, 'locked' => true,  'placeholder_en' => 'e.g. 012-3456789', 'placeholder_ms' => 'cth. 012-3456789'],
        ];

        $dietaryOptions = ['None', 'Halal', 'Vegetarian', 'Vegan', 'No Seafood', 'No Pork', 'Other'];
        $dietaryMs      = ['Tiada', 'Halal', 'Vegetarian', 'Vegan', 'Tiada Makanan Laut', 'Tiada Babi', 'Lain-lain'];

        return match ($category) {
            'sports' => array_merge($base, [
                ['key' => 'ic_number',                'label_en' => 'IC / Passport Number',        'label_ms' => 'No. IC / Pasport',            'type' => 'text',     'required' => true,  'sort_order' => 4,  'locked' => false, 'placeholder_en' => 'e.g. 900101-01-1234',           'placeholder_ms' => 'cth. 900101-01-1234'],
                ['key' => 'gender',                   'label_en' => 'Gender',                       'label_ms' => 'Jantina',                     'type' => 'radio',    'required' => true,  'sort_order' => 5,  'locked' => false, 'options_en' => ['Male', 'Female'],                  'options_ms' => ['Lelaki', 'Perempuan']],
                ['key' => 'date_of_birth',            'label_en' => 'Date of Birth',                'label_ms' => 'Tarikh Lahir',                'type' => 'date',     'required' => true,  'sort_order' => 6,  'locked' => false],
                ['key' => 'race_category',            'label_en' => 'Race Category',                'label_ms' => 'Kategori Lumba',              'type' => 'select',   'required' => true,  'sort_order' => 7,  'locked' => false, 'options_en' => [],                                  'options_ms' => [], 'placeholder_en' => 'Select category', 'placeholder_ms' => 'Pilih kategori'],
                ['key' => 'tshirt_size',              'label_en' => 'T-Shirt Size',                 'label_ms' => 'Saiz T-Shirt',                'type' => 'select',   'required' => true,  'sort_order' => 8,  'locked' => false, 'options_en' => ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'options_ms' => ['XS', 'S', 'M', 'L', 'XL', 'XXL']],
                ['key' => 'emergency_contact_name',   'label_en' => 'Emergency Contact Name',       'label_ms' => 'Nama Kenalan Kecemasan',      'type' => 'text',     'required' => true,  'sort_order' => 9,  'locked' => false, 'placeholder_en' => 'Full name',                     'placeholder_ms' => 'Nama penuh'],
                ['key' => 'emergency_contact_phone',  'label_en' => 'Emergency Contact Phone',      'label_ms' => 'Telefon Kenalan Kecemasan',   'type' => 'text',     'required' => true,  'sort_order' => 10, 'locked' => false, 'placeholder_en' => 'e.g. 012-3456789',              'placeholder_ms' => 'cth. 012-3456789'],
                ['key' => 'blood_type',               'label_en' => 'Blood Type',                   'label_ms' => 'Kumpulan Darah',              'type' => 'select',   'required' => false, 'sort_order' => 11, 'locked' => false, 'options_en' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], 'options_ms' => ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu']],
                ['key' => 'running_club',             'label_en' => 'Running Club / Team',          'label_ms' => 'Kelab / Pasukan Larian',      'type' => 'text',     'required' => false, 'sort_order' => 12, 'locked' => false, 'placeholder_en' => 'Club name (if any)',             'placeholder_ms' => 'Nama kelab (jika ada)'],
                ['key' => 'waiver_agreed',            'label_en' => 'I agree to the participation waiver and accept all risks associated with this event.', 'label_ms' => 'Saya bersetuju dengan pelepasan penyertaan dan menerima semua risiko berkaitan acara ini.', 'type' => 'checkbox', 'required' => true, 'sort_order' => 13, 'locked' => false],
            ]),

            'conference' => array_merge($base, [
                ['key' => 'company',           'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi',   'type' => 'text',   'required' => true,  'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                ['key' => 'job_title',         'label_en' => 'Job Title',              'label_ms' => 'Jawatan',                 'type' => 'text',   'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Manager, CEO',             'placeholder_ms' => 'cth. Pengurus, CEO'],
                ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements', 'label_ms' => 'Keperluan Pemakanan',   'type' => 'select', 'required' => false, 'sort_order' => 6, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                ['key' => 'organization_type', 'label_en' => 'Organisation Type',      'label_ms' => 'Jenis Organisasi',        'type' => 'select', 'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => ['Takaful Operator', 'Insurance Company', 'Bank', 'Regulator', 'Consultant', 'Other'], 'options_ms' => ['Pengendali Takaful', 'Syarikat Insurans', 'Bank', 'Pengawal Selia', 'Perunding', 'Lain-lain']],
            ]),

            'workshop' => array_merge($base, [
                ['key' => 'company',              'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi',  'type' => 'text',   'required' => false, 'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                ['key' => 'job_title',            'label_en' => 'Job Title',              'label_ms' => 'Jawatan',                'type' => 'text',   'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Manager, CEO',             'placeholder_ms' => 'cth. Pengurus, CEO'],
                ['key' => 'experience_level',     'label_en' => 'Experience Level',       'label_ms' => 'Tahap Pengalaman',       'type' => 'select', 'required' => true,  'sort_order' => 6, 'locked' => false, 'options_en' => ['Beginner', 'Intermediate', 'Advanced', 'Expert'], 'options_ms' => ['Pemula', 'Pertengahan', 'Lanjutan', 'Pakar']],
                ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements',   'label_ms' => 'Keperluan Pemakanan',    'type' => 'select', 'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                ['key' => 'learning_goals',       'label_en' => 'Learning Goals',         'label_ms' => 'Matlamat Pembelajaran',  'type' => 'textarea', 'required' => false, 'sort_order' => 8, 'locked' => false, 'placeholder_en' => 'What do you hope to gain from this workshop?', 'placeholder_ms' => 'Apa yang anda harap pelajari daripada bengkel ini?'],
            ]),

            'dinner' => array_merge($base, [
                ['key' => 'company',             'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi', 'type' => 'text',     'required' => false, 'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements',  'label_ms' => 'Keperluan Pemakanan',   'type' => 'select',   'required' => false, 'sort_order' => 5, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
                ['key' => 'table_preference',    'label_en' => 'Table Preference',       'label_ms' => 'Pilihan Meja',          'type' => 'select',   'required' => false, 'sort_order' => 6, 'locked' => false, 'options_en' => ['No Preference', 'Near Stage', 'Near Exit', 'With Colleagues'], 'options_ms' => ['Tiada Pilihan', 'Dekat Pentas', 'Dekat Pintu Keluar', 'Bersama Rakan Sekerja']],
                ['key' => 'special_assistance',  'label_en' => 'I require special assistance (wheelchair, etc.)', 'label_ms' => 'Saya memerlukan bantuan khas (kerusi roda, dll.)', 'type' => 'checkbox', 'required' => false, 'sort_order' => 7, 'locked' => false],
                ['key' => 'dress_code_note',     'label_en' => 'Dress Code Notes',       'label_ms' => 'Nota Kod Pakaian',      'type' => 'text',     'required' => false, 'sort_order' => 8, 'locked' => false, 'placeholder_en' => 'Any notes regarding dress code', 'placeholder_ms' => 'Sebarang nota mengenai kod pakaian'],
            ]),

            'entertainment' => array_merge($base, [
                ['key' => 'dietary_requirements', 'label_en' => 'Dietary Requirements', 'label_ms' => 'Keperluan Pemakanan', 'type' => 'select', 'required' => false, 'sort_order' => 4, 'locked' => false, 'options_en' => $dietaryOptions, 'options_ms' => $dietaryMs],
            ]),

            'exhibition' => array_merge($base, [
                ['key' => 'company',        'label_en' => 'Company / Organisation', 'label_ms' => 'Syarikat / Organisasi', 'type' => 'text',     'required' => false, 'sort_order' => 4, 'locked' => false, 'placeholder_en' => 'Your company or organisation', 'placeholder_ms' => 'Syarikat atau organisasi anda'],
                ['key' => 'job_title',      'label_en' => 'Job Title',              'label_ms' => 'Jawatan',               'type' => 'text',     'required' => false, 'sort_order' => 5, 'locked' => false, 'placeholder_en' => 'e.g. Manager, CEO',             'placeholder_ms' => 'cth. Pengurus, CEO'],
                ['key' => 'industry',       'label_en' => 'Industry',               'label_ms' => 'Industri',              'type' => 'text',     'required' => false, 'sort_order' => 6, 'locked' => false, 'placeholder_en' => 'e.g. Financial Services',       'placeholder_ms' => 'cth. Perkhidmatan Kewangan'],
                ['key' => 'booth_interest', 'label_en' => 'Booth Interest',         'label_ms' => 'Minat Gerai',           'type' => 'select',   'required' => false, 'sort_order' => 7, 'locked' => false, 'options_en' => ['Takaful Products', 'Digital Solutions', 'Investment', 'Training & Education', 'General'], 'options_ms' => ['Produk Takaful', 'Penyelesaian Digital', 'Pelaburan', 'Latihan & Pendidikan', 'Umum']],
                ['key' => 'business_card',  'label_en' => 'I will bring a business card for networking.', 'label_ms' => 'Saya akan membawa kad nama untuk rangkaian.', 'type' => 'checkbox', 'required' => false, 'sort_order' => 8, 'locked' => false],
            ]),

            // 'general' — only base fields
            default => $base,
        };
    }
}
