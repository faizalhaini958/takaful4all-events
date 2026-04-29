<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Settings
    |--------------------------------------------------------------------------
    |
    | Set default paper size and orientation.
    |
    */
    'show_warnings' => false,
    'public_path' => env('APP_PUBLIC_PATH', base_path('public')),
    'convert_entities' => true,
    'options' => [
        /**
         * The location of the DOMPDF font directory
         */
        'font_dir' => storage_path('fonts'),

        /**
         * The location of the DOMPDF font cache directory
         */
        'font_cache' => storage_path('fonts'),

        /**
         * The location of temporary directory
         */
        'temp_dir' => sys_get_temp_dir(),

        /**
         * Disable remote file access
         */
        'chroot' => env('APP_PUBLIC_PATH', base_path('public')),

        /**
         * Protocol whitelist
         */
        'allowed_protocols' => [
            'file://' => ['rules' => []],
            'data://' => ['rules' => []],
            'http://' => ['rules' => []],
            'https://' => ['rules' => []],
        ],

        'log_output_file' => null,

        /**
         * Available fonts
         */
        'font_family' => 'helvetica',
        'default_media_type' => 'screen',
        'default_paper_size' => 'a4',
        'default_paper_orientation' => 'portrait',
        'default_font' => 'helvetica',
        'dpi' => 96,
        'enable_php' => false,
        'enable_javascript' => false,
        'enable_remote' => false,
        'font_height_ratio' => 1.1,
        'enable_html5_parser' => true,
    ],
];
