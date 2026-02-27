<?php

namespace Database\Seeders;

use App\Models\Event;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            [
                'title'            => 'Takaful Leadership Summit 2026',
                'excerpt'          => 'The premier annual gathering of takaful industry leaders to discuss trends and innovations.',
                'content_html'     => '<p>Join us for the <strong>Takaful Leadership Summit 2026</strong>, an exclusive conference bringing together CEOs, regulators, and innovators from across the global takaful industry.</p><p>This year\'s theme: <em>"Resilience Through Innovation"</em>.</p><h2>Key Topics</h2><ul><li>Digital transformation in takaful</li><li>Regulatory updates from BNM</li><li>Sustainable takaful products</li></ul>',
                'start_at'         => now()->addDays(30),
                'end_at'           => now()->addDays(31),
                'venue'            => 'Kuala Lumpur Convention Centre',
                'city'             => 'Kuala Lumpur',
                'state'            => 'Wilayah Persekutuan',
                'country'          => 'Malaysia',
                'registration_url' => 'https://events.takaful4all.org/register/summit-2026',
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful Innovation Conference 2026',
                'excerpt'          => 'Exploring the future of InsurTech and takaful digital products.',
                'content_html'     => '<p>A full-day conference focused on <strong>digital innovation</strong> across the takaful value chain.</p>',
                'start_at'         => now()->addDays(60),
                'end_at'           => now()->addDays(60)->addHours(8),
                'venue'            => 'Pullman Kuala Lumpur City Centre',
                'city'             => 'Kuala Lumpur',
                'state'            => 'Wilayah Persekutuan',
                'country'          => 'Malaysia',
                'registration_url' => 'https://events.takaful4all.org/register/innovation-2026',
                'is_published'     => true,
            ],
            [
                'title'            => 'Takaful Awareness Week 2025',
                'excerpt'          => 'A week-long initiative to educate the public about takaful benefits.',
                'content_html'     => '<p>Takaful Awareness Week 2025 brought together <strong>over 2,000 participants</strong> across Malaysia for workshops, seminars, and public outreach events.</p>',
                'start_at'         => now()->subDays(100),
                'end_at'           => now()->subDays(93),
                'venue'            => 'Various Locations Nationwide',
                'city'             => 'Multiple Cities',
                'state'            => 'Nationwide',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'is_published'     => true,
            ],
            [
                'title'            => 'MTA Annual Dinner & Awards 2025',
                'excerpt'          => 'Celebrating excellence and achievements in the Malaysian takaful industry.',
                'content_html'     => '<p>The <strong>MTA Annual Dinner & Awards 2025</strong> was a night to remember — celebrating the best of the takaful industry.</p>',
                'start_at'         => now()->subDays(200),
                'end_at'           => now()->subDays(200)->addHours(5),
                'venue'            => 'Mandarin Oriental Kuala Lumpur',
                'city'             => 'Kuala Lumpur',
                'state'            => 'Wilayah Persekutuan',
                'country'          => 'Malaysia',
                'registration_url' => null,
                'is_published'     => true,
            ],
        ];

        foreach ($events as $data) {
            Event::updateOrCreate(['title' => $data['title']], $data);
        }
    }
}
