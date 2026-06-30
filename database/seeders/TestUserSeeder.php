<?php

namespace Database\Seeders;

use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Helmi Biz',    'email' => 'helmi.biz@gmail.com'],
            ['name' => 'Ainaa Test',   'email' => 'ainaa.test@gmail.com'],
            ['name' => 'Farid Test',   'email' => 'farid.test@gmail.com'],
            ['name' => 'Siti QA',      'email' => 'siti.qa@gmail.com'],
            ['name' => 'Ali Tester',   'email' => 'ali.tester@gmail.com'],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => bcrypt('password'),
                    'role'              => 'public',
                    'email_verified_at' => now(),
                ]
            );

            // Event 1 — Takaful Leadership Summit 2025 (Free ticket #4)
            EventRegistration::firstOrCreate(
                ['email' => $data['email'], 'event_id' => 1],
                [
                    'event_id'        => 1,
                    'ticket_id'       => 4,
                    'name'            => $data['name'],
                    'email'           => $data['email'],
                    'status'          => 'confirmed',
                    'payment_status'  => 'na',
                    'total_amount'    => 0,
                    'subtotal'        => 0,
                ]
            );

            // Event 20 — Malaysia Northern Run (Penang Edition) v2 (10KM Men Open #33)
            EventRegistration::firstOrCreate(
                ['email' => $data['email'], 'event_id' => 20],
                [
                    'event_id'        => 20,
                    'ticket_id'       => 33,
                    'name'            => $data['name'],
                    'email'           => $data['email'],
                    'status'          => 'confirmed',
                    'payment_status'  => 'paid',
                    'total_amount'    => 65.00,
                    'subtotal'        => 65.00,
                ]
            );

            $this->command->info("Created/Updated: {$data['name']} ({$data['email']}) in Events #1 & #20");
        }
    }
}
