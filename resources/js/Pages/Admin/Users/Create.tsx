import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Components/UserForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function UserCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'public' as 'admin' | 'checkin_staff' | 'public',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/users" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">New User</h1>
                </div>

                <UserForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Create User"
                    isCreate
                />
            </div>
        </AdminLayout>
    );
}
