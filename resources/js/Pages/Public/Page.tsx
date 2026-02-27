import PublicLayout from '@/Layouts/PublicLayout';
import { type Page } from '@/types';
import { BookOpen, Users, Lightbulb, Phone, Mail, MapPin, type LucideIcon } from 'lucide-react';

interface Props {
    page: Page;
}

/* ─── About page data ─── */
const AIMS: { Icon: LucideIcon; title: string; desc: string }[] = [
    {
        Icon: BookOpen,
        title: 'Knowledge Sharing',
        desc: 'Providing a platform for industry professionals to come together and exchange knowledge, ideas, and best practices. These events often feature expert speakers and panel discussions, offering valuable insights into the latest trends and developments in the takaful sector.',
    },
    {
        Icon: Users,
        title: 'Networking',
        desc: 'Fostering networking opportunities by bringing together individuals from various organizations — not just within the takaful industry but including other Islamic Finance eco-systems — creating a conducive environment for building relationships, collaborations, and partnerships.',
    },
    {
        Icon: Lightbulb,
        title: 'Thought Leadership',
        desc: 'Demonstrating commitment to thought leadership and knowledge sharing. By hosting these gatherings, MTA positions the Takaful industry as industry leaders and experts, enhancing reputation, credibility, and visibility within the sector.',
    },
];

/* ─── Contact page data ─── */
const CONTACTS = [
    {
        category: 'Events & Sponsorship Info',
        name: 'Siti',
        phone: '+60 11-3747 5361',
        phoneRaw: '+601137475361',
        email: 'event@malaysiantakaful.com.my',
    },
    {
        category: 'Partnership Info',
        name: 'Adreena',
        phone: '+60 12-710 8016',
        phoneRaw: '+60127108016',
        email: 'event@malaysiantakaful.com.my',
    },
];

/* ─── Shared wave divider ─── */
function WaveDivider() {
    return (
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-24 md:h-32">
                <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#dff5f9" />
                <path d="M0,75 C200,40 500,100 800,65 C1100,30 1300,90 1440,70 L1440,120 L0,120 Z" fill="#edfafc" />
                <path d="M0,90 C300,70 600,110 900,85 C1150,65 1300,100 1440,88 L1440,120 L0,120 Z" fill="#f6fdfe" />
                <path d="M0,105 C400,90 800,118 1200,100 C1320,94 1400,108 1440,105 L1440,120 L0,120 Z" fill="white" />
            </svg>
        </div>
    );
}

export default function PageShow({ page }: Props) {
    const isAbout   = page.slug === 'about';
    const isContact = page.slug === 'contact';

    return (
        <PublicLayout>
            {/* ── Hero ── */}
            <section className="relative bg-brand-light overflow-hidden">
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-36 md:py-20 md:pb-44 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy uppercase tracking-wide">
                        {page.title}
                    </h1>
                    {isContact && (
                        <p className="mt-3 text-brand-navy/60 text-lg">
                            Get in touch with the Malaysian Takaful Association events team.
                        </p>
                    )}
                </div>
                <WaveDivider />
            </section>

            {/* ── About content ── */}
            {isAbout && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="prose prose-lg max-w-none text-gray-600 text-center mb-12">
                        <p>
                            Conferences and events play a vital role in promoting the growth and development of the takaful industry.
                            By showcasing innovative products, services, and technologies, these events inspire industry players to
                            embrace advancements and adapt to changing market dynamics.
                        </p>
                        <p>MTA take a lead in organizing several conferences and events for the takaful industry with the aims:</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {AIMS.map(({ Icon, title, desc }) => (
                            <div key={title} className="bg-brand-light/40 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                                <div className="flex justify-center mb-4">
                                    <Icon className="w-10 h-10 text-brand" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-bold text-brand-navy text-lg mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-gray-500 italic border-t border-gray-100 pt-8">
                        These gatherings play a crucial role in fostering collaboration, innovation, and progress within the takaful sector.
                    </p>
                </div>
            )}

            {/* ── Contact content ── */}
            {isContact && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

                    {/* Contact cards */}
                    <div>
                        <h2 className="text-xl font-bold text-brand-navy uppercase tracking-widest mb-6 text-center">Contact Us</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CONTACTS.map(c => (
                                <div key={c.category} className="bg-brand-light/40 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand bg-brand/10 rounded-full px-3 py-1 mb-4">
                                        {c.category}
                                    </span>
                                    <p className="font-bold text-brand-navy text-lg mb-3">{c.name}</p>
                                    <div className="space-y-2 text-sm text-gray-500">
                                        <a href={`tel:${c.phoneRaw}`} className="flex items-center gap-2 hover:text-brand transition-colors">
                                            <Phone className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
                                            {c.phone}
                                        </a>
                                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-brand transition-colors break-all">
                                            <Mail className="w-4 h-4 text-brand shrink-0" strokeWidth={1.5} />
                                            {c.email}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map + Send Message */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

                        {/* Google Map */}
                        <div>
                            <h2 className="text-xl font-bold text-brand-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-brand" strokeWidth={1.5} />
                                Our Location
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Malaysian Takaful Association, Kuala Lumpur</p>
                            <div className="rounded-2xl overflow-hidden shadow-md border border-brand-light">
                                <iframe
                                    title="Malaysian Takaful Association"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.736938!2d101.71!3d3.155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc37b2de5b0f1d%3A0xa84cd8ad4fc98bb0!2sMalaysian%20Takaful%20Association!5e0!3m2!1sen!2smy!4v1700000000000!5m2!1sen!2smy"
                                    width="100%"
                                    height="380"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>

                        {/* Send Message form */}
                        <div>
                            <h2 className="text-xl font-bold text-brand-navy uppercase tracking-widest mb-6">
                                Have Questions?
                                <span className="block text-sm font-normal text-gray-400 normal-case tracking-normal mt-1">Send us a message and we'll get back to you.</span>
                            </h2>
                            <form
                                onSubmit={e => { e.preventDefault(); }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="How can we help?"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Write your message here..."
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Generic page content ── */}
            {!isAbout && !isContact && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {page.content_html ? (
                        <article
                            className="prose prose-lg max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: page.content_html }}
                        />
                    ) : (
                        <p className="text-gray-500">No content available.</p>
                    )}
                </div>
            )}
        </PublicLayout>
    );
}
