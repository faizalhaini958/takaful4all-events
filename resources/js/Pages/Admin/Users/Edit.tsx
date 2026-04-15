import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Components/UserForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'checkin_staff' | 'company' | 'public';
    company_name: string | null;
    company_registration_no: string | null;
    company_address: string | null;
    company_phone: string | null;
}

interface Props {
    user: UserData;
}

export default function UserEdit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        company_name: user.company_name ?? '',
        company_registration_no: user.company_registration_no ?? '',
        company_address: user.company_address ?? '',
        company_phone: user.company_phone ?? '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
                </div>

                <UserForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Update User"
                />
            </div>
        </AdminLayout>
    );
}
