import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm } from '@inertiajs/react';
import { CreditCard, Plus, Trash2, Shield, Building2, Wallet } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { useState } from 'react';

interface PaymentMethod {
    id: number;
    type: 'card' | 'fpx' | 'ewallet';
    label: string;
    last4?: string;
    bank_name?: string;
    is_default: boolean;
    created_at: string;
}

interface Props {
    paymentMethods: PaymentMethod[];
}

const TYPE_ICON: Record<string, typeof CreditCard> = {
    card:    CreditCard,
    fpx:     Building2,
    ewallet: Wallet,
};

const TYPE_LABEL: Record<string, string> = {
    card:    'Credit/Debit Card',
    fpx:     'FPX Online Banking',
    ewallet: 'E-Wallet',
};

export default function Payments({ paymentMethods }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);

    const form = useForm({
        type: 'card' as 'card' | 'fpx' | 'ewallet',
        label: '',
        card_number: '',
        expiry: '',
        bank_name: '',
    });

    const deleteForm = useForm({});

    const submitAdd: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('user.payments.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setShowAddForm(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to remove this payment method?')) {
            deleteForm.delete(route('user.payments.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const handleSetDefault = (id: number) => {
        deleteForm.patch(route('user.payments.setDefault', id), {
            preserveScroll: true,
        });
    };

    return (
        <UserDashboardLayout title="Payment Options">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payment Options</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage your saved payment methods for faster checkout.</p>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Payment Method
                    </Button>
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium">Your payment information is secure</p>
                        <p className="mt-0.5">We use industry-standard encryption. Card details are never stored directly on our servers.</p>
                    </div>
                </div>

                {/* Add new payment method form */}
                {showAddForm && (
                    <Card className="border-brand/30">
                        <CardHeader>
                            <CardTitle>Add Payment Method</CardTitle>
                            <CardDescription>Choose a payment type and fill in the details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitAdd} className="space-y-4 max-w-lg">
                                {/* Payment type selector */}
                                <div className="space-y-2">
                                    <Label>Payment Type</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['card', 'fpx', 'ewallet'] as const).map((type) => {
                                            const Icon = TYPE_ICON[type];
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => form.setData('type', type)}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                                        form.data.type === type
                                                            ? 'border-brand bg-brand/5'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Icon className={`w-6 h-6 ${form.data.type === type ? 'text-brand' : 'text-gray-400'}`} />
                                                    <span className={`text-xs font-medium ${form.data.type === type ? 'text-brand-navy' : 'text-gray-500'}`}>
                                                        {TYPE_LABEL[type]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label">Display Label</Label>
                                    <Input
                                        id="label"
                                        placeholder={form.data.type === 'card' ? 'e.g. Personal Visa' : form.data.type === 'fpx' ? 'e.g. Maybank' : 'e.g. Touch n Go'}
                                        value={form.data.label}
                                        onChange={(e) => form.setData('label', e.target.value)}
                                        required
                                    />
                                    {form.errors.label && <p className="text-sm text-red-600">{form.errors.label}</p>}
                                </div>

                                {form.data.type === 'card' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="card_number">Card Number</Label>
                                            <Input
                                                id="card_number"
                                                placeholder="•••• •••• •••• ••••"
                                                value={form.data.card_number}
                                                onChange={(e) => form.setData('card_number', e.target.value)}
                                                maxLength={19}
                                            />
                                            {form.errors.card_number && <p className="text-sm text-red-600">{form.errors.card_number}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry">Expiry Date</Label>
                                            <Input
                                                id="expiry"
                                                placeholder="MM/YY"
                                                value={form.data.expiry}
                                                onChange={(e) => form.setData('expiry', e.target.value)}
                                                maxLength={5}
                                            />
                                            {form.errors.expiry && <p className="text-sm text-red-600">{form.errors.expiry}</p>}
                                        </div>
                                    </>
                                )}

                                {form.data.type === 'fpx' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">Bank Name</Label>
                                        <select
                                            id="bank_name"
                                            value={form.data.bank_name}
                                            onChange={(e) => form.setData('bank_name', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                                        >
                                            <option value="">Select a bank...</option>
                                            <option value="Maybank">Maybank</option>
                                            <option value="CIMB">CIMB Bank</option>
                                            <option value="Public Bank">Public Bank</option>
                                            <option value="RHB">RHB Bank</option>
                                            <option value="Hong Leong">Hong Leong Bank</option>
                                            <option value="AmBank">AmBank</option>
                                            <option value="Bank Islam">Bank Islam</option>
                                            <option value="BSN">BSN</option>
                                            <option value="Bank Rakyat">Bank Rakyat</option>
                                            <option value="OCBC">OCBC Bank</option>
                                            <option value="HSBC">HSBC</option>
                                            <option value="UOB">UOB</option>
                                        </select>
                                        {form.errors.bank_name && <p className="text-sm text-red-600">{form.errors.bank_name}</p>}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" disabled={form.processing}>
                                        Save Payment Method
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Saved payment methods */}
                {paymentMethods.length === 0 && !showAddForm ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No payment methods saved</p>
                            <p className="text-sm text-gray-400 mt-1">Add a payment method for faster checkout.</p>
                            <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                                <Plus className="w-4 h-4 mr-1" /> Add Payment Method
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {paymentMethods.map((method) => {
                            const Icon = TYPE_ICON[method.type] ?? CreditCard;
                            return (
                                <Card key={method.id} className={method.is_default ? 'border-brand/40 bg-brand/5' : ''}>
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                    method.is_default ? 'bg-brand/10' : 'bg-gray-100'
                                                }`}>
                                                    <Icon className={`w-6 h-6 ${method.is_default ? 'text-brand' : 'text-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">{method.label}</p>
                                                        {method.is_default && (
                                                            <Badge variant="default" className="text-xs">Default</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {TYPE_LABEL[method.type]}
                                                        {method.last4 && ` ending in ${method.last4}`}
                                                        {method.bank_name && ` — ${method.bank_name}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!method.is_default && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleSetDefault(method.id)}
                                                        className="text-xs"
                                                    >
                                                        Set as Default
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(method.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </UserDashboardLayout>
    );
}
