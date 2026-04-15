<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'                    => ['required', 'string', 'max:255'],
            'email'                   => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password'                => ['nullable', 'string', 'min:8'],
            'role'                    => ['required', Rule::in(['admin', 'editor', 'checkin_staff', 'company', 'public'])],
            'company_name'            => ['nullable', 'required_if:role,company', 'string', 'max:255'],
            'company_registration_no' => ['nullable', 'string', 'max:100'],
            'company_address'         => ['nullable', 'string', 'max:1000'],
            'company_phone'           => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required_if' => 'Company name is required for company accounts.',
        ];
    }
}
