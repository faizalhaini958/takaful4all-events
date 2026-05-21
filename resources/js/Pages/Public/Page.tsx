import PublicLayout from '@/Layouts/PublicLayout';
import { Head } from '@inertiajs/react';
import { type Page } from '@/types';
import { BookOpen, Users, Lightbulb, Phone, Mail, MapPin, type LucideIcon } from 'lucide-react';

const POPPINS = "'Poppins', sans-serif";
const INTER   = "'Inter', 'DM Sans', sans-serif";

interface Props {
    page: Page;
    canonicalUrl: string;
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



export default function PageShow({ page, canonicalUrl }: Props) {
    const isAbout   = page.slug === 'about';
    const isContact = page.slug === 'contact';

    return (
        <PublicLayout>
            <Head>
                <title>{`${page.title} | Takaful4All Events`}</title>
                <meta name="description" content={`Learn more about ${page.title} — Takaful4All Events platform by the Malaysian Takaful Association.`} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={`${page.title} | Takaful4All Events`} />
                <meta property="og:description" content={`Learn more about ${page.title} — Takaful4All Events platform by the Malaysian Takaful Association.`} />
                <meta property="og:site_name" content="Takaful4All Events" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${page.title} | Takaful4All Events`} />
                <meta name="twitter:description" content={`Learn more about ${page.title} — Takaful4All Events platform by the Malaysian Takaful Association.`} />
            </Head>
            {/* ── Hero ── */}
            <section className="relative -mt-16 overflow-hidden" style={{ background: '#071B2A' }}>
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, #18C8FF 0%, transparent 70%)' }} />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 text-center" style={{ paddingTop: '7rem' }}>
                    <h1 style={{ fontFamily: POPPINS, color: 'white', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {page.title}
                    </h1>
                    {isContact && (
                        <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.125rem' }}>
                            Get in touch with the Malaysian Takaful Association events team.
                        </p>
                    )}
                    {isAbout && (
                        <p className="mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: INTER, fontSize: '1.125rem' }}>
                            Learn about the Malaysian Takaful Association and what we do.
                        </p>
                    )}
                </div>
            </section>

            {/* ── About content ── */}
            {isAbout && (
                <section className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EBF5FA 0%, #ddeef6 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
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
                                <div key={title} className="bg-white/60 rounded-2xl p-6 text-center hover:shadow-md transition-shadow" style={{ border: '1px solid #c8dfe8' }}>
                                    <div className="flex justify-center mb-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e6f6fb 0%, #d0eef8 100%)', border: '1px solid #b8d5e2' }}>
                                            <Icon className="w-7 h-7" style={{ color: '#009FBB' }} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <h3 style={{ fontFamily: POPPINS, color: '#071B2A', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-gray-500 italic pt-8" style={{ borderTop: '1px solid #c8dfe8' }}>
                            These gatherings play a crucial role in fostering collaboration, innovation, and progress within the takaful sector.
                        </p>
                    </div>
                </section>
            )}

            {/* ── Contact content ── */}
            {isContact && (
                <section className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EBF5FA 0%, #ddeef6 100%)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 space-y-14">

                    {/* Contact cards */}
                    <div>
                        <h2 className="text-xl font-bold text-brand-navy uppercase tracking-widest mb-6 text-center">Contact Us</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CONTACTS.map(c => (
                                <div key={c.category} className="bg-white/60 rounded-2xl p-6 hover:shadow-md transition-shadow" style={{ border: '1px solid #c8dfe8' }}>
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
                                        <label className="block text-xs font-medium text-gray-500 dark:text-muted-foreground mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            className="w-full rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-sm text-gray-900 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-muted-foreground mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-sm text-gray-900 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-muted-foreground mb-1">Subject</label>
                                    <input
                                        type="text"
                                        placeholder="How can we help?"
                                        className="w-full rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-sm text-gray-900 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-muted-foreground mb-1">Message</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Write your message here..."
                                        className="w-full rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card px-4 py-2.5 text-sm text-gray-900 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition resize-none"
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
                </section>
            )}

            {/* ── Generic page content ── */}
            {!isAbout && !isContact && (
                <section className="relative z-10 -mt-10 rounded-t-3xl rounded-b-3xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #EBF5FA 0%, #ddeef6 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,100,140,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
                        {page.content_html ? (
                            <article
                                className="prose prose-lg max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: page.content_html }}
                            />
                        ) : (
                            <p className="text-gray-500">No content available.</p>
                        )}
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}
