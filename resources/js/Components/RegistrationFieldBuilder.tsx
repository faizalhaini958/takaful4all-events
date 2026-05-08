import { useEffect, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import { ChevronDown, ChevronUp, Plus, Trash2, Lock } from 'lucide-react';
import { type RegistrationField, type RegistrationFieldType } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<RegistrationFieldType, string> = {
    text:     'Text',
    select:   'Dropdown',
    radio:    'Radio',
    date:     'Date',
    textarea: 'Long Text',
    checkbox: 'Checkbox',
};

const TYPE_COLORS: Record<RegistrationFieldType, string> = {
    text:     'bg-blue-100 text-blue-700',
    select:   'bg-purple-100 text-purple-700',
    radio:    'bg-orange-100 text-orange-700',
    date:     'bg-green-100 text-green-700',
    textarea: 'bg-yellow-100 text-yellow-700',
    checkbox: 'bg-gray-100 text-gray-600',
};

function generateKey(label: string, existingKeys: string[]): string {
    let base = label.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_') || 'field';
    let key = base;
    let i = 2;
    while (existingKeys.includes(key)) { key = `${base}_${i++}`; }
    return key;
}

function parseOptions(raw: string): string[] {
    return raw.split('\n').map(s => s.trim()).filter(Boolean);
}

function formatOptions(opts: string[] | undefined): string {
    return (opts ?? []).join('\n');
}

// ── Field card component ─────────────────────────────────────────────────────

interface FieldCardProps {
    field: RegistrationField;
    index: number;
    total: number;
    prevIsLocked: boolean;
    allKeys: string[];
    ticketNames?: string[];
    onUpdate: (f: RegistrationField) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

function FieldCard({ field, index, total, prevIsLocked, allKeys, ticketNames, onUpdate, onDelete, onMoveUp, onMoveDown }: FieldCardProps) {
    const [open, setOpen] = useState(field.label_en === '');

    // Local raw text for options textareas — prevents cursor-reset on every keystroke
    const [rawOptionsEn, setRawOptionsEn] = useState(() => formatOptions(field.options_en));
    const [rawOptionsMs, setRawOptionsMs] = useState(() => formatOptions(field.options_ms));
    const focusedOptions = useRef<'en' | 'ms' | null>(null);

    // Sync from props when options change externally (e.g. template reset) but not while editing
    useEffect(() => {
        if (focusedOptions.current !== 'en') setRawOptionsEn(formatOptions(field.options_en));
    }, [field.options_en]);
    useEffect(() => {
        if (focusedOptions.current !== 'ms') setRawOptionsMs(formatOptions(field.options_ms));
    }, [field.options_ms]);

    const needsOptions     = field.type === 'select' || field.type === 'radio';
    const needsPlaceholder = field.type === 'text' || field.type === 'textarea';

    function handleLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newLabel = e.target.value;
        // Auto-generate key from label (only for new/unlocked fields where key was auto-generated)
        const newKey = !field.locked ? generateKey(newLabel, allKeys) : field.key;
        onUpdate({ ...field, label_en: newLabel, key: newKey });
    }

    return (
        <div className={`rounded-xl border overflow-hidden ${field.locked ? 'bg-muted/10 border-border/40' : 'bg-background border-border/60'}`}>

            {/* ── Compact summary row ── */}
            <div className="flex items-center gap-2 px-3 py-2 min-h-[44px]">

                {/* Up / Down */}
                <div className="flex flex-col gap-0 flex-shrink-0">
                    <button
                        type="button"
                        title="Move up"
                        onClick={onMoveUp}
                        disabled={field.locked || index === 0 || prevIsLocked}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        title="Move down"
                        onClick={onMoveDown}
                        disabled={field.locked || index === total - 1}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Type badge */}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${TYPE_COLORS[field.type]}`}>
                    {TYPE_LABELS[field.type]}
                </span>

                {/* Label display */}
                <span className="flex-1 text-sm font-medium truncate min-w-0">
                    {field.label_en
                        ? <>
                            {field.label_en}
                            {field.label_ms && field.label_ms !== field.label_en && (
                                <span className="text-xs text-muted-foreground ml-1.5">/ {field.label_ms}</span>
                            )}
                          </>
                        : <em className="text-muted-foreground font-normal text-xs">Untitled field</em>
                    }
                </span>

                {/* Required / Optional pill */}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${field.required ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                    {field.required ? 'Required' : 'Optional'}
                </span>

                {field.locked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" title="Locked — cannot be removed" />}

                {/* Expand toggle */}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Delete (non-locked only) */}
                {!field.locked && (
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Remove field"
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* ── Expanded editor ── */}
            {open && (
                <div className="border-t border-border/30 px-4 py-4 space-y-4">

                    {/* Labels */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Label (English)</Label>
                            <Input
                                value={field.label_en}
                                onChange={handleLabelChange}
                                placeholder="e.g. IC Number"
                                className="mt-1 h-8 text-sm"
                                disabled={field.locked}
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Label (Bahasa Malaysia)</Label>
                            <Input
                                value={field.label_ms}
                                onChange={e => onUpdate({ ...field, label_ms: e.target.value })}
                                placeholder="e.g. Nombor IC"
                                className="mt-1 h-8 text-sm"
                                disabled={field.locked}
                            />
                        </div>
                    </div>

                    {/* Field type selector (non-locked only) */}
                    {!field.locked && (
                        <div>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-1.5 block">Field Type</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {(['text', 'select', 'radio', 'date', 'textarea', 'checkbox'] as RegistrationFieldType[]).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => onUpdate({
                                            ...field,
                                            type: t,
                                            options_en: (t === 'select' || t === 'radio') ? (field.options_en ?? []) : undefined,
                                            options_ms: (t === 'select' || t === 'radio') ? (field.options_ms ?? []) : undefined,
                                        })}
                                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${field.type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                                    >
                                        {TYPE_LABELS[t]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Waiver / Description text — checkbox only */}
                    {field.type === 'checkbox' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Waiver / Description Text — English <span className="normal-case font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    value={field.description_en ?? ''}
                                    onChange={e => onUpdate({ ...field, description_en: e.target.value || undefined })}
                                    placeholder="Enter the full waiver text or description shown above the checkbox…"
                                    className="mt-1 text-sm resize-none"
                                    rows={5}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Waiver / Description Text — BM <span className="normal-case font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    value={field.description_ms ?? ''}
                                    onChange={e => onUpdate({ ...field, description_ms: e.target.value || undefined })}
                                    placeholder="Masukkan teks waiver atau penerangan yang dipaparkan di atas kotak semak…"
                                    className="mt-1 text-sm resize-none"
                                    rows={5}
                                />
                            </div>
                        </div>
                    )}

                    {/* Required toggle */}
                    <div className="flex items-center justify-between py-1 border-t border-border/20">
                        <div>
                            <p className="text-sm font-medium">Required</p>
                            <p className="text-xs text-muted-foreground">Registrant must fill this to submit</p>
                        </div>
                        <Switch
                            checked={field.required}
                            onCheckedChange={c => onUpdate({ ...field, required: c })}
                            disabled={field.locked}
                        />
                    </div>

                    {/* Options editor (select / radio) */}
                    {needsOptions && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Options — English <span className="normal-case font-normal">(one per line)</span>
                                </Label>
                                <Textarea
                                    value={rawOptionsEn}
                                    onFocus={() => { focusedOptions.current = 'en'; }}
                                    onChange={e => setRawOptionsEn(e.target.value)}
                                    onBlur={() => {
                                        focusedOptions.current = null;
                                        onUpdate({ ...field, options_en: parseOptions(rawOptionsEn) });
                                    }}
                                    placeholder={'Male\nFemale'}
                                    className="mt-1 text-sm font-mono resize-none"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Options — BM <span className="normal-case font-normal">(one per line)</span>
                                </Label>
                                <Textarea
                                    value={rawOptionsMs}
                                    onFocus={() => { focusedOptions.current = 'ms'; }}
                                    onChange={e => setRawOptionsMs(e.target.value)}
                                    onBlur={() => {
                                        focusedOptions.current = null;
                                        onUpdate({ ...field, options_ms: parseOptions(rawOptionsMs) });
                                    }}
                                    placeholder={'Lelaki\nPerempuan'}
                                    className="mt-1 text-sm font-mono resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Placeholder editor (text / textarea) */}
                    {needsPlaceholder && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Placeholder English <span className="normal-case font-normal">(optional)</span>
                                </Label>
                                <Input
                                    value={field.placeholder_en ?? ''}
                                    onChange={e => onUpdate({ ...field, placeholder_en: e.target.value })}
                                    placeholder="Hint text shown inside field…"
                                    className="mt-1 h-8 text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
                                    Placeholder BM <span className="normal-case font-normal">(optional)</span>
                                </Label>
                                <Input
                                    value={field.placeholder_ms ?? ''}
                                    onChange={e => onUpdate({ ...field, placeholder_ms: e.target.value })}
                                    placeholder="Teks panduan dalam medan…"
                                    className="mt-1 h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Applies to tickets — only shown for non-locked fields when ticket data is available */}
                    {!field.locked && ticketNames && ticketNames.length > 0 && (
                        <div className="border-t border-border/20 pt-3">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide mb-2 block">
                                Applies to tickets
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Leave all unchecked to show this field for every ticket type.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {ticketNames.map(name => {
                                    const checked = !!(field.ticket_scope && field.ticket_scope.includes(name));
                                    return (
                                        <label
                                            key={name}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none transition-colors ${
                                                checked
                                                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                    : 'border-border text-muted-foreground hover:border-primary/40'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={checked}
                                                onChange={e => {
                                                    const current = field.ticket_scope ?? [];
                                                    const next = e.target.checked
                                                        ? [...current, name]
                                                        : current.filter(n => n !== name);
                                                    onUpdate({ ...field, ticket_scope: next.length > 0 ? next : null });
                                                }}
                                            />
                                            {name}
                                        </label>
                                    );
                                })}
                            </div>
                            {field.ticket_scope && field.ticket_scope.length > 0 && (
                                <p className="text-[10px] text-amber-600 mt-1.5">
                                    Only shown for: {field.ticket_scope.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Field key — read-only reference for developers */}
                    <p className="text-[10px] text-muted-foreground font-mono pt-1">
                        key: <span className="text-foreground/70">{field.key}</span>
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
    fields: RegistrationField[];
    onChange: (fields: RegistrationField[]) => void;
    ticketNames?: string[];
}

export default function RegistrationFieldBuilder({ fields, onChange, ticketNames }: Props) {

    function update(index: number, updated: RegistrationField) {
        const next = [...fields];
        next[index] = updated;
        onChange(next);
    }

    function remove(index: number) {
        const next = fields.filter((_, i) => i !== index);
        next.forEach((f, i) => { f.sort_order = i + 1; });
        onChange(next);
    }

    function moveUp(index: number) {
        if (index === 0 || fields[index].locked || fields[index - 1].locked) return;
        const next = [...fields];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        next.forEach((f, i) => { f.sort_order = i + 1; });
        onChange(next);
    }

    function moveDown(index: number) {
        if (index === fields.length - 1 || fields[index].locked) return;
        const next = [...fields];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        next.forEach((f, i) => { f.sort_order = i + 1; });
        onChange(next);
    }

    function addField() {
        const existingKeys = fields.map(f => f.key);
        const key = generateKey('new_field', existingKeys);
        const newField: RegistrationField = {
            key,
            label_en: '',
            label_ms: '',
            type: 'text',
            required: false,
            sort_order: fields.length + 1,
        };
        onChange([...fields, newField]);
    }

    const allKeys = fields.map(f => f.key);

    return (
        <div className="space-y-2">
            {fields.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 italic">
                    No fields configured. Select a category above to load a template, or click "Add Custom Field" to build manually.
                </p>
            ) : (
                fields.map((field, index) => (
                    <FieldCard
                        key={index}
                        field={field}
                        index={index}
                        total={fields.length}
                        prevIsLocked={index > 0 && !!fields[index - 1].locked}
                        allKeys={allKeys.filter((_, i) => i !== index)}
                        ticketNames={ticketNames}
                        onUpdate={updated => update(index, updated)}
                        onDelete={() => remove(index)}
                        onMoveUp={() => moveUp(index)}
                        onMoveDown={() => moveDown(index)}
                    />
                ))
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
                className="w-full h-9 gap-1.5 border-dashed mt-1"
            >
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
            </Button>
        </div>
    );
}
