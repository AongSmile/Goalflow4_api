// ============================================================================
// Prisma seed script
// ----------------------------------------------------------------------------
// Imports the 88 products migrated from the old GoalFlows site (see
// client/CLAUDE.md for how that migration happened) into Postgres/Supabase.
//
// Run with:
//   npx prisma db push        # create the tables from schema.prisma
//   npx prisma db seed        # run this script (via tsx, see prisma.config.mjs)
// (or just `npx prisma migrate dev --name init` instead of db push if you
// want a tracked migration history)
//
// Safe to re-run: everything is upserted by slug, so running it twice will
// not create duplicates.
//
// Lives outside src/ and outside the main tsconfig's `include` on purpose -
// it's a one-off dev script, run directly via `tsx` (see prisma.config.mjs's
// migrations.seed), not part of the compiled server bundle in dist/.
// ============================================================================

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Category, Subcategory } from "@prisma/client";
import prisma from "../src/config/prisma.js";
import { PERMISSIONS } from "../src/config/permissions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedProductDetail {
  title?: string;
  subtitle?: string;
  features?: string[];
  applications?: string[];
  mainImage?: string;
  logo?: string;
  specImage?: string;
  deliveryImage?: string;
}

interface SeedProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  image: string | null;
  specPdf: string | null;
  lineUrl: string | null;
  detail: SeedProductDetail | null;
}

interface SeedCategoryMeta {
  title?: string;
  subtitle?: string;
}

// Loaded via fs + JSON.parse rather than a JSON import so this script
// doesn't depend on Node's (still-evolving) import-attribute syntax.
const products: SeedProduct[] = JSON.parse(
  readFileSync(join(__dirname, "seed-data/products.json"), "utf-8")
);
const categoryMeta: Record<string, SeedCategoryMeta> = JSON.parse(
  readFileSync(join(__dirname, "seed-data/categories.json"), "utf-8")
);

// Fallback display names for the two categories that only ever appear with
// a subcategory in categoryMeta (so there's no top-level-only entry for them).
const CATEGORY_FALLBACK: Record<string, SeedCategoryMeta> = {
  products: { title: "Products", subtitle: "สินค้าทั่วไป" },
  "small-tools": { title: "Small Tools", subtitle: "เครื่องมือวัดขนาดเล็ก" },
};

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function upsertCategory(slug: string): Promise<Category> {
  const meta = categoryMeta[slug] || CATEGORY_FALLBACK[slug] || {};
  return prisma.category.upsert({
    where: { slug },
    update: {
      title: meta.title || titleCase(slug),
      subtitle: meta.subtitle || null,
    },
    create: {
      slug,
      name: meta.title || titleCase(slug),
      title: meta.title || titleCase(slug),
      subtitle: meta.subtitle || null,
    },
  });
}

async function upsertSubcategory(
  categorySlug: string,
  subSlug: string,
  categoryId: number
): Promise<Subcategory> {
  const key = `${categorySlug}/${subSlug}`;
  const meta = categoryMeta[key] || {};
  return prisma.subcategory.upsert({
    where: { slug: subSlug },
    update: {
      title: meta.title || titleCase(subSlug),
      subtitle: meta.subtitle || null,
      categoryId,
    },
    create: {
      slug: subSlug,
      title: meta.title || titleCase(subSlug),
      subtitle: meta.subtitle || null,
      categoryId,
    },
  });
}

async function seedPermissionsAndDefaultStaffRole(): Promise<void> {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, group: p.group },
      create: p,
    });
  }

  // A ready-to-use "Staff" role matching the spec's example exactly:
  // product + article create/edit, nothing else (no delete, no
  // category/brand/user/role/settings access). Admins can add more Roles
  // with different permission combinations later via the admin UI - this
  // one just means the system works out of the box without extra setup.
  const staffPermissionKeys = [
    "dashboard.view",
    "product.view",
    "product.create",
    "product.edit",
    "article.view",
    "article.create",
    "article.edit",
  ];

  await prisma.role.upsert({
    where: { name: "Staff" },
    update: {
      permissions: { set: staffPermissionKeys.map((key) => ({ key })) },
    },
    create: {
      name: "Staff",
      description:
        "เพิ่ม/แก้ไขสินค้าและบทความ - ลบไม่ได้ ไม่เห็นเมนูจัดการหมวดหมู่/แบรนด์/ผู้ใช้งาน",
      permissions: { connect: staffPermissionKeys.map((key) => ({ key })) },
    },
  });

  console.log(`Seeded ${PERMISSIONS.length} permissions and the default "Staff" role.`);
}

async function main(): Promise<void> {
  await seedPermissionsAndDefaultStaffRole();

  const categoryCache = new Map<string, Category>();
  const subcategoryCache = new Map<string, Subcategory>();

  let created = 0;
  let updated = 0;

  for (const p of products) {
    if (!categoryCache.has(p.category)) {
      categoryCache.set(p.category, await upsertCategory(p.category));
    }
    const category = categoryCache.get(p.category)!;

    let subcategory: Subcategory | null = null;
    if (p.subcategory) {
      if (!subcategoryCache.has(p.subcategory)) {
        subcategoryCache.set(
          p.subcategory,
          await upsertSubcategory(p.category, p.subcategory, category.id)
        );
      }
      subcategory = subcategoryCache.get(p.subcategory)!;
    }

    const detail = p.detail || {};

    const data = {
      title: detail.title || p.name,
      subtitle: detail.subtitle || null,
      description: (detail.applications || []).join(" / ") || "",
      thumbnail: p.image || null,
      mainImage: detail.mainImage || p.image || null,
      logoImage: detail.logo || null,
      specImage: detail.specImage || null,
      deliveryImage: detail.deliveryImage || null,
      specPdf: p.specPdf || null,
      lineUrl: p.lineUrl || null,
      features: detail.features || [],
      applications: detail.applications || [],
      categoryId: category.id,
      subcategoryId: subcategory ? subcategory.id : null,
    };

    const existing = await prisma.product.findUnique({ where: { slug: p.id } });
    await prisma.product.upsert({
      where: { slug: p.id },
      update: data,
      create: { slug: p.id, ...data },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`Seed complete: ${created} products created, ${updated} updated.`);
  console.log(`Categories: ${categoryCache.size}, Subcategories: ${subcategoryCache.size}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
