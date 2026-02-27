<?php

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $posts = [
            [
                'type'         => 'podcast',
                'title'        => 'Episode 1: The Future of Takaful in Malaysia',
                'excerpt'      => 'Our CEO discusses the roadmap for the takaful industry in Malaysia over the next decade.',
                'content_html' => '<p>In this inaugural episode, we sit down with our CEO to discuss the exciting road ahead for the takaful industry.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(30),
            ],
            [
                'type'         => 'podcast',
                'title'        => 'Episode 2: Digital Transformation in Takaful',
                'excerpt'      => 'How technology is reshaping the way takaful products are designed, distributed, and managed.',
                'content_html' => '<p>We explore how AI, big data, and mobile platforms are revolutionising the takaful experience.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(15),
            ],
            [
                'type'         => 'podcast',
                'title'        => 'Episode 3: Microtalkaful — Reaching the Underserved',
                'excerpt'      => 'A deep dive into micro-takaful products and their potential to expand coverage to lower-income communities.',
                'content_html' => '<p>Micro-takaful products are changing the landscape of financial inclusion in Malaysia.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(5),
            ],
            [
                'type'         => 'webinar',
                'title'        => 'Regulatory Updates from Bank Negara Malaysia 2026',
                'excerpt'      => 'An in-depth webinar on the latest regulatory changes affecting takaful operators.',
                'content_html' => '<p>Our expert panel discusses the key regulatory updates from BNM and their implications for the industry.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(60),
            ],
            [
                'type'         => 'webinar',
                'title'        => 'Sustainable & ESG-Aligned Takaful Products',
                'excerpt'      => 'How takaful operators can align their product offerings with ESG principles.',
                'content_html' => '<p>Environmental, Social, and Governance (ESG) considerations are becoming central to product development.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(45),
            ],
            [
                'type'         => 'webinar',
                'title'        => 'Takaful Claims Management Best Practices',
                'excerpt'      => 'A practical guide to improving claims processing efficiency and customer satisfaction.',
                'content_html' => '<p>This webinar covers end-to-end claims management strategies for takaful operators.</p>',
                'is_published' => true,
                'published_at' => now()->subDays(20),
            ],
        ];

        foreach ($posts as $data) {
            Post::updateOrCreate(['title' => $data['title']], $data);
        }
    }
}
