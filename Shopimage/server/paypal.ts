// PayPal integration using @paypal/paypal-server-sdk
import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

console.log("[PayPal] Checking configuration...");
console.log("[PayPal] CLIENT_ID exists:", !!PAYPAL_CLIENT_ID);
console.log("[PayPal] CLIENT_SECRET exists:", !!PAYPAL_CLIENT_SECRET);

// Lazy initialization - only create client when needed
let client: any = null;
let ordersController: any = null;
let oAuthAuthorizationController: any = null;

function getPayPalClient() {
  if (client) return { client, ordersController, oAuthAuthorizationController };
  
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const PayPalSDK = require("@paypal/paypal-server-sdk");
  const { Client, Environment, LogLevel, OAuthAuthorizationController, OrdersController } = PayPalSDK;

  client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: PAYPAL_CLIENT_ID,
      oAuthClientSecret: PAYPAL_CLIENT_SECRET,
    },
    timeout: 0,
    environment: process.env.NODE_ENV === "production" 
      ? Environment.Production 
      : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });

  ordersController = new OrdersController(client);
  oAuthAuthorizationController = new OAuthAuthorizationController(client);
  
  console.log("[PayPal] Client initialized successfully");
  return { client, ordersController, oAuthAuthorizationController };
}

/* Token generation */
async function getClientToken() {
  const { oAuthAuthorizationController } = getPayPalClient();
  
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    { authorization: `Basic ${auth}` },
    { intent: "sdk_init", response_type: "client_token" }
  );

  return result.accessToken;
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
    console.error("[PayPal] Failed to get client token:", error.message);
    res.status(500).json({ error: "Failed to initialize PayPal", details: error.message });
  }
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { ordersController } = getPayPalClient();
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }
    if (!intent) {
      return res.status(400).json({ error: "Intent is required" });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    
    console.log("[PayPal] Order created:", jsonResponse.id);
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error: any) {
    console.error("[PayPal] Failed to create order:", error.message);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { ordersController } = getPayPalClient();
    const { orderID } = req.params;
    const orderId = Array.isArray(orderID) ? orderID[0] : orderID;

    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.captureOrder(collect);
    const jsonResponse = JSON.parse(String(body));
    
    console.log("[PayPal] Order captured:", orderId);
    res.status(httpResponse.statusCode).json(jsonResponse);
  } catch (error: any) {
    console.error("[PayPal] Failed to capture order:", error.message);
    res.status(500).json({ error: "Failed to capture order", details: error.message });
  }
}
