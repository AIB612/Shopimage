export class WebhookHandlers {
  static async processWebhook(_payload: Buffer, _signature: string): Promise<void> {
    throw new Error("Stripe webhooks have been removed. Use Shopify billing/webhook flows only.");
  }
}
