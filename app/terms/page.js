import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — NrichSouls',
  description: 'Terms of Service for NrichSouls (nrichsouls.in) — the rules and conditions governing your use of our website.',
};

export default function TermsPage() {
  return (
    <>
      <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-slate-300 text-lg">Effective date: 1 January 2025</p>
        </div>
      </section>

      <section className="bg-white py-14 px-4">
        <div className="max-w-3xl mx-auto prose prose-slate prose-headings:font-extrabold prose-h2:text-xl prose-h2:mt-10 prose-p:leading-relaxed prose-li:leading-relaxed">

          <p>
            Welcome to NrichSouls. By accessing or using{' '}
            <a href="https://nrichsouls.in" className="text-indigo-600 hover:underline">nrichsouls.in</a>{' '}
            (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). Please read them carefully.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing the Service, you confirm that you are at least 13 years of age and agree to these Terms. If you do not agree, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            NrichSouls is a personal content blog covering topics in AI &amp; Technology, Career Growth, and Health &amp; Wellness. The Service is operated by Nitin Pandya and provides informational articles, newsletter subscriptions, and related content.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            All content on the Service — including articles, images, graphics, and design — is owned by or licensed to NrichSouls and is protected by applicable copyright and intellectual property laws.
          </p>
          <p>
            You may share or quote brief excerpts for non-commercial purposes provided you attribute NrichSouls and link back to the original article. Republishing full articles without written permission is prohibited.
          </p>

          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to gain unauthorised access to any portion of the Service.</li>
            <li>Scrape, copy, or redistribute content in bulk without permission.</li>
            <li>Post or transmit any harmful, offensive, or misleading content via any contact or subscription feature.</li>
          </ul>

          <h2>5. Newsletter &amp; Communications</h2>
          <p>
            By subscribing to the NrichSouls newsletter you consent to receive periodic email updates. You can unsubscribe at any time by clicking the unsubscribe link in any email or by contacting us directly. We will never sell your email address to third parties.
          </p>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The content on the Service is provided for informational purposes only. It does not constitute professional advice (medical, legal, financial, or otherwise). NrichSouls makes no representations or warranties of any kind, express or implied, about the accuracy, completeness, or suitability of the information.
          </p>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranty of any kind. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, NrichSouls and its owner shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service or reliance on any content provided.
          </p>

          <h2>8. External Links</h2>
          <p>
            The Service may contain links to third-party websites. These links are provided for convenience only. NrichSouls does not endorse and is not responsible for the content or practices of any linked sites.
          </p>

          <h2>9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
          </p>

          <h2>10. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use of the Service after changes are posted constitutes your acceptance.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          </p>

          <h2>12. Contact</h2>
          <p>
            For any questions regarding these Terms, please contact:
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
