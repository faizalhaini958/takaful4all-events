<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@takaful.com'],
            [
                'name'     => 'MTA Admin',
                'password' => Hash::make('mta@admin26events'),
                'role'     => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'editor@takaful.com'],
            [
                'name'     => 'MTA Editor',
                'password' => Hash::make('password'),
                'role'     => 'editor',
            ]
        );

        // Regular user for the front-end dashboard
        User::updateOrCreate(
            ['email' => 'user@takaful.com'],
            [
                'name'     => 'Aiman Razak',
                'password' => Hash::make('password'),
                'role'     => 'user',
            ]
        );
    }
}
