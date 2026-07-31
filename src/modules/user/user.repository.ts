import type { Prisma, Product, Cart, Order } from "@prisma/client";
import prisma from "../../config/prisma.js";

// Every method here optionally takes a `db` client so the service layer can
// pass a `Prisma.TransactionClient` through when composing several of these
// into one atomic operation (see user.service.ts's saveOrder - creating the
// Order, decrementing stock, and clearing the Cart must all succeed or all
// roll back together, per spec section 10's "ใช้ Transaction เมื่อมีการบันทึก
// หลายตาราง"). Defaults to the singleton client for everything else that
// doesn't need a transaction.
type Db = typeof prisma | Prisma.TransactionClient;

export type CartWithProducts = Cart & {
  products: Prisma.ProductOnCartGetPayload<{ include: { product: true } }>[];
};

export type OrderWithProducts = Order & {
  products: Prisma.ProductOnOrderGetPayload<{ include: { product: true } }>[];
};

export const userRepository = {
  findProductStock(
    id: number,
    db: Db = prisma
  ): Promise<Pick<Product, "quantity" | "title"> | null> {
    return db.product.findUnique({ where: { id }, select: { quantity: true, title: true } });
  },

  deleteCartItems(userId: number, db: Db = prisma): Promise<Prisma.BatchPayload> {
    return db.productOnCart.deleteMany({ where: { cart: { orderedById: userId } } });
  },

  deleteCart(userId: number, db: Db = prisma): Promise<Prisma.BatchPayload> {
    return db.cart.deleteMany({ where: { orderedById: userId } });
  },

  createCart(
    userId: number,
    products: { productId: number; count: number; price: number }[],
    cartTotal: number,
    db: Db = prisma
  ): Promise<Cart> {
    return db.cart.create({
      data: { products: { create: products }, cartTotal, orderedById: userId },
    });
  },

  findCartWithProducts(userId: number, db: Db = prisma): Promise<CartWithProducts | null> {
    return db.cart.findFirst({
      where: { orderedById: userId },
      include: { products: { include: { product: true } } },
    });
  },

  updateAddress(userId: number, address: string, db: Db = prisma) {
    return db.user.update({ where: { id: userId }, data: { address } });
  },

  createOrder(
    userId: number,
    products: { productId: number; count: number; price: number }[],
    cartTotal: number,
    stripePaymentId: string,
    amount: number,
    status: string,
    currency: string,
    db: Db = prisma
  ): Promise<Order> {
    return db.order.create({
      data: {
        products: { create: products },
        orderedBy: { connect: { id: userId } },
        cartTotal,
        stripePaymentId,
        amount,
        status,
        currency,
      },
    });
  },

  decrementProductStock(
    productId: number,
    count: number,
    db: Db = prisma
  ): Promise<Product> {
    return db.product.update({
      where: { id: productId },
      data: { quantity: { decrement: count }, sold: { increment: count } },
    });
  },

  findOrdersByUser(userId: number, db: Db = prisma): Promise<OrderWithProducts[]> {
    return db.order.findMany({
      where: { orderedById: userId },
      orderBy: { createdAt: "desc" },
      include: { products: { include: { product: true } } },
    });
  },

  // Runs `fn` inside a single Prisma transaction - every write inside it
  // either all commits or all rolls back.
  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};
