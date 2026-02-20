import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Pricing() {
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
          <Link href="/pricing" className="text-violet-700 font-medium">Pricing</Link>
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
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-600">
            Optimize your store images and boost performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 border-2 hover:border-violet-200 transition-colors">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
              <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
              <p className="text-gray-500">Forever free</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>50 images per month</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>WebP conversion</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Basic compression</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Chrome extension</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Basic support</span>
              </li>
            </ul>
            <a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full">Get Started</Button>
            </a>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-2 border-violet-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-violet-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro</h2>
              <div className="text-4xl font-bold text-gray-900 mb-2">$9.99</div>
              <p className="text-gray-500">per month</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span><strong>Unlimited</strong> images</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Advanced compression (80%+)</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Priority processing</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Bulk optimization</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Analytics dashboard</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-violet-600" />
                <span>Priority support</span>
              </li>
            </ul>
            <a href="https://apps.shopify.com/shopimage" target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-violet-600 hover:bg-violet-700">Start Free Trial</Button>
            </a>
          </Card>
        </div>

        <div className="text-center mt-12 text-gray-500">
          <p>All plans include a 14-day money-back guarantee</p>
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
