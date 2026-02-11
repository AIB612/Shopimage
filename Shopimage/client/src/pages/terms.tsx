export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 10, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By installing and using Shopimage ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Shopimage is a Shopify application that analyzes and optimizes product images to improve store performance. The App scans your store's images, identifies oversized files, and provides WebP conversion and compression services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Pricing and Billing</h2>
            <p className="text-muted-foreground mb-2">Shopimage offers the following plans:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Free Plan:</strong> 5 free image optimizations per scan</li>
              <li><strong>Pro Plan:</strong> $9.99/month for unlimited optimizations</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Payments are processed securely through PayPal. Subscriptions renew automatically unless cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
            <p className="text-muted-foreground mb-2">You agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide accurate store information</li>
              <li>Use the App only for lawful purposes</li>
              <li>Not attempt to reverse engineer or exploit the App</li>
              <li>Maintain the security of your Shopify account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Image Processing</h2>
            <p className="text-muted-foreground">
              When you optimize images through our App, we process and compress them using industry-standard techniques. Original images can be backed up before optimization. We are not responsible for any unintended changes to image quality that may occur during compression.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              You retain all rights to your images and store content. Shopimage does not claim ownership of any content processed through the App. Our App, including its code, design, and branding, remains our intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Shopimage is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount you paid for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to maintain high availability but do not guarantee uninterrupted service. We may perform maintenance or updates that temporarily affect availability. We reserve the right to modify or discontinue the service with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cancellation and Refunds</h2>
            <p className="text-muted-foreground">
              You may cancel your subscription at any time through PayPal or by uninstalling the App. Refunds are handled on a case-by-case basis. Please contact us within 14 days of purchase for refund requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your access to the App at any time for violation of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms of Service from time to time. Continued use of the App after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the laws of Switzerland, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Email:</strong> support@shopimage.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
