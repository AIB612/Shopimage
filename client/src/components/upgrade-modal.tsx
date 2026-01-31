import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap, Crown, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const features = [
    "Unlimited image optimizations",
    "Priority processing speed",
    "Bulk optimization support",
    "Auto-sync with store updates",
    "Backup & restore capability",
    "Premium support",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center">
            You've used all 3 free optimizations today. Upgrade to Pro for unlimited access.
          </DialogDescription>
        </DialogHeader>

        <Card className="p-6 mt-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-foreground mb-1">
              $9.99
              <span className="text-lg font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full gap-2" size="lg" data-testid="button-upgrade">
            <Sparkles className="w-4 h-4" />
            Upgrade Now
          </Button>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Secure payment powered by Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
}
