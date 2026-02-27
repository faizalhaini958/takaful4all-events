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
            'media_id'         => 'nullable|exists:media,id',
            'is_published'     => 'required|boolean',
            'rsvp_enabled'     => 'nullable|boolean',
            'rsvp_deadline'    => 'nullable|date',
            'max_attendees'    => 'nullable|integer|min:1',
            'require_approval' => 'nullable|boolean',
            'meta_json'        => 'nullable|array',
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
