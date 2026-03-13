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
import { Check, Crown, ShoppingBag } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  shopDomain?: string;
}

export function UpgradeModal({ open, onClose, onSuccess, shopDomain }: UpgradeModalProps) {
  const { toast } = useToast();
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
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
              <p className="text-sm text-muted-foreground">Billed monthly via Shopify</p>
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

          <p className="text-center text-xs text-muted-foreground">
            Managed by Shopify. Cancel anytime from your Shopify admin.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
