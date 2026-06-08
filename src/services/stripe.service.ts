import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2023-10-16' as any,
    })
  : null;

export class StripeService {
  public static isStripeEnabled(): boolean {
    return !!stripe;
  }

  public static async createCheckoutSession(
    orderId: string,
    totalAmount: number,
    items: Array<{
      product: { name: string; description: string; imageUrl: string | null };
      quantity: number;
      price: number;
    }>,
    customerEmail: string
  ): Promise<{ id: string; url: string | null }> {
    if (!stripe) {
      console.log(`⚠️ Stripe: Stripe keys are missing. Creating mock Checkout Session for Order ${orderId}.`);
      return {
        id: `mock_sess_${Math.random().toString(36).substring(2, 9)}`,
        url: `http://localhost:3000/api/orders/${orderId}/pay-mock`,
      };
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description,
          images: item.product.imageUrl ? [item.product.imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/api-docs/#/Orders%20%26%20Payments/post_api_orders__id__pay_mock`,
      cancel_url: `http://localhost:3000/api-docs/`,
      customer_email: customerEmail,
      client_reference_id: orderId,
      metadata: {
        orderId,
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  public static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    if (!stripe) {
      throw new Error('Stripe is not initialized.');
    }
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
