// ============================================================================
// Fixed list of grantable permission keys.
// ----------------------------------------------------------------------------
// This is the *source of truth* for what a Role can be given - Roles
// themselves (which keys each one grants) are fully admin-configurable data
// in the DB, but the keys they can choose from come from here, seeded into
// the Permission table by prisma/seed.ts.
//
// Naming convention: "<entity>.<action>". `manage` is a shorthand covering
// create+edit+delete+status for entities that don't need per-action
// granularity (per the spec: category/subcategory/brand/user/settings are
// all-or-nothing for Staff - either they're an admin-only area, or they're
// not offered as a partial permission at all).
// ============================================================================

export interface PermissionDef {
  key: string;
  label: string;
  group: string;
}

export const PERMISSIONS: PermissionDef[] = [
  // Products - the one entity Staff gets real create/edit granularity on
  { key: "product.view", label: "ดูสินค้า", group: "product" },
  { key: "product.create", label: "เพิ่มสินค้า", group: "product" },
  { key: "product.edit", label: "แก้ไขสินค้า", group: "product" },
  { key: "product.delete", label: "ลบสินค้า", group: "product" },

  // Articles - same pattern as products
  { key: "article.view", label: "ดูบทความ", group: "article" },
  { key: "article.create", label: "เพิ่มบทความ", group: "article" },
  { key: "article.edit", label: "แก้ไขบทความ", group: "article" },
  { key: "article.delete", label: "ลบบทความ", group: "article" },

  // Admin-only areas per the spec - offered as permissions anyway (rather
  // than hardcoded admin-only) so a future Role could be given partial
  // access without a code change, but the seeded "staff" Role does not
  // grant any of these, matching the spec exactly.
  { key: "category.manage", label: "จัดการหมวดหมู่ / หมวดหมู่ย่อย", group: "category" },
  { key: "brand.manage", label: "จัดการแบรนด์", group: "brand" },
  { key: "user.manage", label: "จัดการผู้ใช้งาน", group: "user" },
  { key: "role.manage", label: "ตั้งค่าสิทธิ์ (Role & Permission)", group: "role" },
  { key: "order.manage", label: "จัดการออร์เดอร์", group: "order" },
  { key: "settings.manage", label: "ตั้งค่าระบบ", group: "settings" },
  { key: "media.manage", label: "จัดการสื่อ (Media)", group: "media" },
  { key: "dashboard.view", label: "ดู Dashboard", group: "dashboard" },
];

export const PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);
