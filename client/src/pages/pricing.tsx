import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";

export default function Pricing() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Optimize your Shopify store images and boost p
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 border-2">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <div className="text-4xl font-bold mb-2">$0</div>
              <p className="text-muted-foreground">Forever free</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>5 image optimizations per scan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>WebP conversion</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Image analysis report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Basic support</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <a href="/">Get Started</a>
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="text-4xl font-bold mb-2">$9.99</div>
              <p className="text-muted-foreground">per month</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span><strong>Unlimited</strong> image optimizations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>WebP conversion</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Detailed analysis report</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Bulk optimization</span>
              </li>
            </ul>
            <Button className="w-full" asChild>
              <a href="/">Start Free Trial</a>
            </Button>
          </Card>
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>All plans include a 14-day money-back guarantee</p>
        </div>
      </div>
    </PageLayout>
  );
}
