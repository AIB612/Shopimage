// PayPal Button Component
import { useEffect, useState, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  onSuccess,
  onError: onErrorCallback,
}: PayPalButtonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paypalCheckoutRef = useRef<any>(null);
  const buttonRef = useRef<HTMLElement | null>(null);

  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    console.log("[PayPal] Order created:", output);
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  };

  const onApprove = async (data: any) => {
    console.log("[PayPal] onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("[PayPal] Capture result", orderData);
    if (onSuccess) {
      onSuccess(orderData);
    }
  };

  const onCancel = async (data: any) => {
    console.log("[PayPal] onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("[PayPal] onError", data);
    if (onErrorCallback) {
      onErrorCallback(data);
    }
  };

  const handleClick = async () => {
    if (!paypalCheckoutRef.current) {
      console.error("[PayPal] Checkout not initialized");
      setError("PayPal not ready. Please refresh the page.");
      return;
    }
    try {
      console.log("[PayPal] Starting checkout...");
      const checkoutOptionsPromise = createOrder();
      await paypalCheckoutRef.current.start(
        { paymentFlow: "auto" },
        checkoutOptionsPromise,
      );
    } catch (e) {
      console.error("[PayPal] Checkout error:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initPayPal = async () => {
      try {
        console.log("[PayPal] Fetching client token...");
        const response = await fetch("/api/paypal/setup");
        const data = await response.json();
        
        if (!response.ok || !data.clientToken) {
          throw new Error(data.error || "Failed to get client token");
        }
        
        const clientToken = data.clientToken;
        console.log("[PayPal] Got client token, creating instance...");

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        console.log("[PayPal] SDK instance created");

        const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel,
          onError,
        });

        if (mounted) {
          paypalCheckoutRef.current = paypalCheckout;
          setLoading(false);
          console.log("[PayPal] Ready!");
        }
      } catch (e: any) {
        console.error("[PayPal] Init error:", e);
        if (mounted) {
          setError(e.message || "Failed to initialize PayPal");
          setLoading(false);
        }
      }
    };

    const loadPayPalSDK = async () => {
      try {
        if ((window as any).paypal) {
          console.log("[PayPal] SDK already loaded");
          await initPayPal();
          return;
        }

        console.log("[PayPal] Loading SDK...");
        const script = document.createElement("script");
        // Always use production SDK since backend is in production mode
        script.src = "https://www.paypal.com/web-sdk/v6/core";
        script.async = true;
        
        script.onload = () => {
          console.log("[PayPal] SDK loaded");
          initPayPal();
        };
        
        script.onerror = () => {
          console.error("[PayPal] Failed to load SDK");
          if (mounted) {
            setError("Failed to load PayPal. Please refresh.");
            setLoading(false);
          }
        };
        
        document.body.appendChild(script);
      } catch (e: any) {
        console.error("[PayPal] Load error:", e);
        if (mounted) {
          setError(e.message || "Failed to load PayPal");
          setLoading(false);
        }
      }
    };

    loadPayPalSDK();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <button
        onClick={() => window.location.reload()}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {error} (Click to retry)
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-block',
        padding: '12px 32px',
        backgroundColor: loading ? '#ccc' : '#0070ba',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        minWidth: '200px',
      }}
    >
      {loading ? 'Loading PayPal...' : '💳 Pay with PayPal'}
    </button>
  );
}
