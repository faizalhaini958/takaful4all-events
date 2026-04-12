<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventRegistrationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\BannerController as AdminBannerController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\EventTicketController as AdminEventTicketController;
use App\Http\Controllers\Admin\EventProductController as AdminEventProductController;
use App\Http\Controllers\Admin\EventRegistrationController as AdminEventRegistrationController;
use App\Http\Controllers\Admin\EventZoneController as AdminEventZoneController;
use App\Http\Controllers\Admin\CheckInController as AdminCheckInController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\ShippingZoneController as AdminShippingZoneController;
use App\Http\Controllers\ChipInWebhookController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// ─── Public Routes ────────────────────────────────────────────────────────────

Route::post('/locale/{lang}', [LocaleController::class, 'switch'])->name('locale.switch');

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/events', [EventController::class, 'index'])->name('events.index');
Route::get('/events/{slug}', [EventController::class, 'show'])->name('events.show');
Route::get('/events/{slug}/register', [EventRegistrationController::class, 'create'])->name('events.register');
Route::post('/events/{slug}/register', [EventRegistrationController::class, 'store'])->name('events.register.store');
Route::get('/events/{slug}/register/confirmation/{reference}', [EventRegistrationController::class, 'confirmation'])->name('events.register.confirmation');
Route::get('/webinars', [PostController::class, 'webinars'])->name('webinars.index');
Route::get('/agent360', [PostController::class, 'agent360'])->name('agent360.index');

// Static-ish pages driven from DB
Route::get('/about', [PageController::class, 'show'])->defaults('slug', 'about')->name('about');
Route::get('/contact', [PageController::class, 'show'])->defaults('slug', 'contact')->name('contact');

// Payment result pages
Route::get('/payment/success', [PaymentController::class, 'success'])->name('payment.success');
Route::get('/payment/failed', [PaymentController::class, 'failure'])->name('payment.failure');

// Invoice download (authenticated)
Route::get('/invoices/{invoiceNumber}/download', [InvoiceController::class, 'download'])
    ->middleware('auth')
    ->name('invoices.download');

// ─── User Dashboard Routes ────────────────────────────────────────────────────

Route::prefix('dashboard')
    ->name('user.')
    ->middleware(['auth'])
    ->group(function () {

        Route::get('/', [UserDashboardController::class, 'index'])->name('dashboard');

        // Profile
        Route::get('profile', [UserDashboardController::class, 'profile'])->name('profile');
        Route::patch('profile', [UserDashboardController::class, 'updateProfile'])->name('profile.update');
        Route::delete('profile', [UserDashboardController::class, 'destroyProfile'])->name('profile.destroy');

        // Tickets
        Route::get('tickets', [UserDashboardController::class, 'tickets'])->name('tickets');

        // Orders
        Route::get('orders', [UserDashboardController::class, 'orders'])->name('orders');
        Route::get('orders/{id}', [UserDashboardController::class, 'orderDetail'])->name('orders.show');

        // Payment Methods
        Route::get('payments', [UserDashboardController::class, 'payments'])->name('payments');
        Route::post('payments', [UserDashboardController::class, 'storePayment'])->name('payments.store');
        Route::patch('payments/{id}/default', [UserDashboardController::class, 'setDefaultPayment'])->name('payments.setDefault');
        Route::delete('payments/{id}', [UserDashboardController::class, 'destroyPayment'])->name('payments.destroy');
    });

// ─── Admin Routes ─────────────────────────────────────────────────────────────

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'admin'])
    ->group(function () {

        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Users
        Route::resource('users', AdminUserController::class)
            ->except(['show']);

        // Banners
        Route::get('banners', [AdminBannerController::class, 'index'])->name('banners.index');
        Route::post('banners', [AdminBannerController::class, 'store'])->name('banners.store');
        Route::post('banners/reorder', [AdminBannerController::class, 'reorder'])->name('banners.reorder');
        Route::post('banners/{banner}', [AdminBannerController::class, 'update'])->name('banners.update')->where('banner', '[0-9]+');
        Route::delete('banners/{banner}', [AdminBannerController::class, 'destroy'])->name('banners.destroy');

        // Events
        Route::resource('events', AdminEventController::class)
            ->except(['show']);
        Route::post('events/{event}/duplicate', [AdminEventController::class, 'duplicate'])->name('events.duplicate');

        // Event Tickets
        Route::get('tickets', [AdminEventTicketController::class, 'all'])->name('tickets.index');
        Route::get('events/{event}/tickets', [AdminEventTicketController::class, 'index'])->name('events.tickets.index');
        Route::post('events/{event}/tickets', [AdminEventTicketController::class, 'store'])->name('events.tickets.store');
        Route::put('events/{event}/tickets/{ticket}', [AdminEventTicketController::class, 'update'])->name('events.tickets.update');
        Route::delete('events/{event}/tickets/{ticket}', [AdminEventTicketController::class, 'destroy'])->name('events.tickets.destroy');

        // Event Zones
        Route::get('events/{event}/zones', [AdminEventZoneController::class, 'index'])->name('events.zones.index');
        Route::post('events/{event}/zones', [AdminEventZoneController::class, 'store'])->name('events.zones.store');
        Route::put('events/{event}/zones/{zone}', [AdminEventZoneController::class, 'update'])->name('events.zones.update');
        Route::delete('events/{event}/zones/{zone}', [AdminEventZoneController::class, 'destroy'])->name('events.zones.destroy');

        // Event Products
        Route::get('products', [AdminEventProductController::class, 'all'])->name('products.index');
        Route::get('events/{event}/products', [AdminEventProductController::class, 'index'])->name('events.products.index');
        Route::post('events/{event}/products', [AdminEventProductController::class, 'store'])->name('events.products.store');
        Route::put('events/{event}/products/{product}', [AdminEventProductController::class, 'update'])->name('events.products.update');
        Route::delete('events/{event}/products/{product}', [AdminEventProductController::class, 'destroy'])->name('events.products.destroy');

        // Orders
        Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');

        // All Registrations (global view)
        Route::get('registrations', [AdminEventRegistrationController::class, 'all'])->name('registrations.index');

        // Event Registrations
        Route::get('events/{event}/registrations', [AdminEventRegistrationController::class, 'index'])->name('events.registrations.index');
        Route::get('events/{event}/registrations/{registration}', [AdminEventRegistrationController::class, 'show'])->name('events.registrations.show');
        Route::patch('events/{event}/registrations/{registration}/status', [AdminEventRegistrationController::class, 'updateStatus'])->name('events.registrations.update-status');
        Route::post('events/{event}/registrations/{registration}/check-in', [AdminEventRegistrationController::class, 'checkIn'])->name('events.registrations.check-in');
        Route::post('events/{event}/registrations/bulk-status', [AdminEventRegistrationController::class, 'bulkUpdateStatus'])->name('events.registrations.bulk-status');
        Route::delete('events/{event}/registrations/{registration}', [AdminEventRegistrationController::class, 'destroy'])->name('events.registrations.destroy');

        // Check-in Scanner
        Route::get('events/{event}/check-in', [AdminCheckInController::class, 'scanner'])->name('events.check-in');
        Route::post('events/{event}/check-in/lookup', [AdminCheckInController::class, 'lookup'])->name('events.check-in.lookup');
        Route::post('events/{event}/check-in/confirm', [AdminCheckInController::class, 'checkIn'])->name('events.check-in.confirm');

        // Pages
        Route::resource('pages', AdminPageController::class)
            ->except(['show']);

        // Posts
        Route::resource('posts', AdminPostController::class)
            ->except(['show']);
        Route::post('posts/{post}/duplicate', [AdminPostController::class, 'duplicate'])->name('posts.duplicate');

        // Media
        Route::get('media', [AdminMediaController::class, 'index'])->name('media.index');
        Route::post('media', [AdminMediaController::class, 'store'])->name('media.store');
        Route::post('media/from-url', [AdminMediaController::class, 'storeFromUrl'])->name('media.from-url');
        Route::delete('media/{media}', [AdminMediaController::class, 'destroy'])->name('media.destroy');

        // Menus
        Route::get('menus', [AdminMenuController::class, 'index'])->name('menus.index');
        Route::post('menus', [AdminMenuController::class, 'store'])->name('menus.store');
        Route::put('menus/{menu}', [AdminMenuController::class, 'update'])->name('menus.update');
        Route::delete('menus/{menu}', [AdminMenuController::class, 'destroy'])->name('menus.destroy');

        // Menu items
        Route::post('menus/{menu}/items', [AdminMenuController::class, 'storeItem'])->name('menus.items.store');
        Route::put('menus/{menu}/items/{item}', [AdminMenuController::class, 'updateItem'])->name('menus.items.update');
        Route::delete('menus/{menu}/items/{item}', [AdminMenuController::class, 'destroyItem'])->name('menus.items.destroy');
        Route::post('menus/reorder', [AdminMenuController::class, 'reorder'])->name('menus.reorder');

        // Settings
        Route::get('settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::post('settings/smtp', [AdminSettingController::class, 'updateSmtp'])->name('settings.smtp');
        Route::post('settings/smtp/test', [AdminSettingController::class, 'testSmtp'])->name('settings.smtp.test');
        Route::post('settings/chipin', [AdminSettingController::class, 'updateChipIn'])->name('settings.chipin');
        Route::post('settings/chipin/test', [AdminSettingController::class, 'testChipIn'])->name('settings.chipin.test');
        Route::post('settings/general', [AdminSettingController::class, 'updateGeneral'])->name('settings.general');
        Route::post('settings/booking', [AdminSettingController::class, 'updateBooking'])->name('settings.booking');
        Route::post('settings/notifications', [AdminSettingController::class, 'updateNotifications'])->name('settings.notifications');
        Route::post('settings/invoicing', [AdminSettingController::class, 'updateInvoicing'])->name('settings.invoicing');
        Route::post('settings/localisation', [AdminSettingController::class, 'updateLocalisation'])->name('settings.localisation');

        // Shipping Zones
        Route::post('settings/shipping-zones', [AdminShippingZoneController::class, 'store'])->name('shipping-zones.store');
        Route::put('settings/shipping-zones/{zone}', [AdminShippingZoneController::class, 'update'])->name('shipping-zones.update');
        Route::delete('settings/shipping-zones/{zone}', [AdminShippingZoneController::class, 'destroy'])->name('shipping-zones.destroy');

        // Profile
        Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

// ─── Webhook Routes (no CSRF) ─────────────────────────────────────────────────

Route::post('/webhooks/chipin', [ChipInWebhookController::class, 'handle'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('webhooks.chipin');

require __DIR__.'/auth.php';

// Dynamic page catch-all — must be last so it doesn't intercept admin/auth routes
Route::get('/{slug}', [PageController::class, 'show'])
    ->where('slug', '^(?!admin|dashboard|login|register|forgot-password|reset-password|verify-email|confirm-password).+')
    ->name('page.show');
