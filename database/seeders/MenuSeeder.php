<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $main = Menu::updateOrCreate(
            ['slug' => 'main-navigation'],
            ['name' => 'Main Navigation', 'slug' => 'main-navigation']
        );

        MenuItem::where('menu_id', $main->id)->delete();

        $items = [
            ['label' => 'Home',    'url' => '/',       'sort' => 1],
            ['label' => 'Events',  'url' => '/events', 'sort' => 2],
            ['label' => 'About',   'url' => '/about',  'sort' => 3],
            ['label' => 'Contact', 'url' => '/contact','sort' => 4],
        ];

        foreach ($items as $item) {
            MenuItem::create(array_merge($item, ['menu_id' => $main->id]));
        }

        $footer = Menu::updateOrCreate(
            ['slug' => 'footer-navigation'],
            ['name' => 'Footer Navigation (To Know More)', 'slug' => 'footer-navigation']
        );

        MenuItem::where('menu_id', $footer->id)->delete();

        $footerItems = [
            ['label' => 'Home',    'url' => '/',       'sort' => 1],
            ['label' => 'About Us','url' => '/about',  'sort' => 2],
            ['label' => 'Events',  'url' => '/events', 'sort' => 3],
            ['label' => 'Contact', 'url' => '/contact','sort' => 4],
        ];

        foreach ($footerItems as $item) {
            MenuItem::create(array_merge($item, ['menu_id' => $footer->id]));
        }

        $legal = Menu::updateOrCreate(
            ['slug' => 'legal-navigation'],
            ['name' => 'Legal Navigation', 'slug' => 'legal-navigation']
        );

        MenuItem::where('menu_id', $legal->id)->delete();

        $legalItems = [
            ['label' => 'Terms & Conditions',    'url' => '/terms-conditions',         'sort' => 1],
            ['label' => 'Privacy Policy',        'url' => '/privacy-policy',           'sort' => 2],
            ['label' => 'Cancellation & Refund', 'url' => '/cancellation-refund-policy','sort' => 3],
        ];

        foreach ($legalItems as $item) {
            MenuItem::create(array_merge($item, ['menu_id' => $legal->id]));
        }
    }
}
