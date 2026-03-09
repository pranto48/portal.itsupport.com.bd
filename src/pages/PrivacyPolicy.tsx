import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-sm sm:prose-base max-w-none space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              IT Support BD ("we", "our", or "us") operates the portal at <strong>portal.itsupport.com.bd</strong> and related products including AMPNM and LifeOS. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, and billing address when you create an account.</li>
              <li><strong>Payment Information:</strong> Transaction details processed through bKash, Rocket, Nagad, or other payment providers. We do not store full payment credentials.</li>
              <li><strong>License Data:</strong> License keys, installation IDs, device counts, and activation records tied to your account.</li>
              <li><strong>Usage Data:</strong> Log data, IP addresses, browser type, and interaction patterns when you use our portal or products.</li>
              <li><strong>Support Data:</strong> Messages, attachments, and metadata from support tickets you submit.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and manage your account and licenses.</li>
              <li>To process orders and verify payments.</li>
              <li>To provide technical support and respond to inquiries.</li>
              <li>To send transactional emails (order confirmations, license renewals, security alerts).</li>
              <li>To improve our products, services, and user experience.</li>
              <li>To detect and prevent fraud or unauthorized access.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing & Disclosure</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Hosting, payment processing, and analytics partners who assist in operating our services.</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted data transmission (TLS/SSL), hashed password storage, and access controls. However, no method of electronic storage is 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. License verification logs are retained for security and audit purposes. You may request data deletion by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and receive a copy of your personal data.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and data.</li>
              <li>Withdraw consent for marketing communications.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>
              We use session cookies for authentication and preferences. No third-party advertising cookies are used. You can control cookie settings through your browser.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at:
            </p>
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

export default PrivacyPolicy;
