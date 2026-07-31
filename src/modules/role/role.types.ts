export interface CreateRoleDto {
  name: string;
  description?: string | null;
  permissionKeys?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
  permissionKeys?: string[];
}
