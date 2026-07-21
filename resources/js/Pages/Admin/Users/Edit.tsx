import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Components/UserForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'checkin_staff' | 'public';
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
