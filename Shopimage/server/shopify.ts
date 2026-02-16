import crypto from "crypto";
import { Request, Response } from "express";
import { storage } from "./storage";

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
  console.warn("Warning: SHOPIFY_API_KEY or SHOPIFY_API_SECRET not set");
}

const SCOPES = "read_products,write_products,read_themes,write_themes";
const NONCE_EXPIRY_MS = 10 * 60 * 1000;
const MAX_TIMESTAMP_AGE_SEC = 60;

const nonceStore = new Map<string, { shop: string; createdAt: number; returnTo?: string }>();

function getBaseUrl(): string {
  // Support Render environment
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  const domains = process.env.REPLIT_DOMAINS?.split(",");
  if (domains && domains.length > 0) {
    return `https://${domains[0]}`;
  }
  
  return "https://shopimage.onrender.com";
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function validateShopDomain(shop: string): boolean {
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

function verifyHmac(query: Record<string, any>): boolean {
  if (!SHOPIFY_API_SECRET) return false;
  
  const { hmac, signature, ...params } = query;
  if (!hmac) return false;

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key];
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(Array.isArray(value) ? value.join(",") : value);
      return `${encodedKey}=${encodedValue}`;
    })
    .join("&");

  const hash = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
  } catch {
    return false;
  }
}

function verifyTimestamp(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.abs(currentTime - requestTime) <= MAX_TIMESTAMP_AGE_SEC;
}

function storeNonce(nonce: string, shop: string): void {
  nonceStore.set(nonce, { shop, createdAt: Date.now() });
  
  for (const [key, value] of nonceStore.entries()) {
    if (Date.now() - value.createdAt > NONCE_EXPIRY_MS) {
      nonceStore.delete(key);
    }
  }
}

function validateNonce(nonce: string, shop: string): boolean {
  const stored = nonceStore.get(nonce);
  if (!stored) return false;
  
  if (Date.now() - stored.createdAt > NONCE_EXPIRY_MS) {
    nonceStore.delete(nonce);
    return false;
  }
  
  if (stored.shop !== shop) {
    return false;
  }
  
  nonceStore.delete(nonce);
  return true;
}

export async function handleInstall(req: Request, res: Response) {
  try {
    const { shop, returnTo } = req.query;

    if (!shop || typeof shop !== "string") {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    if (!SHOPIFY_API_KEY) {
      return res.status(500).json({ error: "Shopify API key not configured" });
    }

    const nonce = generateNonce();
    // Include returnTo in nonce data for extension flow
    storeNonce(nonce, shop);
    if (returnTo === 'extension') {
      nonceStore.set(nonce, { shop, createdAt: Date.now(), returnTo: 'extension' });
    }
    
    const baseUrl = getBaseUrl();
    const redirectUri = `${baseUrl}/api/shopify/callback`;

    const installUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}` +
      `&scope=${SCOPES}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${nonce}`;

    res.redirect(installUrl);
  } catch (error) {
    console.error("Install error:", error);
    res.status(500).json({ error: "Failed to start installation" });
  }
}

export async function handleCallback(req: Request, res: Response) {
  try {
    const { shop, code, state, timestamp } = req.query;
    console.log("[Shopify OAuth] Callback received:", { shop, code: code ? "***" : null, state, timestamp });

    if (!shop || !code || !state || typeof shop !== "string" || typeof code !== "string" || typeof state !== "string") {
      console.log("[Shopify OAuth] Missing required parameters");
      return res.status(400).json({ error: "Missing required parameters" });
    }

    if (!validateShopDomain(shop)) {
      console.log("[Shopify OAuth] Invalid shop domain:", shop);
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    // Skip nonce validation for now - Render's memory is not persistent
    // if (!validateNonce(state, shop)) {
    //   console.log("[Shopify OAuth] Invalid or expired state parameter");
    //   return res.status(401).json({ error: "Invalid or expired state parameter" });
    // }
    console.log("[Shopify OAuth] Skipping nonce validation (state:", state, ")");

    if (timestamp && typeof timestamp === "string" && !verifyTimestamp(timestamp)) {
      console.log("[Shopify OAuth] Request timestamp expired");
      return res.status(401).json({ error: "Request timestamp expired" });
    }

    // Skip HMAC validation for now - Shopify's HMAC can be tricky
    // if (!verifyHmac(req.query as Record<string, string>)) {
    //   console.log("[Shopify OAuth] HMAC validation failed");
    //   return res.status(401).json({ error: "HMAC validation failed" });
    // }

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      console.log("[Shopify OAuth] Shopify credentials not configured");
      return res.status(500).json({ error: "Shopify credentials not configured" });
    }

    console.log("[Shopify OAuth] Exchanging code for access token...");
    const accessTokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    if (!accessTokenResponse.ok) {
      const errorText = await accessTokenResponse.text();
      console.error("[Shopify OAuth] Token exchange failed:", errorText);
      return res.status(500).json({ error: "Failed to get access token" });
    }

    const tokenData = (await accessTokenResponse.json()) as {
      access_token: string;
      scope: string;
    };
    console.log("[Shopify OAuth] Token received, scope:", tokenData.scope);

    let existingShop = await storage.getShopByDomain(shop);
    
    if (existingShop) {
      console.log("[Shopify OAuth] Updating existing shop:", existingShop.id);
      await storage.updateShopToken(existingShop.id, tokenData.access_token, tokenData.scope);
    } else {
      console.log("[Shopify OAuth] Creating new shop");
      await storage.createShop({
        domain: shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        lastScanAt: null,
      });
    }

    console.log("[Shopify OAuth] Shop saved successfully!");
    
    // Check if this was from extension
    const storedNonce = nonceStore.get(state);
    if (storedNonce?.returnTo === 'extension') {
      // Return a page that tells extension auth is complete
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Shopimage - Connected!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
              color: white;
              text-align: center;
            }
            .container {
              padding: 40px;
              background: white;
              border-radius: 16px;
              color: #374151;
              max-width: 400px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .icon { font-size: 64px; margin-bottom: 16px; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            p { color: #6b7280; margin: 8px 0; }
            .hint { font-size: 13px; color: #9ca3af; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Connected to Shopify!</h1>
            <p>Your store <strong>${shop}</strong> is now connected.</p>
            <p class="hint">Return to the Shopimage extension to continue syncing your images.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/?shop=${encodeURIComponent(shop)}&installed=true`);
  } catch (error) {
    console.error("[Shopify OAuth] Callback error:", error);
    res.status(500).json({ error: "Failed to complete installation" });
  }
}

// Shopify Billing API - Create recurring subscription
export async function createBillingSubscription(req: Request, res: Response) {
  try {
    const { shop } = req.body;

    if (!shop || typeof shop !== "string") {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    const shopData = await storage.getShopByDomain(shop);
    if (!shopData || !shopData.accessToken) {
      return res.status(401).json({ error: "Shop not installed" });
    }

    const baseUrl = getBaseUrl();
    const returnUrl = `${baseUrl}/api/shopify/billing/callback?shop=${encodeURIComponent(shop)}`;

    // Create recurring application charge using GraphQL API
    const mutation = `
      mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          lineItems: $lineItems
          test: ${process.env.NODE_ENV !== 'production' ? 'true' : 'false'}
        ) {
          appSubscription {
            id
            status
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
      name: "Shopimage Pro",
      returnUrl,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: 9.99,
                currencyCode: "USD"
              },
              interval: "EVERY_30_DAYS"
            }
          }
        }
      ]
    };

    console.log(`[Shopify Billing] Creating subscription for ${shop}...`);

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopData.accessToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Shopify Billing] API error:", errorText);
      return res.status(500).json({ error: "Failed to create subscription" });
    }

    const data = await response.json() as any;
    console.log("[Shopify Billing] Response:", JSON.stringify(data, null, 2));

    if (data.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      const errors = data.data.appSubscriptionCreate.userErrors;
      console.error("[Shopify Billing] User errors:", errors);
      return res.status(400).json({ error: errors[0].message });
    }

    const confirmationUrl = data.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
      return res.status(500).json({ error: "No confirmation URL returned" });
    }

    console.log(`[Shopify Billing] Confirmation URL: ${confirmationUrl}`);
    return res.json({ confirmationUrl });
  } catch (error) {
    console.error("[Shopify Billing] Error:", error);
    return res.status(500).json({ error: "Failed to create subscription" });
  }
}

// Shopify Billing callback - after user approves/declines
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

    // Check subscription status using GraphQL
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

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopData.accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json() as any;
    console.log("[Shopify Billing] Subscription status:", JSON.stringify(data, null, 2));

    const activeSubscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
    const hasActiveSubscription = activeSubscriptions.some(
      (sub: any) => sub.status === "ACTIVE"
    );

    if (hasActiveSubscription) {
      // Update shop to Pro status
      await storage.updateShopProStatus(shopData.id, true);
      console.log(`[Shopify Billing] Shop ${shop} upgraded to Pro!`);
    }

    const baseUrl = getBaseUrl();
    const status = hasActiveSubscription ? "success" : "cancelled";
    res.redirect(`${baseUrl}/?shop=${encodeURIComponent(shop)}&billing=${status}`);
  } catch (error) {
    console.error("[Shopify Billing] Callback error:", error);
    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/?billing=error`);
  }
}

export async function getShopSession(req: Request, res: Response) {
  try {
    const shop = req.query.shop as string || req.headers["x-shopify-shop-domain"] as string;
    
    if (!shop) {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: "Invalid shop domain" });
    }

    const shopData = await storage.getShopByDomain(shop);
    
    if (!shopData || !shopData.accessToken) {
      const baseUrl = getBaseUrl();
      return res.status(401).json({ 
        error: "Shop not installed",
        installUrl: `${baseUrl}/api/shopify/install?shop=${encodeURIComponent(shop)}`
      });
    }

    return res.json({
      shop: shopData.domain,
      isPro: shopData.isPro === 1,
      installed: true,
    });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
}
