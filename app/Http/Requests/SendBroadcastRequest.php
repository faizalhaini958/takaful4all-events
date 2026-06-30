<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendBroadcastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject'          => ['required', 'string', 'max:255'],
            'body'             => ['required', 'string'],
            'recipient_type'   => ['required', Rule::in(['all', 'role', 'event', 'individual'])],
            'recipient_role'   => ['required_if:recipient_type,role', Rule::in(['admin', 'editor', 'checkin_staff', 'company', 'public'])],
            'recipient_event_id' => ['required_if:recipient_type,event', 'integer', 'exists:events,id'],
            'recipient_emails'   => ['required_if:recipient_type,individual', 'array'],
            'recipient_emails.*' => ['email'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_role.required_if'   => 'Please select a role when sending to a specific user role.',
            'recipient_event_id.required_if' => 'Please select an event when sending to event registrants.',
            'recipient_emails.required_if' => 'Please select at least one recipient.',
        ];
    }
}
