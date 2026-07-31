import { adminRepository, type OrderWithDetails, type UserSummary } from "./admin.repository.js";
import type { ChangeOrderStatusDto, ChangeUserStatusDto, ChangeUserRoleDto } from "./admin.types.js";

export const adminService = {
  listOrders(): Promise<OrderWithDetails[]> {
    return adminRepository.findAllOrders();
  },

  changeOrderStatus(dto: ChangeOrderStatusDto) {
    return adminRepository.updateOrderStatus(Number(dto.orderId), dto.orderStatus);
  },

  listUsers(): Promise<UserSummary[]> {
    return adminRepository.findAllUsers();
  },

  changeUserStatus(dto: ChangeUserStatusDto): Promise<string> {
    return adminRepository
      .updateUserStatus(Number(dto.id), dto.enabled)
      .then(() => "Update Status Success");
  },

  changeUserRole(dto: ChangeUserRoleDto): Promise<string> {
    const roleId = dto.role === "staff" ? (dto.roleId ? Number(dto.roleId) : null) : null;
    return adminRepository
      .updateUserRole(Number(dto.id), dto.role, roleId)
      .then(() => "Update Role Success");
  },
};
