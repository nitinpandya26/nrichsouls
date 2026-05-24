import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — NrichSouls',
  description: 'Privacy Policy for NrichSouls (nrichsouls.in) — how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-slate-300 text-lg">Effective date: 1 January 2025</p>
        </div>
      </section>

      <section className="bg-white py-14 px-4">
        <div className="max-w-3xl mx-auto prose prose-slate prose-headings:font-extrabold prose-h2:text-xl prose-h2:mt-10 prose-p:leading-relaxed prose-li:leading-relaxed">

          <p>
            NrichSouls (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{' '}
            <a href="https://nrichsouls.in" className="text-indigo-600 hover:underline">nrichsouls.in</a> (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, and protect information when you visit our website or use our services.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            <strong>Information you provide voluntarily.</strong> If you subscribe to our newsletter or contact us via the contact form, we collect your email address and any message content you submit.
          </p>
          <p>
            <strong>Automatically collected data.</strong> Like most websites, we may collect standard web log information such as your IP address, browser type, and pages visited, solely to maintain security and improve performance. We do not use this data to personally identify you.
          </p>
          <p>
            <strong>No account registration required.</strong> NrichSouls does not require visitors to create user accounts. We do not collect passwords, payment information, or sensitive personal data from readers.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To send you the newsletter you subscribed to (you may unsubscribe at any time).</li>
            <li>To respond to enquiries submitted via the contact form.</li>
            <li>To monitor and improve the performance and security of the website.</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to third parties.</p>

          <h2>3. Instagram &amp; Meta Platform Data</h2>
          <p>
            NrichSouls uses the Meta (Facebook / Instagram) Graph API exclusively to publish content to our own Instagram account (<strong>@nrichsouls</strong>). This integration is used only by the site administrator (Nitin Pandya) and is not accessible to website visitors.
          </p>
          <ul>
            <li>We request the <code>instagram_content_publish</code> permission solely to post photos and carousels to our own Instagram page.</li>
            <li>We do not access, store, or process the personal data of any Instagram user other than our own account.</li>
            <li>No visitor data is shared with Meta/Instagram in connection with this integration.</li>
            <li>Access tokens obtained via the Meta platform are stored securely in an encrypted database and are never exposed to website visitors.</li>
          </ul>

          <h2>4. Cookies</h2>
          <p>
            NrichSouls may use essential cookies to enable basic site functionality (e.g., security tokens). We do not use advertising cookies or third-party tracking cookies. You can disable cookies in your browser settings; this will not significantly affect your ability to read content on our site.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>
            Our website may contain links to external sites. We are not responsible for the privacy practices of those sites and encourage you to review their policies separately.
          </p>
          <p>
            We use <strong>Supabase</strong> (database-as-a-service) to store blog content and newsletter subscriptions. Supabase stores data in secure, SOC 2–compliant infrastructure. No personal visitor data is shared with Supabase beyond what is necessary to operate the newsletter feature.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            Newsletter subscriber email addresses are retained until you unsubscribe. Contact form messages may be retained for up to 12 months for correspondence purposes and then deleted.
          </p>

          <h2>7. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of any personal data we hold about you by contacting us at the email below. We will respond within 30 days.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            Our Service is not directed at children under the age of 13. We do not knowingly collect personal information from children.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated effective date. Continued use of the Service after changes are posted constitutes acceptance of the updated policy.
          </p>

          <h2>10. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul>
            <li>Email: <a href="mailto:nitinpandya26@gmail.com" className="text-indigo-600 hover:underline">nitinpandya26@gmail.com</a></li>
            <li>Website: <Link href="/contact" className="text-indigo-600 hover:underline">nrichsouls.in/contact</Link></li>
          </ul>
        </div>
      </section>
    </>
  );
}
