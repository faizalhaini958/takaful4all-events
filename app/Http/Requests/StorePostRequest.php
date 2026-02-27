<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $postId = $this->route('post')?->id;

        return [
            'type'         => 'required|in:podcast,webinar,article,agent360',
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:255|unique:posts,slug,' . $postId,
            'excerpt'      => 'nullable|string',
            'content_html' => 'nullable|string',
            'embed_url'    => 'nullable|url|max:500',
            'media_id'     => 'nullable|exists:media,id',
            'is_published' => 'required|boolean',
            'published_at' => 'nullable|date',
            'meta_json'    => 'nullable|array',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('content_html')) {
            $this->merge([
                'content_html' => strip_tags($this->content_html, '<p><br><h1><h2><h3><h4><ul><ol><li><strong><em><a><img><blockquote>'),
            ]);
        }
    }
}
