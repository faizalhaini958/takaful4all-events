<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'price'           => 'required|numeric|min:0',
            'currency'        => 'nullable|string|max:10',
            'variants_json'   => 'nullable|array',
            'variants_json.*.label'   => 'required_with:variants_json|string',
            'variants_json.*.options' => 'required_with:variants_json|array|min:1',
            'stock'           => 'nullable|integer|min:0',
            'media_id'        => 'nullable|exists:media,id',
            'is_active'       => 'boolean',
            'sort_order'      => 'nullable|integer|min:0',
        ];
    }
}
