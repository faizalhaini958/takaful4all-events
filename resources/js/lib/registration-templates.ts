import { type RegistrationField, type EventCategory } from '@/types';

// Helper — marks a field as locked (name/email/phone — cannot be removed by admin)
const locked = (field: Omit<RegistrationField, 'locked'>): RegistrationField => ({
    ...field,
    locked: true,
});

// ── Shared base fields (all events) ─────────────────────────────────────────
const BASE: RegistrationField[] = [
    locked({ key: 'name',  label_en: 'Full Name',     label_ms: 'Nama Penuh',    type: 'text', required: true, sort_order: 1 }),
    locked({ key: 'email', label_en: 'Email Address', label_ms: 'Alamat E-mel',  type: 'text', required: true, sort_order: 2 }),
    locked({ key: 'phone', label_en: 'Phone Number',  label_ms: 'Nombor Telefon',type: 'text', required: true, sort_order: 3 }),
];

// ── Shared dietary options ───────────────────────────────────────────────────
const DIETARY: Pick<RegistrationField, 'options_en' | 'options_ms'> = {
    options_en: ['None', 'Halal', 'Vegetarian', 'Vegan', 'No Seafood', 'No Pork', 'Other'],
    options_ms: ['Tiada', 'Halal', 'Vegetarian', 'Vegan', 'Tanpa Makanan Laut', 'Tanpa Babi', 'Lain-lain'],
};

// ── Category templates ───────────────────────────────────────────────────────

const SPORTS: RegistrationField[] = [
    ...BASE,
    { key: 'ic_number',               label_en: 'IC Number',                          label_ms: 'Nombor IC',                                        type: 'text',     required: true,  sort_order: 4 },
    { key: 'gender',                  label_en: 'Gender',                             label_ms: 'Jantina',                                          type: 'radio',    required: true,  options_en: ['Male', 'Female'],             options_ms: ['Lelaki', 'Perempuan'],             sort_order: 5 },
    { key: 'date_of_birth',           label_en: 'Date of Birth',                      label_ms: 'Tarikh Lahir',                                     type: 'date',     required: true,  sort_order: 6 },
    { key: 'race_category',           label_en: 'Race Category',                      label_ms: 'Kategori Lumba',                                   type: 'select',   required: true,  options_en: [],                             options_ms: [],                                 sort_order: 7 },
    { key: 'tshirt_size',             label_en: 'T-shirt Size',                       label_ms: 'Saiz Baju T',                                      type: 'select',   required: true,  options_en: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], options_ms: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], sort_order: 8 },
    { key: 'emergency_contact_name',  label_en: 'Emergency Contact Name',             label_ms: 'Nama Kenalan Kecemasan',                           type: 'text',     required: true,  sort_order: 9 },
    { key: 'emergency_contact_phone', label_en: 'Emergency Contact Phone',            label_ms: 'Telefon Kenalan Kecemasan',                        type: 'text',     required: true,  sort_order: 10 },
    { key: 'blood_type',              label_en: 'Blood Type',                         label_ms: 'Kumpulan Darah',                                   type: 'select',   required: false, options_en: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], options_ms: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], sort_order: 11 },
    { key: 'running_club',            label_en: 'Running Club / Team',                label_ms: 'Kelab / Pasukan Larian',                           type: 'text',     required: false, sort_order: 12 },
    { key: 'waiver_agreed',           label_en: 'I agree to the waiver and event terms', label_ms: 'Saya bersetuju dengan waiver dan terma acara', type: 'checkbox', required: true,  sort_order: 13 },
];

const CONFERENCE: RegistrationField[] = [
    ...BASE,
    { key: 'company',              label_en: 'Company / Organisation', label_ms: 'Syarikat / Organisasi', type: 'text',   required: true,  sort_order: 4 },
    { key: 'job_title',            label_en: 'Job Title',              label_ms: 'Jawatan',               type: 'text',   required: false, sort_order: 5 },
    { key: 'dietary_requirements', label_en: 'Dietary Requirements',   label_ms: 'Keperluan Diet',        type: 'select', required: false, ...DIETARY,   sort_order: 6 },
    { key: 'arrival_time_slot',    label_en: 'Arrival Time Slot',      label_ms: 'Waktu Ketibaan',        type: 'select', required: false, options_en: [], options_ms: [], sort_order: 7 },
];

const WORKSHOP: RegistrationField[] = [
    ...BASE,
    { key: 'company',              label_en: 'Company / Organisation', label_ms: 'Syarikat / Organisasi', type: 'text',     required: false, sort_order: 4 },
    { key: 'job_title',            label_en: 'Job Title',              label_ms: 'Jawatan',               type: 'text',     required: false, sort_order: 5 },
    { key: 'experience_level',     label_en: 'Experience Level',       label_ms: 'Tahap Pengalaman',      type: 'select',   required: false, options_en: ['Beginner', 'Intermediate', 'Advanced'], options_ms: ['Pemula', 'Pertengahan', 'Lanjutan'], sort_order: 6 },
    { key: 'special_requirements', label_en: 'Special Requirements',   label_ms: 'Keperluan Khas',        type: 'textarea', required: false, sort_order: 7 },
];

const DINNER: RegistrationField[] = [
    ...BASE,
    { key: 'company',              label_en: 'Company / Organisation',   label_ms: 'Syarikat / Organisasi',    type: 'text',     required: true,  sort_order: 4 },
    { key: 'job_title',            label_en: 'Job Title',                label_ms: 'Jawatan',                  type: 'text',     required: false, sort_order: 5 },
    { key: 'dietary_requirements', label_en: 'Dietary Requirements',     label_ms: 'Keperluan Diet',           type: 'select',   required: true,  ...DIETARY,   sort_order: 6 },
    { key: 'seating_preference',   label_en: 'Seating / Table Preference', label_ms: 'Pilihan Tempat Duduk / Meja', type: 'text', required: false, sort_order: 7 },
    { key: 'special_requirements', label_en: 'Special Requirements',     label_ms: 'Keperluan Khas',           type: 'textarea', required: false, sort_order: 8 },
];

const EXHIBITION: RegistrationField[] = [
    ...BASE,
    { key: 'company',   label_en: 'Company / Organisation', label_ms: 'Syarikat / Organisasi', type: 'text',   required: true,  sort_order: 4 },
    { key: 'job_title', label_en: 'Job Title',              label_ms: 'Jawatan',               type: 'text',   required: false, sort_order: 5 },
    { key: 'industry',  label_en: 'Industry',               label_ms: 'Industri',              type: 'select', required: false,
        options_en: ['Technology', 'Finance & Banking', 'Insurance & Takaful', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Government', 'Other'],
        options_ms: ['Teknologi', 'Kewangan & Perbankan', 'Insurans & Takaful', 'Penjagaan Kesihatan', 'Pendidikan', 'Pembuatan', 'Runcit', 'Kerajaan', 'Lain-lain'],
        sort_order: 6,
    },
];

// ── Exports ──────────────────────────────────────────────────────────────────

export const CATEGORY_TEMPLATES: Record<EventCategory, RegistrationField[]> = {
    sports:        SPORTS,
    conference:    CONFERENCE,
    workshop:      WORKSHOP,
    dinner:        DINNER,
    entertainment: [...BASE],
    exhibition:    EXHIBITION,
    general:       [...BASE],
};

export const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
    { value: 'sports',        label: '🏃 Sports & Fitness' },
    { value: 'conference',    label: '🎤 Conference & Seminar' },
    { value: 'workshop',      label: '🛠️ Workshop & Training' },
    { value: 'dinner',        label: '🍽️ Dinner, Awards & Gala' },
    { value: 'entertainment', label: '🎶 Entertainment & Concert' },
    { value: 'exhibition',    label: '🏪 Exhibition & Trade Show' },
    { value: 'general',       label: '📋 General' },
];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
    sports:        'Sports & Fitness',
    conference:    'Conference & Seminar',
    workshop:      'Workshop & Training',
    dinner:        'Dinner, Awards & Gala',
    entertainment: 'Entertainment & Concert',
    exhibition:    'Exhibition & Trade Show',
    general:       'General',
};
