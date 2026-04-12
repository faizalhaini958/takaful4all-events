import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import InputError from '@/Components/InputError';
import { type FormEventHandler } from 'react';

interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'editor' | 'company' | 'public';
    company_name: string;
    company_registration_no: string;
    company_address: string;
    company_phone: string;
}

interface Props {
    data: UserFormData;
    errors: Partial<Record<keyof UserFormData, string>>;
    processing: boolean;
    setData: <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => void;
    onSubmit: FormEventHandler;
    submitLabel: string;
    isCreate?: boolean;
}

export default function UserForm({ data, errors, processing, setData, onSubmit, submitLabel, isCreate }: Props) {
    return (
        <form onSubmit={onSubmit} className="space-y-8 max-w-2xl">
            {/* Basic Info */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Account Information</h2>

                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        Password
                        {!isCreate && <span className="text-muted-foreground text-xs ml-1">(leave blank to keep current)</span>}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        required={isCreate}
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={data.role} onValueChange={val => setData('role', val as UserFormData['role'])}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.role} />
                </div>
            </div>

            {/* Company Fields — shown only when role is company */}
            {data.role === 'company' && (
                <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Company Details</h2>

                    <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                            id="company_name"
                            value={data.company_name}
                            onChange={e => setData('company_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.company_name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company_registration_no">Registration Number</Label>
                        <Input
                            id="company_registration_no"
                            value={data.company_registration_no}
                            onChange={e => setData('company_registration_no', e.target.value)}
                            placeholder="e.g. 202001012345"
                        />
                        <InputError message={errors.company_registration_no} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company_address">Address</Label>
                        <textarea
                            id="company_address"
                            value={data.company_address}
                            onChange={e => setData('company_address', e.target.value)}
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.company_address} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company_phone">Phone</Label>
                        <Input
                            id="company_phone"
                            value={data.company_phone}
                            onChange={e => setData('company_phone', e.target.value)}
                            placeholder="e.g. 03-1234 5678"
                        />
                        <InputError message={errors.company_phone} />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand-dark">
                    {processing ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
