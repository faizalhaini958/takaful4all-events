<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'                    => ['required', 'string', 'max:255'],
            'email'                   => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password'                => ['nullable', 'string', 'min:8'],
            'role'                    => ['required', Rule::in(['admin', 'checkin_staff', 'public'])],
        ];
    }
}
