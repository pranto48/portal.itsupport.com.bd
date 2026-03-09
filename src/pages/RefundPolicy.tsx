import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const RefundPolicy = () => {
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

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-sm sm:prose-base max-w-none space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Overview</h2>
            <p>
              At IT Support BD, we want you to be fully satisfied with your purchase. This Refund Policy outlines the conditions under which refunds are granted for our software products (AMPNM and LifeOS) and related services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Eligibility for Refunds</h2>
            <p>You may be eligible for a refund if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your refund request is submitted within <strong>7 days</strong> of the original purchase date.</li>
              <li>The license key has <strong>not been activated</strong> or bound to any installation.</li>
              <li>The software has <strong>not been deployed</strong> (e.g., Docker container has not been started with the license).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Non-Refundable Cases</h2>
            <p>Refunds will <strong>not</strong> be issued in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The license key has already been activated or bound to an installation ID.</li>
              <li>More than 7 days have passed since the purchase date.</li>
              <li>The product was purchased during a promotional or discounted offer (unless otherwise stated).</li>
              <li>The request is due to a change of mind after deployment.</li>
              <li>The customer violated the Terms of Service, leading to license revocation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. How to Request a Refund</h2>
            <p>To request a refund, please follow these steps:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Email us at <a href="mailto:support@itsupport.com.bd" className="text-primary hover:underline">support@itsupport.com.bd</a> with the subject line "Refund Request".</li>
              <li>Include your order ID, license key, and reason for the refund.</li>
              <li>Our team will review your request and respond within <strong>2 business days</strong>.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Refund Processing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Approved refunds are processed within <strong>5–10 business days</strong>.</li>
              <li>Refunds are returned to the original payment method (bKash, Rocket, Nagad, or bank transfer).</li>
              <li>Upon refund approval, the associated license key will be immediately deactivated.</li>
              <li>Any deployed instances using the refunded license must be removed by the customer.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Partial Refunds</h2>
            <p>
              In some cases, partial refunds may be offered at our discretion — for example, if you purchased a multi-device license but only wish to reduce the device count. Contact support to discuss your specific situation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Subscription Renewals</h2>
            <p>
              If your license has an expiration date and auto-renewal is enabled, you may cancel before the renewal date for a full refund of the renewal charge. Cancellations after the renewal date are subject to the standard refund policy above.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Contact Us</h2>
            <p>For refund inquiries or disputes, reach us at:</p>
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

export default RefundPolicy;
