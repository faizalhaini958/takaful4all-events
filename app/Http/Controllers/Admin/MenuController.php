<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Menus/Index', [
            'menus' => Menu::with(['items' => fn ($q) => $q->orderBy('sort')])->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:menus,name',
            'slug' => 'required|string|max:255|unique:menus,slug',
        ]);
        Menu::create($validated);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu created.');
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:menus,name,' . $menu->id,
            'slug' => 'required|string|max:255|unique:menus,slug,' . $menu->id,
        ]);
        $menu->update($validated);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu updated.');
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        $menu->delete();

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu deleted.');
    }

    public function storeItem(Request $request, Menu $menu): RedirectResponse
    {
        $data = $request->validate([
            'label'     => 'required|string|max:255',
            'url'       => 'required|string|max:500',
            'target'    => 'nullable|in:_self,_blank',
            'sort'      => 'integer|min:0',
            'parent_id' => 'nullable|exists:menu_items,id',
        ]);

        $menu->items()->create($data);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu item added.');
    }

    public function updateItem(Request $request, Menu $menu, MenuItem $item): RedirectResponse
    {
        $data = $request->validate([
            'label'     => 'required|string|max:255',
            'url'       => 'required|string|max:500',
            'target'    => 'nullable|in:_self,_blank',
            'sort'      => 'integer|min:0',
            'parent_id' => 'nullable|exists:menu_items,id',
        ]);

        $item->update($data);

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu item updated.');
    }

    public function destroyItem(Menu $menu, MenuItem $item): RedirectResponse
    {
        $item->delete();

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu item deleted.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'items'               => 'required|array',
            'items.*.id'          => 'required|exists:menu_items,id',
            'items.*.sort'        => 'required|integer',
            'items.*.parent_id'   => 'nullable|exists:menu_items,id',
        ]);

        foreach ($request->items as $item) {
            MenuItem::where('id', $item['id'])->update([
                'sort'      => $item['sort'],
                'parent_id' => $item['parent_id'] ?? null,
            ]);
        }

        return redirect()->route('admin.menus.index')
            ->with('success', 'Menu order saved.');
    }
}
