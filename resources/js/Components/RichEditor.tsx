import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback, useRef, useState } from 'react';
import axios from 'axios';
import {
    Bold, Italic, UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus,
    AlignLeft, AlignCenter, AlignRight,
    Link2, Link2Off, Undo2, Redo2,
    ImageIcon, Loader2, Code2,
} from 'lucide-react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

function ToolbarButton({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                active
                    ? 'bg-brand text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-gray-200 mx-0.5 self-center" />;
}

export default function RichEditor({ value, onChange, placeholder = 'Write something...', className = '' }: Props) {
    const fileInputRef   = useRef<HTMLInputElement>(null);
    const [imgUploading, setImgUploading] = useState(false);
    const [imgPopover,   setImgPopover]   = useState(false);
    const [htmlMode,     setHtmlMode]     = useState(false);
    const [htmlValue,    setHtmlValue]    = useState(value);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand underline' } }),
            Placeholder.configure({ placeholder }),
            Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full my-4' } }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML() === '<p></p>' ? '' : editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[220px] px-4 py-3 text-gray-900',
            },
        },
    });

    // Sync external value changes (e.g. initial load in Edit page)
    useEffect(() => {
        if (!editor) return;
        if (editor.getHTML() !== value) {
            editor.commands.setContent(value || '', { emitUpdate: false });
        }
    }, [value, editor]);

    const toggleHtmlMode = useCallback(() => {
        if (!editor) return;
        if (!htmlMode) {
            setHtmlValue(editor.getHTML());
        } else {
            editor.commands.setContent(htmlValue, { emitUpdate: true });
        }
        setHtmlMode(v => !v);
    }, [editor, htmlMode, htmlValue]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href as string | undefined;
        const url  = window.prompt('Enter URL', prev ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    const insertImageByUrl = useCallback(() => {
        if (!editor) return;
        setImgPopover(false);
        const url = window.prompt('Image URL', 'https://');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    }, [editor]);

    const uploadImage = useCallback(async (file: File) => {
        if (!editor) return;
        setImgUploading(true);
        setImgPopover(false);
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await axios.post<{ media: { url: string } }>('/admin/media', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            editor.chain().focus().setImage({ src: data.media.url }).run();
        } catch {
            alert('Image upload failed. Please try again.');
        } finally {
            setImgUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [editor]);

    if (!editor) return null;

    return (
        <div className={`border border-input rounded-lg overflow-hidden bg-white ${className}`}>
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-gray-50">
                {/* History */}
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <Undo2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <Redo2 className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* Headings */}
                <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* Inline marks */}
                <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* Alignment */}
                <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* Link */}
                <ToolbarButton title="Set link" active={editor.isActive('link')} onClick={setLink}>
                    <Link2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
                    <Link2Off className="w-4 h-4" />
                </ToolbarButton>

                <Divider />

                {/* HTML source toggle — pushed to the far right */}
                <div className="ml-auto">
                    <ToolbarButton
                        title={htmlMode ? 'Visual editor' : 'View / edit HTML source'}
                        active={htmlMode}
                        onClick={toggleHtmlMode}
                    >
                        <Code2 className="w-4 h-4" />
                    </ToolbarButton>
                </div>

                <Divider />

                {/* Image */}
                <div className="relative">
                    <ToolbarButton
                        title="Insert image"
                        active={imgPopover}
                        disabled={imgUploading}
                        onClick={() => setImgPopover(v => !v)}
                    >
                        {imgUploading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <ImageIcon className="w-4 h-4" />
                        }
                    </ToolbarButton>

                    {imgPopover && (
                        <>
                            {/* Backdrop to close on outside click */}
                            <div className="fixed inset-0 z-10" onMouseDown={() => setImgPopover(false)} />
                            <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click(); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-brand-light/40 transition-colors"
                                >
                                    <ImageIcon className="w-4 h-4 text-brand flex-shrink-0" />
                                    Upload image
                                </button>
                                <div className="h-px bg-gray-100" />
                                <button
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); insertImageByUrl(); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-brand-light/40 transition-colors"
                                >
                                    <Link2 className="w-4 h-4 text-brand flex-shrink-0" />
                                    Insert by URL
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
            />

            {/* ── Editor / HTML area ── */}
            {htmlMode ? (
                <textarea
                    value={htmlValue}
                    onChange={e => {
                        setHtmlValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    spellCheck={false}
                    className="w-full min-h-[220px] px-4 py-3 font-mono text-xs bg-gray-950 text-green-400 focus:outline-none resize-y"
                    placeholder="<p>Raw HTML…</p>"
                />
            ) : (
                <EditorContent editor={editor} />
            )}
        </div>
    );
}
