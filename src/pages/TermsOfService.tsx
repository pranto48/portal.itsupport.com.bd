import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-sm sm:prose-base max-w-none space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the IT Support BD portal and related products (AMPNM, LifeOS), you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 18 years of age to use our services.</li>
              <li>One person or entity may not maintain more than one account without prior approval.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. License Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Licenses are granted on a per-device basis as specified by the purchased plan.</li>
              <li>Each license key is bound to a specific installation and may not be transferred without authorization.</li>
              <li>Exceeding the maximum device count will result in license deactivation.</li>
              <li>License keys must not be shared, redistributed, or published publicly.</li>
              <li>We reserve the right to revoke licenses that violate these terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Payments & Billing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices are listed in Bangladeshi Taka (BDT) unless otherwise stated.</li>
              <li>Payments are processed via bKash, Rocket, Nagad, or other approved methods.</li>
              <li>Orders are activated after manual payment verification by our team.</li>
              <li>You agree to provide accurate payment details and authorize the stated charges.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests must be submitted within 7 days of purchase.</li>
              <li>Refunds are only available if the software has not been activated or deployed.</li>
              <li>Once a license key has been bound to an installation, refunds are not available.</li>
              <li>Refunds are processed within 5–10 business days to the original payment method.</li>
              <li>Contact <a href="mailto:support@itsupport.com.bd" className="text-primary hover:underline">support@itsupport.com.bd</a> to request a refund.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reverse-engineer, decompile, or disassemble any of our software products.</li>
              <li>Use the services for illegal activities or to harm others.</li>
              <li>Attempt to bypass license verification or tamper with activation systems.</li>
              <li>Share your account access with unauthorized third parties.</li>
              <li>Overload, disrupt, or interfere with our servers or networks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p>
              All content, software, trademarks, and materials on the portal are the property of IT Support BD. You are granted a limited, non-exclusive, non-transferable license to use our products as intended. No ownership rights are transferred.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect service. We are not liable for downtime caused by factors beyond our control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, IT Support BD shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services, including data loss, business interruption, or loss of profits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms. Upon termination, your license keys will be deactivated and access to the portal will be revoked. You may request account deletion at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. Continued use of our services after changes constitutes acceptance of the updated terms. We will notify registered users of material changes via email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Contact</h2>
            <p>For questions about these terms, reach us at:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:support@itsupport.com.bd" className="text-primary hover:underline">support@itsupport.com.bd</a></li>
              <li>Phone: <a href="tel:+8801915822266" className="text-primary hover:underline">+880 1915-822266</a></li>
              <li>Location: Dhaka, Bangladesh</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
