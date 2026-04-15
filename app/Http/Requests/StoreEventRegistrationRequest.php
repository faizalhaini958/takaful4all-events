<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public form — no auth required
    }

    public function rules(): array
    {
        return [
            'ticket_id'                          => 'required|exists:event_tickets,id',
            'quantity'                            => 'required|integer|min:1|max:10',
            'attendees'                           => 'required|array|min:1',
            'attendees.*.name'                    => 'required|string|max:255',
            'attendees.*.email'                   => 'required|email|max:255',
            'attendees.*.phone'                   => 'required|string|max:30',
            'attendees.*.company'                 => 'required|string|max:255',
            'attendees.*.job_title'               => 'nullable|string|max:255',
            'attendees.*.dietary_requirements'    => 'nullable|string|max:255',
            'notes'                               => 'nullable|string|max:1000',
            'products'                            => 'nullable|array',
            'products.*.product_id'               => 'required|exists:event_products,id',
            'products.*.variant'                  => 'nullable|string|max:100',
            'products.*.quantity'                  => 'required|integer|min:1|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'ticket_id.required'       => 'Please select a ticket type.',
            'ticket_id.exists'         => 'The selected ticket is not available.',
            'quantity.max'             => 'You can register a maximum of 10 attendees per order.',
            'attendees.required'       => 'Please fill in the attendee details.',
            'attendees.*.name.required'  => 'Each attendee must have a name.',
            'attendees.*.email.required' => 'Each attendee must have an email address.',
            'attendees.*.email.email'    => 'Please enter a valid email address for each attendee.',
            'attendees.*.phone.required'   => 'Please enter a phone number for each attendee.',
            'attendees.*.company.required' => 'Please enter a company or organisation name for each attendee.',
        ];
    }
}
