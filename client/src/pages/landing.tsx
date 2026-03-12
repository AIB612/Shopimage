import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💧</span>
          <span className="text-xl font-bold text-violet-700">Shopimage</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-gray-600 hover:text-violet-700">Pricing</Link>
          <Link href="/faq" className="text-gray-600 hover:text-violet">FAQ</Link>
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

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="inline-block px-4 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
          🚀 Boost your store speed by 70%
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Optimize Images.<br />
          <span className="text-violet-600">Accelerate Sales.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Automatically compress and convert your Shopify product images to WebP. 
          Faster loading = better SEO = more conversions.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a 
            href="https://apps.shopify.com/shopimage" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6">
              Start Free Trial
            </Button>
          </a>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Pricing
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">No credit card required • 50 free images/month</p>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-violet-600">70%</div>
            <div className="text-gray-600">Smaller Files</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-violet-600">2x</div>
            <div className="text-gray-600">Faster Loading</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-violet-600">+15%</div>
            <div className="text-gray-600">SEO Boost</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-violet-600">1-Click</div>
            <div className="text-gray-600">Optimization</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Why Shopimage?</h2>
        <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Everything you need to optimize your store's images in one simple app.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Bulk optimize hundreds of images in seconds. Our smart compression maintains quality while reducing file size by up to 80%.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">WebP Conversion</h3>
            <p className="text-gray-600">
              Automatically convert to WebP format - the modern image format that loads faster and ranks better on Google.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">Auto-Sync</h3>
            <p className="text-gray-600">
              Optimized images sync directly to your Shopify store. No manual uploads, no hassle.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">
              Track your savings with detailed reports. See exactly how much bandwidth and storage you're saving.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600">
              Original images are preserved. Restore anytime with one click. Your data stays private.
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🧩</div>
            <h3 className="text-xl font-semibold mb-2">Chrome Extension</h3>
            <p className="text-gray-600">
              Optimize images from any website with our free browser extension. Perfect for dropshipping.
            </p>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-violet-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-600 text-center mb-12">Three simple steps to faster images</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Install App</h3>
              <p className="text-gray-600">Add Shopimage to your Shopify store in one click</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Scan Images</h3>
              <p className="text-gray-600">We analyze all your product images automatically</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Optimize</h3>
              <p className="text-gray-600">One click to compress and convert to WebP</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-gray-600 text-center mb-12">Start free, upgrade when you need more</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card className="p-8 border-2 hover:border-violet-200 transition-colors">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-gray-500">/mo</span></div>
            <ul className="space-y-3 mb-6 text-gray-600">
              <li className="flex items-center gap-2">✅ 50 images/month</li>
              <li className="flex items-center gap-2">✅ WebP conversion</li>
              <li className="flex items-center gap-2">✅ Basic compression</li>
              <li className="flex items-center gap-2">✅ Chrome extension</li>
            </ul>
            <a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer">
              <Button className="w-full" variant="outline">Get Started</Button>
            </a>
          </Card>
          <Card className="p-8 border-2 border-violet-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-3 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-4">$9.99<span className="text-lg text-gray-500">/mo</span></div>
            <ul className="space-y-3 mb-6 text-gray-600">
              <li className="flex items-center gap-2">✅ Unlimited images</li>
              <li className="flex items-center gap-2">✅ Advanced compression</li>
              <li className="flex items-center gap-2">✅ Priority processing</li>
              <li className="flex items-center gap-2">✅ Bulk optimization</li>
              <li className="flex items-center gap-2">✅ Analytics dashboard</li>
            </ul>
            <a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-violet-600 hover:bg-violet-700">Start Free Trial</Button>
            </a>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-violet-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Speed Up Your Store?
          </h2>
          <p className="text-violet-100 mb-8 text-lg">
            Join thousands of Shopify merchants who trust Shopimage
          </p>
          <a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 text-lg px-8 py-6">
              Install Shopimage Free
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💧</span>
                <span className="text-xl font-bold text-white">Shopimage</span>
              </div>
              <p className="text-sm">
                The fastest way to optimize your Shopify store images. Boost speed, SEO, and conversions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer" className="hover:text-white">Shopify App Store</a></li>
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
                <li><Link href="/faq" className="hover:text-white">Help Center</Link></li>
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
