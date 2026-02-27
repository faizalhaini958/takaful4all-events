<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PageSeeder::class,
            EventSeeder::class,
            PostSeeder::class,
            MenuSeeder::class,
            EventRegistrationSeeder::class,
        ]);
    }
}
