export interface ChangeOrderStatusDto {
  orderId: number | string;
  orderStatus: string;
}

export interface ChangeUserStatusDto {
  id: number | string;
  enabled: boolean;
}

// roleId only matters (and is only meaningful) when role === "staff" - it's
// which admin-configured Role this staff member gets their permissions
// from. Switching away from "staff" clears roleId.
export interface ChangeUserRoleDto {
  id: number | string;
  role: "user" | "staff" | "admin";
  roleId?: number | string | null;
}
