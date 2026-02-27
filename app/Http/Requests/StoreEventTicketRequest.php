<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'type'          => 'required|in:free,paid',
            'price'         => 'required_if:type,paid|numeric|min:0',
            'currency'      => 'nullable|string|max:10',
            'quantity'      => 'nullable|integer|min:1',
            'max_per_order' => 'nullable|integer|min:1|max:100',
            'sale_start_at' => 'nullable|date',
            'sale_end_at'   => 'nullable|date|after_or_equal:sale_start_at',
            'is_active'     => 'boolean',
            'sort_order'    => 'nullable|integer|min:0',
        ];
    }

    protected function prepareForValidation(): void
    {
        // If type is free, force price to 0
        if ($this->type === 'free') {
            $this->merge(['price' => 0]);
        }
    }
}
