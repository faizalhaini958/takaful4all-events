<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\EventTicket;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;

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
            $ticket = null;
            $ticketName = null;
            if ($this->input('ticket_id')) {
                // Read the ticket from the database — never trust user input for scope resolution
                $ticket = EventTicket::where('id', $this->input('ticket_id'))
                    ->where('event_id', $event->id)
                    ->first();
                $ticketName = $ticket?->name;
            }

            $rules['attendees.*.custom_fields'] = 'nullable|array';

            foreach ($event->registration_fields as $field) {
                // Locked base fields are validated at the top level above
                if (in_array($field['key'], ['name', 'email', 'phone'])) {
                    continue;
                }

                // Determine if this field is in scope for the selected ticket
                $scope   = $field['ticket_scope'] ?? null;
                $inScope = empty($scope) || ($ticketName && in_array($ticketName, $scope));

                // If field is out of scope, skip entirely — do not validate
                if (! $inScope) {
                    $rules['attendees.*.custom_fields.' . $field['key']] = 'nullable';
                    continue;
                }

                // Resolve allowed options for this ticket (option overrides)
                $allowedOptions = $this->resolveFieldOptions($field, $ticketName);

                $required = ! empty($field['required']);

                // For dropdown/radio with resolved options, add an in: rule
                if (in_array($field['type'], ['select', 'radio']) && ! empty($allowedOptions)) {
                    $inRule = 'in:' . implode(',', $allowedOptions);
                    $rules['attendees.*.custom_fields.' . $field['key']] = $required
                        ? "required|string|{$inRule}"
                        : "nullable|string|{$inRule}";
                } else {
                    $rules['attendees.*.custom_fields.' . $field['key']] = match ($field['type']) {
                        'date'     => $required ? 'required|date'            : 'nullable|date',
                        'checkbox' => $required ? 'required|in:true'         : 'nullable|string|in:true,false',
                        'textarea' => $required ? 'required|string|max:2000' : 'nullable|string|max:2000',
                        default    => $required ? 'required|string|max:500'  : 'nullable|string|max:500',
                    };
                }
            }
        } else {
            // Legacy mode — event has no custom fields, use the original hardcoded rules
            $rules['attendees.*.company']              = 'required|string|max:255';
            $rules['attendees.*.job_title']            = 'nullable|string|max:255';
            $rules['attendees.*.dietary_requirements'] = 'nullable|string|max:255';
        }

        return $rules;
    }

    /**
     * After all field-level validation passes, check ticket eligibility rules
     * (age and gender) against the submitted custom field values.
     */
    protected function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return; // Field validation already failed — skip eligibility check
            }

            $event = Event::where('slug', $this->route('slug'))->first();
            if (! $event) return;

            $ticket = EventTicket::where('id', $this->input('ticket_id'))
                ->where('event_id', $event->id)
                ->first();

            if (! $ticket) return;

            // No eligibility rules — nothing to check
            if (is_null($ticket->min_age) && is_null($ticket->max_age) && is_null($ticket->allowed_gender)) {
                return;
            }

            $attendees = $this->input('attendees', []);
            $fields    = $event->registration_fields ?? [];

            // Find the DOB field key (first date field whose key contains 'dob' or 'birth')
            $dobKey = null;
            foreach ($fields as $f) {
                if ($f['type'] === 'date' && (str_contains($f['key'], 'dob') || str_contains($f['key'], 'birth'))) {
                    $dobKey = $f['key'];
                    break;
                }
            }

            // Find the gender field key
            $genderKey = null;
            foreach ($fields as $f) {
                if ($f['key'] === 'gender') {
                    $genderKey = $f['key'];
                    break;
                }
            }

            foreach ($attendees as $index => $attendee) {
                $customFields = $attendee['custom_fields'] ?? [];

                // ── Age check ─────────────────────────────────────────────────
                if (($ticket->min_age || $ticket->max_age) && $dobKey && ! empty($customFields[$dobKey])) {
                    try {
                        $dob = Carbon::parse($customFields[$dobKey]);
                        $age = $dob->age;

                        if ($ticket->min_age && $ticket->max_age) {
                            if ($age < $ticket->min_age || $age > $ticket->max_age) {
                                $validator->errors()->add(
                                    "attendees.{$index}.custom_fields.{$dobKey}",
                                    "This ticket category is for participants aged {$ticket->min_age}–{$ticket->max_age} years."
                                );
                            }
                        } elseif ($ticket->min_age && $age < $ticket->min_age) {
                            $validator->errors()->add(
                                "attendees.{$index}.custom_fields.{$dobKey}",
                                "This ticket category is for participants aged {$ticket->min_age} and above."
                            );
                        } elseif ($ticket->max_age && $age > $ticket->max_age) {
                            $validator->errors()->add(
                                "attendees.{$index}.custom_fields.{$dobKey}",
                                "This ticket category is for participants aged {$ticket->max_age} and below."
                            );
                        }
                    } catch (\Throwable) {
                        // Invalid date — field-level validation should have caught this
                    }
                }

                // ── Gender check ──────────────────────────────────────────────
                if ($ticket->allowed_gender && $genderKey && ! empty($customFields[$genderKey])) {
                    $submitted = strtolower(trim($customFields[$genderKey]));
                    // Normalise "Male"→"male", "Lelaki"→"male", "Female"→"female", "Perempuan"→"female"
                    $normalised = match ($submitted) {
                        'male', 'lelaki', 'm'        => 'male',
                        'female', 'perempuan', 'f'   => 'female',
                        default                      => $submitted,
                    };

                    if ($normalised !== $ticket->allowed_gender) {
                        $genderLabel = ucfirst($ticket->allowed_gender);
                        $validator->errors()->add(
                            "attendees.{$index}.custom_fields.{$genderKey}",
                            "This ticket category is for {$genderLabel} participants only."
                        );
                    }
                }
            }
        });
    }

    /**
     * Resolve the effective options for a field given the selected ticket name.
     * If an options_override exists for this ticket, use those options.
     * Otherwise fall back to the default options_en.
     * Returns an empty array if the field type does not use options.
     */
    private function resolveFieldOptions(array $field, ?string $ticketName): array
    {
        if (! in_array($field['type'], ['select', 'radio'])) {
            return [];
        }

        $override = $field['options_override'] ?? null;

        if ($ticketName && is_array($override) && isset($override[$ticketName]['options_en'])) {
            return $override[$ticketName]['options_en'];
        }

        return $field['options_en'] ?? [];
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
