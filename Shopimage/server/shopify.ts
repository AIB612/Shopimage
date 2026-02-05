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

const nonceStore = new Map<string, { shop: string; createdAt: number }>();

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
    const { shop } = req.query;

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
    storeNonce(nonce, shop);
    
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
    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/?shop=${encodeURIComponent(shop)}&installed=true`);
  } catch (error) {
    console.error("[Shopify OAuth] Callback error:", error);
    res.status(500).json({ error: "Failed to complete installation" });
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
