<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendNotificationBroadcastRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'              => ['required', 'string', 'max:255'],
            'body'               => ['required', 'string'],
            'action_url'         => ['nullable', 'string', 'max:500'],
            'recipient_type'     => ['required', Rule::in(['all', 'role', 'event', 'individual'])],
            'recipient_role'     => ['required_if:recipient_type,role', Rule::in(['admin', 'checkin_staff', 'public'])],
            'recipient_event_id' => ['required_if:recipient_type,event', 'integer', 'exists:events,id'],
            'recipient_emails'   => ['required_if:recipient_type,individual', 'array'],
            'recipient_emails.*' => ['email'],
        ];
    }
}
