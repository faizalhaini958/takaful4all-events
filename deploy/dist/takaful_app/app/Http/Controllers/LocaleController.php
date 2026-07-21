<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function switch(Request $request, string $lang): RedirectResponse
    {
        $supported = ['en', 'ms'];

        if (! in_array($lang, $supported)) {
            abort(400, 'Unsupported locale.');
        }

        $request->session()->put('locale', $lang);
        app()->setLocale($lang);

        if ($request->user()) {
            $request->user()->update(['locale' => $lang]);
        }

        return back();
    }
}
