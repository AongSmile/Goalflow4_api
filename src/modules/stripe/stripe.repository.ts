import type { Cart } from "@prisma/client";
import prisma from "../../config/prisma.js";

export const stripeRepository = {
  findCartByUser(userId: number): Promise<Cart | null> {
    return prisma.cart.findFirst({ where: { orderedById: userId } });
  },
};
