// PayPal integration - using direct REST API
import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

console.log("[PayPal] Checking configuration...");
console.log("[PayPal] CLIENT_ID exists:", !!PAYPAL_CLIENT_ID);
console.log("[PayPal] CLIENT_SECRET exists:", !!PAYPAL_CLIENT_SECRET);

// Determine environment
const isProduction = process.env.PAYPAL_MODE === "live" || 
                     process.env.PAYPAL_MODE === "production" ||
                     process.env.RENDER === "true" ||
                     process.env.NODE_ENV === "production";

const PAYPAL_API_BASE = isProduction 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

console.log("[PayPal] Mode:", isProduction ? "PRODUCTION" : "SANDBOX");
console.log("[PayPal] API Base:", PAYPAL_API_BASE);

// Get access token from PayPal
async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Token error:", error);
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// Generate client token for frontend SDK
async function getClientToken(): Promise<string> {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/identity/generate-token`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept-Language": "en_US",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[PayPal] Client token error:", error);
    throw new Error(`Failed to generate client token: ${error}`);
  }

  const data = await response.json() as { client_token: string };
  return data.client_token;
}

/* API Handlers */
export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return res.status(503).json({ 
        error: "PayPal not configured",
        message: "PayPal credentials are missing. Please contact support."
      });
    }
    
    const clientToken = await getClientToken();
    res.json({ clientToken });
  } catch (error: any) {
    console.error("[PayPal] Failed to get client token:", error);
    const errorMessage = error?.message || JSON.stringify(error) || "Unknown error";
    res.status(500).json({ error: "Failed to initialize PayPal", details: errorMessage });
  }
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }

    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: intent?.toUpperCase() || "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount,
          },
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[PayPal] Create order error:", error);
      return res.status(500).json({ error: "Failed to create order", details: error });
    }

    const order = await response.json();
    console.log("[PayPal] Order created:", order.id);
    res.json(order);
  } catch (error: any) {
    console.error("[PayPal] Failed to create order:", error.message);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    const orderId = Array.isArray(orderID) ? orderID[0] : orderID;

    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[PayPal] Capture error:", error);
      return res.status(500).json({ error: "Failed to capture order", details: error });
    }

    const result = await response.json();
    console.log("[PayPal] Order captured:", orderId);
    res.json(result);
  } catch (error: any) {
    console.error("[PayPal] Failed to capture order:", error.message);
    res.status(500).json({ error: "Failed to capture order", details: error.message });
  }
}
