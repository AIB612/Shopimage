import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Loader2, Zap, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Plan {
  name: string;
  price: number;
  imagesPerMonth: number;
  features: string[];
}

interface PlansResponse {
  plans: {
    free: Plan;
    basic: Plan;
    pro: Plan;
  };
  currentPlan: string;
  usage: {
    imagesOptimized: number;
    limit: number;
  };
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ open, onClose, onSuccess }: UpgradeModalProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Get shop from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get("shop");

  // Fetch plans
  const plansQuery = useQuery<PlansResponse>({
    queryKey: ["/api/billing/plans", shop],
    queryFn: async () => {
      const response = await fetch(`/api/billing/plans?shop=${encodeURIComponent(shop || "")}`);
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
    enabled: open && !!shop,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/billing/subscribe", { shop, plan });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.confirmationUrl) {
        // Redirect to Shopify confirmation page
        window.location.href = data.confirmationUrl;
      } else if (data.success) {
        // Downgrade to free - no redirect needed
        toast({
          title: "Plan Updated",
          description: "Your plan has been updated successfully.",
        });
        onSuccess?.();
        onClose();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (plan: string) => {
    setSelectedPlan(plan);
    subscribeMutation.mutate(plan);
  };

  const plans = plansQuery.data?.plans;
  const currentPlan = plansQuery.data?.currentPlan || "free";

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case "free": return <Zap className="w-5 h-5" />;
      case "basic": return <Sparkles className="w-5 h-5" />;
      case "pro": return <Crown className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planKey: string) => {
    switch (planKey) {
      case "free": return "from-gray-500/10 to-gray-500/5 border-gray-300";
      case "basic": return "from-blue-500/10 to-blue-500/5 border-blue-300";
      case "pro": return "from-primary/10 to-primary/5 border-primary/30";
      default: return "";
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Unlimited";
    return `${limit} images/month`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Select the plan that best fits your store's needs
          </DialogDescription>
        </DialogHeader>

        {plansQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : plansQuery.error ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load plans. Please try again.
          </div>
        ) : plans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {(["free", "basic", "pro"] as const).map((planKey) => {
              const plan = plans[planKey];
              const isCurrentPlan = currentPlan === planKey;
              const isPopular = planKey === "basic";
              const isPro = planKey === "pro";

              return (
                <Card 
                  key={planKey}
                  className={`p-4 relative bg-gradient-to-br ${getPlanColor(planKey)} ${
                    isPro ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500">
                      Popular
                    </Badge>
                  )}
                  {isPro && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      Best Value
                    </Badge>
                  )}

                  <div className="text-center mb-4 pt-2">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      planKey === "free" ? "bg-gray-100 text-gray-600" :
                      planKey === "basic" ? "bg-blue-100 text-blue-600" :
                      "bg-primary/20 text-primary"
                    }`}>
                      {getPlanIcon(planKey)}
                    </div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      {plan.price === 0 ? (
                        <span className="text-2xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold">${plan.price}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatLimit(plan.imagesPerMonth)}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className={`w-4 h-4 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          planKey === "free" ? "bg-gray-200" :
                          planKey === "basic" ? "bg-blue-200" :
                          "bg-primary/30"
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${
                            planKey === "free" ? "text-gray-600" :
                            planKey === "basic" ? "text-blue-600" :
                            "text-primary"
                          }`} />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : isPro ? "default" : "outline"}
                    disabled={isCurrentPlan || subscribeMutation.isPending}
                    onClick={() => handleSubscribe(planKey)}
                  >
                    {subscribeMutation.isPending && selectedPlan === planKey ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrentPlan ? "Current Plan" : 
                     planKey === "free" ? "Downgrade" :
                     currentPlan === "pro" && planKey === "basic" ? "Downgrade" :
                     "Upgrade"}
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : null}

        {plansQuery.data && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current usage this month:</span>
              <span className="font-medium">
                {plansQuery.data.usage.imagesOptimized} / {
                  plansQuery.data.usage.limit === -1 ? "∞" : plansQuery.data.usage.limit
                } images
              </span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          Secure billing through Shopify. Cancel anytime from your Shopify admin.
        </p>
      </DialogContent>
    </Dialog>
  );
}
