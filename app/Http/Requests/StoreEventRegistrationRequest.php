<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public form — no auth required
    }

    public function rules(): array
    {
        $rules = [
            'ticket_id'             => 'required|exists:event_tickets,id',
            'quantity'              => 'required|integer|min:1|max:10',
            'attendees'             => 'required|array|min:1',
            'attendees.*.name'      => 'required|string|max:255',
            'attendees.*.email'     => 'required|email|max:255',
            'attendees.*.phone'     => 'required|string|max:30',
            'notes'                 => 'nullable|string|max:1000',
            'products'              => 'nullable|array',
            'products.*.product_id' => 'required|exists:event_products,id',
            'products.*.variants'   => 'nullable|array',
            'products.*.variants.*' => 'nullable|string|max:100',
            'products.*.quantity'   => 'required|integer|min:1|max:20',
        ];

        $event = Event::where('slug', $this->route('slug'))->first();

        if ($event && ! empty($event->registration_fields)) {
            // Dynamic mode: validate against the event's configured custom fields,
            // filtered to only those that apply to the selected ticket.
            $ticketName = null;
            if ($this->input('ticket_id')) {
                // Read the ticket name from the database - never trust user input for scope resolution
                $ticketName = \App\Models\EventTicket::where('id', $this->input('ticket_id'))
                    ->where('event_id', $event->id)
                    ->value('name');
            }

            $rules['attendees.*.custom_fields'] = 'nullable|array';

            foreach ($event->registration_fields as $field) {
                // Locked base fields are validated at the top level above
                if (in_array($field['key'], ['name', 'email', 'phone'])) {
                    continue;
                }

                // Determine if this field is in scope for the selected ticket
                $scope    = $field['ticket_scope'] ?? null;
                $inScope  = empty($scope) || ($ticketName && in_array($ticketName, $scope));
                $required = $inScope && ! empty($field['required']);

                $rules['attendees.*.custom_fields.' . $field['key']] = match ($field['type']) {
                    'date'     => $required ? 'required|date'            : 'nullable|date',
                    'checkbox' => $required ? 'required|in:true'         : 'nullable|string|in:true,false',
                    'textarea' => $required ? 'required|string|max:2000' : 'nullable|string|max:2000',
                    default    => $required ? 'required|string|max:500'  : 'nullable|string|max:500',
                };
            }
        } else {
            // Legacy mode — event has no custom fields, use the original hardcoded rules
            $rules['attendees.*.company']              = 'required|string|max:255';
            $rules['attendees.*.job_title']            = 'nullable|string|max:255';
            $rules['attendees.*.dietary_requirements'] = 'nullable|string|max:255';
        }

        return $rules;
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
