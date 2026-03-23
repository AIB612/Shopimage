import { PageLayout } from "@/components/PageLayout";

export default function Privacy() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 10, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Shopimage ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Shopify application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">When you install and use Shopimage, we may collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Store domain and name</li>
              <li>Product image URLs and metadata (file sizes, dimensions)</li>
              <li>Usage data (scans performed, images optimized)</li>
              <li>Payment information (processed securely via PayPal)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use the collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Analyze and optimize your store's product images</li>
              <li>Provide image compression and WebP conversion services</li>
              <li>Track usage for billing purposes</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using industry-standard encryption. We use PostgreSQL databases hosted on secure servers. We do not sell, trade, or rent your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
            <p className="text-muted-foreground mb-2">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Shopify:</strong> To access your store data via their Admin API</li>
              <li><strong>PayPal:</strong> To process subscription payments</li>
              <li><strong>Render:</strong> To host our application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your app is installed. Upon uninstallation, we will delete your store data within 30 days, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Uninstall the app at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. GDPR Compliance</h2>
            <p className="text-muted-foreground">
              For users in the European Economic Area (EEA), we comply with GDPR requirements. We process data based on your consent when you install our app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Email:</strong> support@shopimage.app
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
