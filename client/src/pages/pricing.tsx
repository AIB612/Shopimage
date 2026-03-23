import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const monthlyPrice = 9.99;
  const annualMonthlyPrice = 7.99;
  const annualTotal = (annualMonthlyPrice * 12).toFixed(2);

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Optimize your Shopify store images and boost page speed.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-white shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-white shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <Badge variant="secondary" className="text-xs font-bold text-green-700 bg-green-100">
                Save 20%
              </Badge>
            </button>
          </div>
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
              {billingCycle === "monthly" ? (
                <>
                  <div className="text-4xl font-bold mb-2">${monthlyPrice}</div>
                  <p className="text-muted-foreground">per month</p>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold mb-2">${annualMonthlyPrice}</div>
                  <p className="text-muted-foreground">
                    per month &mdash; billed ${annualTotal}/year
                  </p>
                </>
              )}
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-700 border-0 font-semibold">
                  3-day free trial
                </Badge>
              </div>
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
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Cancel anytime</span>
              </li>
            </ul>
            <Button className="w-full" asChild>
              <a href="/">Start 3-Day Free Trial</a>
            </Button>
            {billingCycle === "annual" && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                Billed as ${annualTotal}/year. Cancel anytime.
              </p>
            )}
          </Card>
        </div>

        <div className="text-center mt-12 space-y-2 text-muted-foreground">
          <p>All Pro plans include a <strong>3-day free trial</strong>. No credit card charge until trial ends.</p>
          <p>All plans include a 14-day money-back guarantee.</p>
        </div>
      </div>
    </PageLayout>
  );
}
