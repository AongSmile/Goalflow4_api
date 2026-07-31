import type { Order, User, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type OrderWithDetails = Order & {
  products: Prisma.ProductOnOrderGetPayload<{ include: { product: true } }>[];
  orderedBy: { id: number; email: string; address: string | null };
};

export type UserSummary = Pick<
  User,
  "id" | "email" | "name" | "role" | "roleId" | "enabled" | "address"
> & {
  roleRef: { id: number; name: string } | null;
};

export const adminRepository = {
  findAllOrders(): Promise<OrderWithDetails[]> {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: { include: { product: true } },
        orderedBy: { select: { id: true, email: true, address: true } },
      },
    });
  },

  updateOrderStatus(orderId: number, orderStatus: string): Promise<Order> {
    return prisma.order.update({ where: { id: orderId }, data: { orderStatus } });
  },

  findAllUsers(): Promise<UserSummary[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        roleRef: { select: { id: true, name: true } },
        enabled: true,
        address: true,
      },
    });
  },

  updateUserStatus(id: number, enabled: boolean): Promise<User> {
    return prisma.user.update({ where: { id }, data: { enabled } });
  },

  updateUserRole(id: number, role: string, roleId: number | null): Promise<User> {
    return prisma.user.update({ where: { id }, data: { role, roleId } });
  },
};
