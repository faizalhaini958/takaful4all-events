<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $pageId = $this->route('page')?->id;

        return [
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:255|unique:pages,slug,' . $pageId,
            'content_html' => 'nullable|string',
            'meta_json'    => 'nullable|array',
            'is_published' => 'boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('content_html')) {
            $this->merge([
                'content_html' => strip_tags($this->content_html, '<p><br><h1><h2><h3><h4><ul><ol><li><strong><em><a><img><blockquote><table><thead><tbody><tr><th><td><section><div><span>'),
            ]);
        }
    }
}
