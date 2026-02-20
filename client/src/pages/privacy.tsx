import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Privacy() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: February 10, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Shopimage ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Shopify application and Chrome extension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="text-gray-600 mb-3">When you install and use Shopimage, we may collect:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Store domain and name</li>
              <li>Product image URLs and metadata (file sizes, dimensions)</li>
              <li>Usage data (scans performed, images optimized)</li>
              <li>Payment information (processed securely via PayPal)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-3">We use the collected information to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Analyze and optimize your store's product images</li>
              <li>Provide image compression and WebP conversion services</li>
              <li>Track usage for billing purposes</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-gray-600 leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use PostgreSQL databases hosted on secure servers. We do not sell, trade, or rent your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <p className="text-gray-600 mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li><strong>Shopify:</strong> To access your store data via their Admin API</li>
              <li><strong>PayPal:</strong> To process subscription payments</li>
              <li><strong>Google PageSpeed API:</strong> To analyze page performance</li>
              <li><strong>Render:</strong> To host our application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Chrome Extension</h2>
            <p className="text-gray-600 leading-relaxed">
              Our Chrome extension only accesses image data on pages you actively scan. We do not track your browsing history or collect data from pages you don't explicitly analyze.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your app is installed. Upon uninstallation, we will delete your store data within 30 days, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="text-gray-600 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Uninstall the app at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. GDPR Compliance</h2>
            <p className="text-gray-600 leading-relaxed">
              For users in the European Economic Area (EEA), we comply with GDPR requirements. We process data based on your consent when you install our app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
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
