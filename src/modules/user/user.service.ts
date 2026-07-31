import { userRepository, type CartWithProducts, type OrderWithProducts } from "./user.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { UserCartDto, SaveAddressDto, SaveOrderDto } from "./user.types.js";

export interface CartView {
  products: CartWithProducts["products"];
  cartTotal: number;
}

export const userService = {
  // Replaces the user's whole cart with what was submitted. Wrapped in a
  // transaction (spec section 10) since it's a delete + delete + create
  // spanning two tables (Cart, ProductOnCart) - without it, a crash
  // mid-sequence could leave the user with no cart at all instead of
  // either the old one or the new one.
  async userCart(userId: number, dto: UserCartDto): Promise<{ ok: true; cart: unknown }> {
    // Validate stock for every item before touching anything.
    for (const item of dto.cart) {
      const product = await userRepository.findProductStock(item.id);
      if (!product || item.count > product.quantity) {
        throw AppError.badRequest(`ขออภัย สินค้า ${product?.title || "product"} มีไม่เพียงพอ`);
      }
    }

    const products = dto.cart.map((item) => ({
      productId: item.id,
      count: item.count,
      price: item.price,
    }));
    const cartTotal = products.reduce((sum, item) => sum + item.price * item.count, 0);

    const cart = await userRepository.runInTransaction(async (tx) => {
      await userRepository.deleteCartItems(userId, tx);
      await userRepository.deleteCart(userId, tx);
      return userRepository.createCart(userId, products, cartTotal, tx);
    });

    return { ok: true, cart };
  },

  async getUserCart(userId: number): Promise<CartView> {
    const cart = await userRepository.findCartWithProducts(userId);
    if (!cart) return { products: [], cartTotal: 0 };
    return { products: cart.products, cartTotal: cart.cartTotal };
  },

  async emptyCart(userId: number): Promise<{ message: string; deletedCount: number }> {
    const result = await userRepository.deleteCart(userId);
    return { message: "Cart Empty Success", deletedCount: result.count };
  },

  async saveAddress(userId: number, dto: SaveAddressDto): Promise<{ ok: true; message: string }> {
    await userRepository.updateAddress(userId, dto.address);
    return { ok: true, message: "Address update success" };
  },

  // THE multi-table write the spec calls out explicitly: creating the
  // Order, decrementing every purchased Product's stock (+ incrementing
  // `sold`), and clearing the Cart must all succeed together or not at all -
  // otherwise a mid-way failure could charge/record an order without ever
  // deducting stock (oversell risk) or deduct stock without an Order to
  // show for it.
  async saveOrder(userId: number, dto: SaveOrderDto): Promise<{ ok: true; order: unknown }> {
    const { id, amount, status, currency } = dto.paymentIntent;

    const userCart = await userRepository.findCartWithProducts(userId);
    if (!userCart || userCart.products.length === 0) {
      throw AppError.badRequest("Cart is Empty");
    }

    const amountTHB = Number(amount) / 100;
    const orderProducts = userCart.products.map((item) => ({
      productId: item.productId,
      count: item.count,
      price: item.price,
    }));

    const order = await userRepository.runInTransaction(async (tx) => {
      const createdOrder = await userRepository.createOrder(
        userId,
        orderProducts,
        userCart.cartTotal,
        id,
        amountTHB,
        status,
        currency,
        tx
      );

      await Promise.all(
        userCart.products.map((item) =>
          userRepository.decrementProductStock(item.productId, item.count, tx)
        )
      );

      await userRepository.deleteCart(userId, tx);

      return createdOrder;
    });

    return { ok: true, order };
  },

  async getOrders(userId: number): Promise<{ ok: true; orders: OrderWithProducts[] }> {
    const orders = await userRepository.findOrdersByUser(userId);
    return { ok: true, orders };
  },
};
