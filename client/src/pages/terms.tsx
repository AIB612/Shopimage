import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">💧</span>
            <span className="text-xl font-bold text-violet-700">Shopimage</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-gray-600 hover:text-violet-700">Pricing</Link>
          <a 
            href="https://apps.shopify.com/shopimage" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-violet-600 hover:bg-violet-700">
              Install Free
            </Button>
          </a>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: February 10, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By installing or using Shopimage ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              Shopimage provides image optimization services for e-commerce stores, including image compression, WebP conversion, and performance analysis. The service is available as a Shopify app and Chrome browser extension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            <p className="text-gray-600 mb-3">When using Shopimage, you agree to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Provide accurate information about your store</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Subscription and Billing</h2>
            <p className="text-gray-600 mb-3">Our service offers free and paid subscription plans:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Free plan: Limited to 50 images per month</li>
              <li>Paid plans: Billed monthly via PayPal</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are handled on a case-by-case basis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p className="text-gray-600 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Use the service for any illegal purpose</li>
              <li>Upload malicious content or malware</li>
              <li>Attempt to reverse engineer the service</li>
              <li>Resell or redistribute the service without permission</li>
              <li>Abuse API rate limits or overload our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              You retain ownership of your images. By using our service, you grant us a limited license to process your images for optimization purposes only. We do not claim ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Service Availability</h2>
            <p className="text-gray-600 leading-relaxed">
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect availability. We are not liable for any losses due to service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              Shopimage is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate your access to the service at any time for violation of these terms. You may cancel your subscription at any time through your account settings or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms are governed by the laws of Switzerland. Any disputes shall be resolved in the courts of Zurich, Switzerland.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-violet-600 font-medium mt-2">
              support@shopimage.app
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💧</span>
                <span className="text-xl font-bold text-white">Shopimage</span>
              </div>
              <p className="text-sm">
                The fastest way to optimize your Shopify store images.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><a href="https://apps.shopify.com/shopimage" className="hover:text-white">Shopify App</a></li>
                <li><a href="#" className="hover:text-white">Chrome Extension</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@shopimage.app" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2026 Shopimage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
