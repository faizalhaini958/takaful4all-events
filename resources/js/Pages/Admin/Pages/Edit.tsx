import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { type Page } from '@/types';
import RichEditor from '@/Components/RichEditor';

interface Props {
    page: Page;
}

export default function PageEdit({ page }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        title:        page.title,
        slug:         page.slug,
        content_html: page.content_html ?? '',
        is_published: page.is_published ? '1' : '0',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        put(`/admin/pages/${page.slug}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Edit Page</h1>
                    <Button variant="outline" asChild>
                        <Link href="/admin/pages">← Back</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Page Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={e => setData('slug', e.target.value)}
                                    className="mt-1"
                                />
                                {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug}</p>}
                            </div>

                            <div>
                                <Label>Content</Label>
                                <div className="mt-1">
                                    <RichEditor
                                        value={data.content_html}
                                        onChange={v => setData('content_html', v)}
                                        placeholder="Write page content…"
                                    />
                                </div>
                                {errors.content_html && <p className="text-sm text-red-600 mt-1">{errors.content_html}</p>}
                            </div>

                            <div>
                                <Label htmlFor="is_published">Status</Label>
                                <Select value={data.is_published} onValueChange={v => setData('is_published', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Published</SelectItem>
                                        <SelectItem value="0">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/pages">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand-dark">
                            {processing ? 'Saving…' : 'Update Page'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
