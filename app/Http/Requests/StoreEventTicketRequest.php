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
            'name'               => 'required|string|max:255',
            'color'              => 'nullable|string|max:7',
            'description'        => 'nullable|string',
            'type'               => 'required|in:free,paid',
            'price'              => 'required_if:type,paid|numeric|min:0',
            'early_bird_price'   => 'nullable|numeric|min:0',
            'early_bird_end_at'  => 'nullable|date|required_with:early_bird_price',
            'currency'           => 'nullable|string|max:10',
            'quantity'           => 'nullable|integer|min:1',
            'max_per_order'      => 'nullable|integer|min:1|max:100',
            'sale_start_at'      => 'nullable|date',
            'sale_end_at'        => 'nullable|date|after_or_equal:sale_start_at',
            'is_active'          => 'boolean',
            'sort_order'         => 'nullable|integer|min:0',
            'event_zone_id'      => 'nullable|integer|exists:event_zones,id',
        ];
    }

    protected function prepareForValidation(): void
    {
        // If type is free, force price to 0 and clear early bird
        if ($this->type === 'free') {
            $this->merge([
                'price'             => 0,
                'early_bird_price'  => null,
                'early_bird_end_at' => null,
            ]);
        }

        // If early bird price is empty string, set to null
        if ($this->early_bird_price === '' || $this->early_bird_price === null) {
            $this->merge(['early_bird_price' => null, 'early_bird_end_at' => null]);
        }
    }
}
