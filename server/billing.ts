import { Request, Response } from "express";
import { storage } from "./storage";

const { SHOPIFY_API_KEY } = process.env;

// Plan configuration
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    imagesPerMonth: 50,
    features: ["Scan up to 50 images/month", "Basic optimization", "Manual sync"],
  },
  basic: {
    name: "Basic",
    price: 9.99,
    imagesPerMonth: 500,
    features: ["Scan up to 500 images/month", "Advanced optimization", "Auto-sync to Shopify", "Priority support"],
  },
  pro: {
    name: "Pro",
    price: 29.99,
    imagesPerMonth: -1, // unlimited
    features: ["Unlimited images", "Advanced optimization", "Auto-sync to Shopify", "Priority support", "Bulk operations"],
  },
} as const;

export type PlanType = keyof typeof PLANS;

function getBaseUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  return "http://localhost:5000";
}

// Create a recurring subscription charge via Shopify GraphQL API
export async function createSubscription(
  shop: string,
  accessToken: string,
  plan: PlanType
): Promise<{ confirmationUrl: string; chargeId: string } | null> {
  if (plan === "free") {
    return null;
  }

  const planConfig = PLANS[plan];
  const baseUrl = getBaseUrl();
  const returnUrl = `${baseUrl}/api/billing/callback?shop=${encodeURIComponent(shop)}`;

  const mutation = `
    mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        lineItems: $lineItems
        test: ${process.env.NODE_ENV !== "production"}
      ) {
        appSubscription {
          id
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name: `Shopimage ${planConfig.name} Plan`,
    returnUrl,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: planConfig.price,
              currencyCode: "USD",
            },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ],
  };

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = await response.json() as any;
    
    if (data.errors || data.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      console.error("Subscription creation error:", data.errors || data.data?.appSubscriptionCreate?.userErrors);
      return null;
    }

    const { appSubscription, confirmationUrl } = data.data.appSubscriptionCreate;
    
    return {
      confirmationUrl,
      chargeId: appSubscription.id,
    };
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return null;
  }
}

// Get current subscription status
export async function getSubscriptionStatus(
  shop: string,
  accessToken: string
): Promise<{ status: string; currentPeriodEnd?: Date } | null> {
  const query = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          currentPeriodEnd
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json() as any;
    const subscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
    
    if (subscriptions.length === 0) {
      return { status: "none" };
    }

    const activeSubscription = subscriptions[0];
    return {
      status: activeSubscription.status,
      currentPeriodEnd: activeSubscription.currentPeriodEnd 
        ? new Date(activeSubscription.currentPeriodEnd) 
        : undefined,
    };
  } catch (error) {
    console.error("Failed to get subscription status:", error);
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(
  shop: string,
  accessToken: string,
  subscriptionId: string
): Promise<boolean> {
  const mutation = `
    mutation AppSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ 
        query: mutation, 
        variables: { id: subscriptionId } 
      }),
    });

    const data = await response.json() as any;
    
    if (data.data?.appSubscriptionCancel?.userErrors?.length > 0) {
      console.error("Cancel subscription error:", data.data.appSubscriptionCancel.userErrors);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return false;
  }
}

// API Routes

// GET /api/billing/plans - Get available plans
export async function handleGetPlans(req: Request, res: Response) {
  const shop = req.query.shop as string;
  
  if (!shop) {
    return res.status(400).json({ error: "Missing shop parameter" });
  }

  const shopData = await storage.getShopByDomain(shop);
  
  res.json({
    plans: PLANS,
    currentPlan: shopData?.plan || "free",
    usage: {
      imagesOptimized: shopData?.imagesOptimizedThisMonth || 0,
      limit: PLANS[shopData?.plan as PlanType || "free"].imagesPerMonth,
    },
  });
}

// POST /api/billing/subscribe - Create subscription
export async function handleSubscribe(req: Request, res: Response) {
  try {
    const { shop, plan } = req.body;

    if (!shop || !plan) {
      return res.status(400).json({ error: "Missing shop or plan parameter" });
    }

    if (!PLANS[plan as PlanType]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const shopData = await storage.getShopByDomain(shop);
    
    if (!shopData || !shopData.accessToken) {
      return res.status(401).json({ error: "Shop not installed" });
    }

    // If downgrading to free, just update the plan
    if (plan === "free") {
      await storage.updateShopPlan(shopData.id, "free", null);
      return res.json({ success: true, plan: "free" });
    }

    // Create Shopify subscription
    const result = await createSubscription(shop, shopData.accessToken, plan as PlanType);
    
    if (!result) {
      return res.status(500).json({ error: "Failed to create subscription" });
    }

    // Store pending subscription
    await storage.updateShopPlan(shopData.id, plan as PlanType, result.chargeId, "pending");

    res.json({
      success: true,
      confirmationUrl: result.confirmationUrl,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
}

// GET /api/billing/callback - Handle subscription confirmation
export async function handleBillingCallback(req: Request, res: Response) {
  try {
    const { shop, charge_id } = req.query;

    if (!shop || typeof shop !== "string") {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    const shopData = await storage.getShopByDomain(shop);
    
    if (!shopData || !shopData.accessToken) {
      return res.status(401).json({ error: "Shop not installed" });
    }

    // Check subscription status from Shopify
    const status = await getSubscriptionStatus(shop, shopData.accessToken);
    
    if (status?.status === "ACTIVE") {
      // Determine plan based on stored pending subscription
      const plan = shopData.plan || "basic";
      await storage.updateShopPlan(shopData.id, plan as PlanType, shopData.subscriptionId, "active");
      
      // Reset usage counter
      await storage.resetShopUsage(shopData.id);
    }

    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/?shop=${encodeURIComponent(shop)}&billing=success`);
  } catch (error) {
    console.error("Billing callback error:", error);
    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/?shop=${encodeURIComponent(req.query.shop as string)}&billing=error`);
  }
}

// POST /api/billing/cancel - Cancel subscription
export async function handleCancelSubscription(req: Request, res: Response) {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    const shopData = await storage.getShopByDomain(shop);
    
    if (!shopData || !shopData.accessToken) {
      return res.status(401).json({ error: "Shop not installed" });
    }

    if (!shopData.subscriptionId) {
      return res.status(400).json({ error: "No active subscription" });
    }

    const success = await cancelSubscription(shop, shopData.accessToken, shopData.subscriptionId);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }

    await storage.updateShopPlan(shopData.id, "free", null, "cancelled");

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
}

// GET /api/billing/status - Get current billing status
export async function handleBillingStatus(req: Request, res: Response) {
  try {
    const shop = req.query.shop as string;

    if (!shop) {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    const shopData = await storage.getShopByDomain(shop);
    
    if (!shopData) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const planConfig = PLANS[shopData.plan as PlanType || "free"];
    const limit = planConfig.imagesPerMonth;
    const used = shopData.imagesOptimizedThisMonth || 0;

    res.json({
      plan: shopData.plan || "free",
      planName: planConfig.name,
      price: planConfig.price,
      features: planConfig.features,
      usage: {
        used,
        limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - used),
        percentage: limit === -1 ? 0 : Math.round((used / limit) * 100),
      },
      subscription: {
        id: shopData.subscriptionId,
        status: shopData.subscriptionStatus,
        billingOn: shopData.billingOn,
      },
    });
  } catch (error) {
    console.error("Billing status error:", error);
    res.status(500).json({ error: "Failed to get billing status" });
  }
}

// Check if shop can optimize more images (usage limit)
export async function checkUsageLimit(shopId: string): Promise<{ allowed: boolean; remaining: number }> {
  const shopData = await storage.getShopById(shopId);
  
  if (!shopData) {
    return { allowed: false, remaining: 0 };
  }

  const planConfig = PLANS[shopData.plan as PlanType || "free"];
  const limit = planConfig.imagesPerMonth;
  const used = shopData.imagesOptimizedThisMonth || 0;

  // Unlimited plan
  if (limit === -1) {
    return { allowed: true, remaining: -1 };
  }

  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining };
}

// Increment usage counter
export async function incrementUsage(shopId: string): Promise<void> {
  await storage.incrementShopUsage(shopId);
}
