import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, Zap, Crown, Sparkles, CreditCard, Loader2 } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ open, onClose, onSuccess }: UpgradeModalProps) {
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "credits">("pro");
  const [selectedCredits, setSelectedCredits] = useState(100);
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (selectedPlan === "pro") {
        const response = await apiRequest("POST", "/api/stripe/checkout", { email });
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/stripe/buy-credits", { 
          email, 
          credits: selectedCredits 
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    checkoutMutation.mutate();
  };

  const features = [
    "Unlimited image scans",
    "Up to 500 optimizations/month",
    "Priority processing",
    "WebP conversion",
    "Shopify sync included",
    "Premium support",
  ];

  const creditPackages = [
    { credits: 50, price: "$4.99", perImage: "$0.10" },
    { credits: 100, price: "$8.99", perImage: "$0.09" },
    { credits: 500, price: "$29.99", perImage: "$0.06" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
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

        <div className="flex gap-2 mt-4">
          <Button 
            variant={selectedPlan === "pro" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setSelectedPlan("pro")}
            data-testid="button-plan-pro"
          >
            <Zap className="w-4 h-4 mr-2" />
            Pro Plan
          </Button>
          <Button 
            variant={selectedPlan === "credits" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setSelectedPlan("credits")}
            data-testid="button-plan-credits"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Buy Credits
          </Button>
        </div>

        {selectedPlan === "pro" && (
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
        )}

        {selectedPlan === "credits" && (
          <div className="space-y-3 mt-4">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.credits}
                className={`p-4 cursor-pointer transition-all ${
                  selectedCredits === pkg.credits 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedCredits(pkg.credits)}
                data-testid={`card-credits-${pkg.credits}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedCredits === pkg.credits 
                        ? "border-primary bg-primary" 
                        : "border-muted-foreground"
                    }`} />
                    <div>
                      <div className="font-semibold">{pkg.credits} Credits</div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.perImage} per image
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{pkg.price}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-checkout-email"
            />
          </div>

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleCheckout}
            disabled={checkoutMutation.isPending}
            data-testid="button-checkout"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {selectedPlan === "pro" 
              ? "Subscribe - $9.99/month" 
              : `Buy ${selectedCredits} Credits`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
