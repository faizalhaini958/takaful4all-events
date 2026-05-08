<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $eventId = $this->route('event')?->id;

        return [
            'title'            => 'required|string|max:255',
            'slug'             => 'nullable|string|max:255|unique:events,slug,' . $eventId,
            'excerpt'          => 'nullable|string',
            'content_html'     => 'nullable|string',
            'start_at'         => 'required|date',
            'end_at'           => 'nullable|date|after_or_equal:start_at',
            'venue'            => 'nullable|string|max:255',
            'city'             => 'nullable|string|max:100',
            'state'            => 'nullable|string|max:100',
            'country'          => 'nullable|string|max:100',
            'registration_url' => 'nullable|url|max:500',
            'gdrive_link'      => 'nullable|url|max:500',
            'media_id'         => 'nullable|exists:media,id',
            'is_published'     => 'required|boolean',
            'rsvp_enabled'     => 'nullable|boolean',
            'rsvp_deadline'    => 'nullable|date',
            'max_attendees'    => 'nullable|integer|min:1',
            'require_approval' => 'nullable|boolean',
            'meta_json'        => 'nullable|array',
            'terms_conditions' => 'nullable|string',

            // Custom registration fields
            'event_category'                      => 'nullable|string|in:sports,conference,workshop,dinner,entertainment,exhibition,general',
            'registration_fields'                 => 'nullable|array',
            'registration_fields.*.key'           => 'required_with:registration_fields|string|max:100',
            'registration_fields.*.label_en'      => 'required_with:registration_fields|string|max:255',
            'registration_fields.*.label_ms'      => 'required_with:registration_fields|string|max:255',
            'registration_fields.*.type'          => 'required_with:registration_fields|string|in:text,select,radio,date,textarea,checkbox',
            'registration_fields.*.required'      => 'required_with:registration_fields|boolean',
            'registration_fields.*.sort_order'    => 'required_with:registration_fields|integer|min:1',
            'registration_fields.*.options_en'    => 'nullable|array',
            'registration_fields.*.options_ms'    => 'nullable|array',
            'registration_fields.*.options_en.*'  => 'nullable|string|max:255',
            'registration_fields.*.options_ms.*'  => 'nullable|string|max:255',
            'registration_fields.*.placeholder_en'  => 'nullable|string|max:500',
            'registration_fields.*.placeholder_ms'  => 'nullable|string|max:500',
            'registration_fields.*.locked'           => 'nullable|boolean',
            'registration_fields.*.ticket_scope'     => 'nullable|array',
            'registration_fields.*.ticket_scope.*'   => 'nullable|string|max:255',
            'registration_fields.*.description_en'   => 'nullable|string|max:5000',
            'registration_fields.*.description_ms'   => 'nullable|string|max:5000',
        ];
    }

    protected function prepareForValidation(): void
    {
        $merges = [];

        if ($this->has('content_html')) {
            $merges['content_html'] = strip_tags(
                $this->content_html ?? '',
                '<p><br><h1><h2><h3><h4><ul><ol><li><strong><em><a><img><blockquote><table><thead><tbody><tr><th><td><u><s><code><pre><hr>'
            );
        }

        // country column is NOT NULL – fall back to 'Malaysia' when the field is cleared
        if (empty($this->country)) {
            $merges['country'] = 'Malaysia';
        }

        if ($merges) {
            $this->merge($merges);
        }
    }
}
