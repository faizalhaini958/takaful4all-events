<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:jpeg,jpg,png,webp|max:5120|dimensions:min_width=800', // 5MB, min 800px wide
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes'      => 'Only JPEG, PNG, and WebP images are allowed.',
            'file.max'        => 'The file must not be larger than 5MB.',
            'file.dimensions' => 'The image must be at least 800px wide.',
        ];
    }
}
