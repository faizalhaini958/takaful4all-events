import AdminLayout from '@/Layouts/AdminLayout';
import PostForm, { toEmbedUrl } from '@/Components/PostForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';
import { type Post } from '@/types';

interface Props {
    post: Post;
}

function toDatetimeLocal(val: string | null): string {
    if (!val) return '';
    return val.length > 16 ? val.slice(0, 16) : val;
}

export default function PostEdit({ post }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        title:        post.title,
        slug:         post.slug,
        type:         post.type as 'podcast' | 'webinar' | 'article',
        excerpt:      post.excerpt ?? '',
        content_html: post.content_html ?? '',
        embed_url:    toEmbedUrl(post.embed_url ?? ''),
        published_at: toDatetimeLocal(post.published_at),
        is_published: post.is_published ? '1' : '0',
        media_id:     post.media_id ? String(post.media_id) : 'none',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        put(`/admin/posts/${post.slug}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/posts" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
                </div>

                <PostForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Update Post"
                    currentMedia={post.media}
                    postSlug={post.slug}
                />
            </div>
        </AdminLayout>
    );
}
