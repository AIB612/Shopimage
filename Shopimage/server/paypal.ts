// PayPal integration using @paypal/paypal-server-sdk
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

console.log("[DIAGNOSTIC] Checking PayPal configuration...");
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error("[DIAGNOSTIC] ERROR: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing from environment!");
  // Don't throw yet, let's see if the rest of the app can at least log more info
}

// Use a safer way to require that won't crash the entire process if it fails
let PayPalSDK;
try {
  PayPalSDK = require("@paypal/paypal-server-sdk");
  console.log("[DIAGNOSTIC] PayPal SDK required successfully.");
} catch (e: any) {
  console.error("[DIAGNOSTIC] ERROR: Failed to require PayPal SDK:", e.message);
}

const { Client, Environment, LogLevel, OAuthAuthorizationController, OrdersController } = PayPalSDK || {};

if (!PayPalSDK) {
  // If we can't even require it, we must stop
  throw new Error("PayPal SDK missing");
}

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
                process.env.NODE_ENV === "production"
                  ? Environment.Production
                  : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
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

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    const orderId = Array.isArray(orderID) ? orderID[0] : orderID;
    const collect = {
      id: orderId,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error) {
    console.error("Failed to get client token:", error);
    res.status(500).json({ error: "Failed to initialize PayPal" });
  }
}
