import type { Role, Permission, Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";

export type RoleWithPermissions = Role & {
  permissions: Permission[];
  _count: { users: number };
};

export const roleRepository = {
  findAllPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany({ orderBy: [{ group: "asc" }, { id: "asc" }] });
  },

  findMany(): Promise<RoleWithPermissions[]> {
    return prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });
  },

  create(data: Prisma.RoleCreateInput): Promise<RoleWithPermissions> {
    return prisma.role.create({
      data,
      include: { permissions: true, _count: { select: { users: true } } },
    });
  },

  update(id: number, data: Prisma.RoleUpdateInput): Promise<RoleWithPermissions> {
    return prisma.role.update({
      where: { id },
      data,
      include: { permissions: true, _count: { select: { users: true } } },
    });
  },

  clearUsersRole(roleId: number): Promise<Prisma.BatchPayload> {
    return prisma.user.updateMany({ where: { roleId }, data: { roleId: null } });
  },

  remove(id: number): Promise<Role> {
    return prisma.role.delete({ where: { id } });
  },
};
