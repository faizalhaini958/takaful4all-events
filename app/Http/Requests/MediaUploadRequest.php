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
            'file' => 'required|file|mimes:jpeg,jpg,png,webp|max:5120', // 5MB
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Only JPEG, PNG, and WebP images are allowed.',
            'file.max'   => 'The file must not be larger than 5MB.',
        ];
    }
}
