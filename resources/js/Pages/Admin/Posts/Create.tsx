import AdminLayout from '@/Layouts/AdminLayout';
import PostForm from '@/Components/PostForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function PostCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title:        '',
        slug:         '',
        type:         'podcast' as 'podcast' | 'webinar' | 'article',
        excerpt:      '',
        content_html: '',
        embed_url:    '',
        published_at: '',
        is_published: '1',
        media_id:     '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post('/admin/posts');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/posts" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">New Post</h1>
                </div>

                <PostForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Create Post"
                />
            </div>
        </AdminLayout>
    );
}
