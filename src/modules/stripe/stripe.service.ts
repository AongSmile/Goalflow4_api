import Stripe from "stripe";
import { stripeRepository } from "./stripe.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const stripeService = {
  async createPaymentIntent(userId: number): Promise<{ clientSecret: string | null }> {
    const cart = await stripeRepository.findCartByUser(userId);
    if (!cart || !cart.cartTotal) {
      throw AppError.badRequest("Cart is empty");
    }

    // Stripe expects the smallest currency unit (satang for THB)
    const amountSubunits = Math.round(cart.cartTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountSubunits,
      currency: "thb",
      automatic_payment_methods: { enabled: true },
    });

    return { clientSecret: paymentIntent.client_secret };
  },
};
