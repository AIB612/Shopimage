import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown } from "lucide-react";
import PayPalButton from "./PayPalButton";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ open, onClose, onSuccess }: UpgradeModalProps) {
  const { toast } = useToast();

  const features = [
    "Unlimited image scans",
    "Unlimited image optimizations",
    "Priority processing",
    "WebP conversion",
    "Shopify sync included",
    "Premium support",
  ];

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
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe for $9.99/month
            </p>
            <PayPalButton 
              amount="9.99"
              currency="USD"
              intent="CAPTURE"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by PayPal.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
