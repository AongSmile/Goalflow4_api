import type { User, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type UserWithRole = User & {
  roleRef: { id: number; name: string; permissions: { key: string }[] } | null;
};

export const authRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email } });
  },

  findByEmailWithRole(email: string): Promise<UserWithRole | null> {
    return prisma.user.findFirst({
      where: { email },
      include: { roleRef: { include: { permissions: true } } },
    });
  },

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  updatePicture(id: number, picture: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { picture } });
  },
};
