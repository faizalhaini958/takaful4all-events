<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'title'        => 'About Us',
                'slug'         => 'about',
                'content_html' => '<section><h2>About the Malaysian Takaful Association</h2><p>The <strong>Malaysian Takaful Association (MTA)</strong> is the national trade association representing the takaful (Islamic insurance) industry in Malaysia. Established to promote the growth, development, and awareness of the takaful industry, MTA serves as the unified voice for all takaful operators in the country.</p><p>With a membership comprising all licensed takaful operators in Malaysia, MTA works closely with regulatory bodies such as <strong>Bank Negara Malaysia (BNM)</strong> and the Ministry of Finance to shape policy and create a conducive environment for the takaful sector to flourish.</p></section>',
                'is_published' => true,
            ],
            [
                'title'        => 'Contact Us',
                'slug'         => 'contact',
                'content_html' => '<section><h2>Get in Touch</h2><p>We welcome enquiries from industry stakeholders, media, and the public.</p><p><strong>Malaysian Takaful Association</strong><br>Level 29, Menara Takaful Malaysia<br>No. 4, Jalan Sultan Sulaiman<br>50000 Kuala Lumpur, Malaysia</p><p>Email: <a href="mailto:info@malaysiantakaful.com.my">info@malaysiantakaful.com.my</a><br>Tel: +603 2031 8084</p></section>',
                'is_published' => true,
            ],
            [
                'title'        => 'Terms & Conditions',
                'slug'         => 'terms',
                'content_html' => '<section>
<p>Welcome to events.takaful4all.org for online event registration. Terms and conditions stated below applies to all visitors and users of events.takaful4all.org. You are bound by these terms and conditions if you\'re on events.takaful4all.org.</p>

<h2>General</h2>
<p>The content of terms and conditions may be change, move, or delete at any time. Please note that events.takaful4all.org have the rights to change the contents of the terms and conditions without any notice. Any violation of rules and regulations of these terms and conditions, events.takaful4all.org will take immediate actions against the offender(s).</p>

<h2>Site Contents &amp; Copyrights</h2>
<p>Unless otherwise noted, all materials, including images, illustrations, designs, icons, photographs, video clips, and written and other materials that appear as part of this Site, in other words "Contents of the Site" are copyrights, trademarks, trade dress and/or other intellectual properties owned, controlled, or licensed by Persatuan Takaful Malaysia (Takaful4all).</p>

<h2>Comments and Feedbacks</h2>
<p>All comments and feedbacks to Persatuan Takaful Malaysia (Takaful4all) will be remain at <a href="mailto:enquiries@malaysiantakaful.com.my">enquiries@malaysiantakaful.com.my</a>. User shall agree that there will be no comment(s) submitted to the events.takaful4all.org will violate any rights of any third party, including copyrights, trademarks, privacy of other personal or proprietary right(s). Furthermore, the user shall agree there will not be content of unlawful, abusive, or obscene material(s) submitted to the site. User will be the only one responsible for any comment\'s content made.</p>

<h2>Product Information</h2>
<p>We cannot guarantee all actual products will be the same shown on the monitor as that is depending on the user monitor.</p>

<h2>Newsletter</h2>
<p>User shall agree that events.takaful4all.org may send newsletter regarding the latest news/products/promotions etc through email to the user.</p>

<h2>Indemnification</h2>
<p>The user shall agree to defend, indemnify, and hold Takaful4all.org harmless from and against any and all claims, damages, costs and expenses, including attorneys\' fees, arising from or related to your use of the Site.</p>

<h2>Link to Other Sites</h2>
<p>Any access link to third party sites is at your own risk. events.takaful4all.org will not be related or involved in any such website if the user\'s content/product(s) got damaged or loss have any connection with a third party site.</p>

<h2>Inaccuracy Information</h2>
<p>From time to time, there may be information on events.takaful4all.org that contains typographical error, inaccuracies, omissions, that may relate to product description, pricing, availability, and article contents. We reserve the rights to correct any errors, inaccuracies, change or edit information without prior notice to the customers. If you are not satisfied with your purchased product(s), please return it back to us with the invoice.</p>

<h2>Termination</h2>
<p>This agreement is effective unless and until either by the customer or events.takaful4all.org. Customer may terminate this agreement at any time. However, events.takaful4all.org may also terminate the agreement with the customer without any prior notice and will be denying the access of the customer who is unable to comply the terms and conditions above.</p>

<h2>Refund Policy</h2>
<p>Your full refund will be issued once we have received and examined the returned goods at our return center.</p>

<h2>Shipping and Delivery Policy</h2>
<ul>
<li>Items in stock: 2–5 working days for Standard Delivery items.</li>
<li>Items that are out of stock: Please email or call us for assistance.</li>
</ul>

<h2>Payments</h2>
<p>All Goods purchased are subject to a one-time payment. Payment can be made through various payment methods we have available, such as Visa, MasterCard or online payment methods. Payment cards (credit cards or debit cards) are subject to validation checks and authorization by your card issuer. If we do not receive the required authorization, we will not be liable for any delay or non-delivery of your Order.</p>
</section>',
                'is_published' => true,
            ],
            [
                'title'        => 'Privacy Policy',
                'slug'         => 'privacy-policy',
                'content_html' => '<section><h2>Privacy Policy</h2><p>The Malaysian Takaful Association is committed to protecting the privacy of your personal data in accordance with the <strong>Personal Data Protection Act 2010 (PDPA)</strong>.</p><h3>Data We Collect</h3><p>We may collect personal information such as your name, email address, and phone number when you register for events or contact us.</p><h3>How We Use Your Data</h3><p>Your data is used solely for event registration, communications related to MTA activities, and improving our services.</p></section>',
                'is_published' => true,
            ],
            [
                'title'        => 'Cancellation & Refund Policy',
                'slug'         => 'cancellation-refund',
                'content_html' => '<section><h2>Cancellation & Refund Policy</h2><p>We understand that plans can change. Please review our cancellation and refund policy below.</p><h3>Event Registration Cancellations</h3><ul><li><strong>More than 14 days before the event:</strong> Full refund minus a 10% administrative fee.</li><li><strong>7–14 days before the event:</strong> 50% refund.</li><li><strong>Less than 7 days before the event:</strong> No refund. Substitutions are permitted.</li></ul><h3>How to Cancel</h3><p>Please contact us at <a href="mailto:events@malaysiantakaful.com.my">events@malaysiantakaful.com.my</a> with your registration details.</p></section>',
                'is_published' => true,
            ],
        ];

        foreach ($pages as $data) {
            Page::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
