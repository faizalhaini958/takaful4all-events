<?php

namespace Database\Seeders;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            [
                'title'            => 'Shariah Empowerment',
                'slug'             => 'shariah-empowerment',
                'excerpt'          => 'MTA is collaborating with ASAS and EY in holding a Shariah empowerment seminar focusing on ESG — covering environmental impact, social responsibility, and corporate governance in the Takaful industry.',
                'content_html'     => $this->toHtml("MTA is collaborating with ASAS and EY in holding a Shariah empowerment seminar focusing on ESG. ESG, or Environmental, Social, and Governance, represents a set of criteria used by investors and stakeholders to assess a company's performance in areas such as environmental impact, social responsibility, and corporate governance. As a participant in the Takaful industry, understanding the specific impact of Environmental, Social, and Governance factors is crucial for ensuring the sustainability and ethical foundation of our operations. This session will explore how integrating ESG practices aligns with the principles of Shariah.\n\nUpon attending this awareness session, the outcome should be that the Shariah fraternity understand what is ESG and how it relates to Shariah. The target audience of this session are the staff from Shariah Department, Shariah Audit, Shariah Risk Management, Shariah Compliance, Shariah Governance as well as the Shariah Committee members of takaful operators.\n\nContact MTA Secretariat at asyiqin@malaysiantakaful.com.my for more details."),
                'start_at'         => Carbon::parse('2024-02-27 09:00:00'),
                'end_at'           => Carbon::parse('2024-02-27 12:30:00'),
                'venue'            => 'Lot 10.2, Level 10, Menara Great Eastern',
                'city'             => 'Kuala Lumpur',
                'state'            => 'W.P. KL',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => false,
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful Star Awards 2024',
                'slug'             => 'takaful-star-awards-2024',
                'excerpt'          => 'An annual event to celebrate and recognize successful Takaful leaders, managers and agents who have achieved outstanding performance throughout 2023.',
                'content_html'     => $this->toHtml("The organization of Takaful Star Awards 2024 is to recognize the Takaful leaders, managers, and agents who have been the backbone in raising awareness among our society about the importance of Takaful as their financial and life protection for individuals, families, and communities. Takaful Star Awards 2024, is an annual event designed to celebrate and recognize successful Takaful leaders, managers and agents who have achieved outstanding performance throughout 2023.\n\nJoin us for an evening of inspiration and camaraderie as we honor outstanding achievements and contributions that have propelled the Takaful sector forward. This prestigious event promises to be a gathering of Takaful industry leaders, offering invaluable networking opportunities and insights into the latest trends and developments shaping our industry.\n\nYour presence at the Takaful Star Awards 2024 event will not only contribute to the success of the evening but also serve as a testament to your commitment to excellence and advancement within the Takaful industry.\n\nWe look forward to welcoming you and celebrating together at the Takaful Star Awards 2024 event."),
                'start_at'         => Carbon::parse('2024-05-11 20:00:00'),
                'end_at'           => Carbon::parse('2024-05-11 23:00:00'),
                'venue'            => 'Grand Ballroom, Genting International Convention Center',
                'city'             => 'Genting Highlands',
                'state'            => 'Pahang',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
            [
                'title'            => 'Masterclass CRMSA Reporting 2.0 Climate Risks Stress Testing: Navigating Regulations and Disclosure in 2024 and Beyond | General Takaful / Life Insurance',
                'slug'             => 'masterclass-crmsa-reporting-2-0-climate-risks-stress-testing',
                'excerpt'          => 'A two-day masterclass on CRMSA Reporting 2.0 focusing on climate risk stress testing, navigating regulations and disclosure in 2024 and beyond — covering both General Takaful and Family Takaful / Life Insurance.',
                'content_html'     => $this->toHtml("We are excited to extend our heartfelt invitation to the upcoming Masterclass on CRMSA Reporting 2.0 – Climate Risks Stress Testing: Navigating Regulations and Disclosure in 2024 and Beyond. This event aims to deepen our collective understanding and proactive management of climate risks within the takaful and insurance industry.\n\nThe masterclass will span two days, with each day focusing on specific aspects of climate risk management and stress testing within the takaful and insurance sectors. Day 1 will concentrate on topics relevant to general takaful/general insurance, while Day 2 will cater to the nuances of family takaful/life insurance.\n\nJoin us for two days of immersive learning, networking, and collaborative discussions as we navigate the complex landscape of climate risk management in the takaful and insurance industry.\n\nNote: Limited to 40 seats only."),
                'start_at'         => Carbon::parse('2024-04-29 09:00:00'),
                'end_at'           => Carbon::parse('2024-04-30 16:00:00'),
                'venue'            => 'Khazanah Auditorium, Asia School of Business (AICB Building, No. 10, Jalan Dato\' Onn, 50480)',
                'city'             => 'Kuala Lumpur',
                'state'            => 'W.P. KL',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful4All Inter-TO Bowling Tournament 2024',
                'slug'             => 'takaful4all-inter-to-bowling-tournament-2024',
                'excerpt'          => 'An inter-Takaful operator bowling tournament organised by Takaful4All to strengthen healthy lifestyle culture, foster networking, and encourage friendly competition among MTA member companies.',
                'content_html'     => $this->toHtml("The objectives of the Bowling Tournament are:\n\n- Strengthening the Healthy Lifestyle culture by organising events that encourage social interaction, enjoyment, and a sense of belonging among MTA member employees.\n- Creating opportunities for MTA member employees from different departments or levels of the organisation to connect and network in a casual and informal setting, potentially fostering cross-departmental collaboration and communication.\n- Encouraging friendly competition among MTA member companies, which can promote a sense of achievement and satisfaction as well as help develop a competitive spirit in a positive context.\n\nThis tournament is one of MTA's initiatives to create a \"Healthy Lifestyle\" culture among its member companies through sportsmanship. In addition, through the organization of this sports tournament, it is also hoped to create sportsmanship among the takaful industry in addition to unearthing hidden talents.\n\nRegistration Fees:\n- Early Bird: RM450 per team (register before 15 May 2024)\n- Normal: RM550 per team (register 15 May – 31 May 2024)"),
                'start_at'         => Carbon::parse('2024-06-01 14:00:00'),
                'end_at'           => Carbon::parse('2024-06-01 18:00:00'),
                'venue'            => 'Sunway Mega Lanes, Sunway Pyramid (Lot F1.22, First Floor, 3, Jalan PJS 11/15)',
                'city'             => 'Subang Jaya',
                'state'            => 'Selangor',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
            [
                'title'            => 'TakafulUntukSemua Fun Run 2024',
                'slug'             => 'takafuluntuksemua-fun-run-2024',
                'excerpt'          => 'A 5KM fun run under the hashtag #KuantanAktifTenang, organised as part of the TakafulUntukSemua initiative. Open to all participants in Kuantan, Pahang.',
                'content_html'     => $this->toHtml("Join us for the TakafulUntukSemua Fun Run 2024! A 5KM fun run happening on Saturday, 6 July 2024, starting at 6:30 AM at East Coast Mall, Kuantan, Pahang.\n\nRegistration is open until 4 July 2024.\n\n#KuantanAktifTenang — تكافل اونتوق سموا | #كوانتن اكتيف تنڠ"),
                'start_at'         => Carbon::parse('2024-07-06 06:30:00'),
                'end_at'           => null,
                'venue'            => 'East Coast Mall',
                'city'             => 'Kuantan',
                'state'            => 'Pahang',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful4All Sustainability Day',
                'slug'             => 'takaful4all-sustainability-day',
                'excerpt'          => 'A fun-filled sustainability day themed "Protect, Care, Sustain" — featuring a hero run, zero waste workshop, sustainability carnival, and more. Part of the Hijrah 27 Working Group 4 initiative championing the Takaful Industry\'s ESG and Sustainability initiatives.',
                'content_html'     => $this->toHtml("The Malaysian Takaful Association (MTA) is looking forward to meet you at the Takaful4All Sustainability Day 2024, themed \"Protect, Care, Sustain\". This event is part of the Hijrah 27 Working Group 4 initiative which is championing the Takaful Industry's ESG and Sustainability Initiatives.\n\nOur vision is simple but yet powerful: to inspire everyone, especially the younger generation, to adopt sustainable practices and environmental conservation in their daily lives. This fun-filled day promises something for everyone which will feature interactive and hands-on activities designed to connect everyone with nature whilst promoting good health, fostering a deeper understanding and commitment to sustainability.\n\nHighlights of the events:\n- Larian Hero Hijau: A refreshing 5 kilometre morning fun-run at perimeter of Taman Tugu to kickstart the day.\n- Zero Waste Lifestyle Workshop: Learn practical steps toward sustainable living with Zero Waste Malaysia.\n- Launch of Takaful4All Disaster Response Team: Witness the unveiling of this impactful initiative by Takaful Industry in expanding its Disaster Response Team.\n- Sustainability Carnival: Engage in eco-friendly workshops, art, photography, and financial & sustainability literacy activities.\n- Folks Sport Activities: Relive your childhood memories through \"Timbang Bulu Ayam\" and \"Musang Berjanggut\" games.\n- Coloring Contest: Educating the children on preserving nature for sustainability.\n- Takaful Sustainability Booth: Showcase of Sustainability activities or Takaful Products by 15 Takaful Operators.\n\nWe would love for this event to be a day of fun, learning, and connection — not just for you but also for your teams, families, and friends.\n\nAgenda:\n07:00 – 07:30  Warm-up Session\n07:30 – 08:30  Larian Hero Hijau @ Taman Tugu\n08:30 – 08:50  Welcoming Remarks by Mr Marcel Omar Papp\n08:30 – 08:50  Opening Speech by Guest of Honour\n08:50 – 09:00  Initiating the Takaful4All Disaster Relief Team by YBhg Dato' Rudy Asdialie Che Lamin\n09:00 – 10:00  Zero Waste Lifestyle Workshop – Zero Waste Malaysia\n10:00 – 10:30  Bomba Demonstration\n10:30 – 12:30  Sustainability Carnival\n12:30 – 01:00  Prize Giving Ceremony & Rezeki Draw\n01:00           Closing & End Programs"),
                'start_at'         => Carbon::parse('2024-12-15 07:00:00'),
                'end_at'           => Carbon::parse('2024-12-15 13:00:00'),
                'venue'            => 'Taman Tugu Nursery',
                'city'             => 'Kuala Lumpur',
                'state'            => 'W.P. KL',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful4All Larian Hero Hijau',
                'slug'             => 'takaful4all-larian-hero-hijau',
                'excerpt'          => 'A 5KM green fun run at Taman Tugu organised by Takaful4All. Registration includes a T-shirt, e-certificate, medal for the first 50 finishers, sustainability prizes, and a lucky draw.',
                'content_html'     => $this->toHtml("Join us for the Takaful4All Larian Hero Hijau — a 5KM green run at Taman Tugu, Kuala Lumpur!\n\nRegistration fee of RM35 (flash offer, limited slots) includes:\n- T-shirt\n- E-certificate (E-Sijil)\n- Medal for the first 50 finishers (Pingat untuk 50 Penamat Terawal)\n- Sustainability prizes (Hadiah Kelestarian)\n- Cabutan Rezeki (Lucky Draw)\n\nTawaran Terhad — Daftar Sekarang! Scan the QR code to register."),
                'start_at'         => Carbon::parse('2024-12-15 07:00:00'),
                'end_at'           => Carbon::parse('2024-12-15 09:00:00'),
                'venue'            => 'Taman Tugu',
                'city'             => 'Kuala Lumpur',
                'state'            => 'W.P. KL',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'gdrive_link'      => null,
                'rsvp_enabled'     => true,
                'is_published'     => true,
            ],
        ];

        foreach ($events as $data) {
            Event::updateOrCreate(['slug' => $data['slug']], $data);
        }

        $this->command->info('Events seeded successfully. Total: ' . count($events) . ' events.');
    }

    private function toHtml(string $content): string
    {
        return Str::markdown($content);
    }
}
