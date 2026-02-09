import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, CreditCard, ShoppingBag } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  shopDomain?: string;
}

export function UpgradeModal({ open, onClose, onSuccess, shopDomain }: UpgradeModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"shopify" | "paypal" | null>(null);
  const [loading, setLoading] = useState(false);

  const features = [
    "Unlimited image scans",
    "Unlimited image optimizations",
    "Priority processing",
    "WebP conversion",
    "Shopify sync included",
    "Premium support",
  ];

  const handleShopifySubscribe = async () => {
    if (!shopDomain) {
      toast({
        title: "Store not connected",
        description: "Please connect your Shopify store first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/shopify/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: shopDomain }),
      });

      const data = await response.json();

      if (data.confirmationUrl) {
        // Redirect to Shopify billing approval page
        window.location.href = data.confirmationUrl;
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    toast({
      title: "Payment Successful!",
      description: "Welcome to Pro! You now have unlimited optimization.",
    });
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handlePaymentError = (error: any) => {
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again.",
      variant: "destructive",
    });
  };

  const resetPaymentMethod = () => {
    setPaymentMethod(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetPaymentMethod(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center">
            Unlock unlimited image optimization for your store
          </DialogDescription>
        </DialogHeader>

        <Card className="p-4 mt-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Pro Monthly</h3>
              <p className="text-sm text-muted-foreground">Billed monthly</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">$9.99</div>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          </div>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4 mt-4">
          {/* Payment method selection */}
          {!paymentMethod && (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground mb-2">
                Choose your payment method
              </p>
              
              {/* Shopify Billing Option */}
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 hover:border-primary hover:bg-primary/5"
                onClick={() => setPaymentMethod("shopify")}
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Shopify Billing</div>
                  <div className="text-xs text-muted-foreground">Billed through your Shopify account</div>
                </div>
              </Button>

              {/* PayPal Option */}
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 hover:border-primary hover:bg-primary/5"
                onClick={() => setPaymentMethod("paypal")}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">PayPal</div>
                  <div className="text-xs text-muted-foreground">Pay with PayPal or credit card</div>
                </div>
              </Button>
            </div>
          )}

          {/* Shopify Billing */}
          {paymentMethod === "shopify" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPaymentMethod}
                className="text-muted-foreground"
              >
                ← Back to payment options
              </Button>
              
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Subscribe through Shopify Billing.<br />
                  Charges will appear on your Shopify invoice.
                </p>
                <Button
                  onClick={handleShopifySubscribe}
                  disabled={loading || !shopDomain}
                  className="w-full max-w-xs"
                  size="lg"
                >
                  {loading ? "Processing..." : "Subscribe with Shopify"}
                </Button>
                {!shopDomain && (
                  <p className="text-xs text-destructive mt-2">
                    Please connect your store first
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PayPal */}
          {paymentMethod === "paypal" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPaymentMethod}
                className="text-muted-foreground"
              >
                ← Back to payment options
              </Button>
              
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  One-time payment of $9.99
                </p>
                <PayPalButton 
                  amount="9.99"
                  currency="USD"
                  intent="CAPTURE"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {paymentMethod === "shopify" 
              ? "Managed by Shopify. Cancel anytime from your Shopify admin."
              : paymentMethod === "paypal"
              ? "Secure payment powered by PayPal."
              : "Choose your preferred payment method above."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
