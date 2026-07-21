<?php

namespace Database\Seeders;

use App\Models\ShippingZone;
use Illuminate\Database\Seeder;

class ShippingZoneSeeder extends Seeder
{
    public function run(): void
    {
        ShippingZone::upsert([
            [
                'name'              => 'West Malaysia (Peninsular)',
                'countries'         => json_encode(['MY']),
                'states'            => json_encode([
                    'JHR', 'KDH', 'KTN', 'MLK', 'NSN',
                    'PHG', 'PNG', 'PRK', 'PLS', 'SGR',
                    'TRG', 'KUL', 'PJY',
                ]),
                'rate'              => 8.00,
                'rate_type'         => 'flat',
                'free_shipping_min' => 150.00,
                'is_active'         => true,
                'sort_order'        => 1,
            ],
            [
                'name'              => 'East Malaysia (Sabah & Sarawak)',
                'countries'         => json_encode(['MY']),
                'states'            => json_encode([
                    'SBH', 'SWK', 'LBN',
                ]),
                'rate'              => 15.00,
                'rate_type'         => 'flat',
                'free_shipping_min' => 200.00,
                'is_active'         => true,
                'sort_order'        => 2,
            ],
        ], ['name'], ['countries', 'states', 'rate', 'rate_type', 'free_shipping_min', 'is_active', 'sort_order']);
    }
}
