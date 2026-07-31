import type { Permission } from "@prisma/client";
import { roleRepository, type RoleWithPermissions } from "./role.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { CreateRoleDto, UpdateRoleDto } from "./role.types.js";

export const roleService = {
  listPermissions(): Promise<Permission[]> {
    return roleRepository.findAllPermissions();
  },

  listRoles(): Promise<RoleWithPermissions[]> {
    return roleRepository.findMany();
  },

  create(dto: CreateRoleDto): Promise<RoleWithPermissions> {
    if (!dto.name?.trim()) {
      throw AppError.badRequest("Name is required!!!");
    }
    return roleRepository.create({
      name: dto.name,
      description: dto.description || null,
      permissions: { connect: (dto.permissionKeys ?? []).map((key) => ({ key })) },
    });
  },

  update(id: number, dto: UpdateRoleDto): Promise<RoleWithPermissions> {
    return roleRepository.update(id, {
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      // `set` replaces the whole permission list with exactly what was
      // sent - simplest correct semantics for a checkbox form.
      permissions: dto.permissionKeys
        ? { set: dto.permissionKeys.map((key) => ({ key })) }
        : undefined,
    });
  },

  async remove(id: number) {
    // Staff users referencing this role get their roleId cleared first
    // (matches onDelete behavior for an optional FK) so the delete never
    // fails with a foreign-key error.
    await roleRepository.clearUsersRole(id);
    return roleRepository.remove(id);
  },
};
