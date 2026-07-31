import { Router } from "express";
import { productController } from "./product.controller.js";
import { authCheck, adminCheck, permissionCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

// Staff can create/edit products (spec section 5), so these use
// permissionCheck rather than a hard adminCheck.
router.post("/product", authCheck, permissionCheck("product.create"), productController.create);

// Storefront catalog listing: /api/products?category=&subcategory=
router.get("/products", productController.listByCatalog);
// Legacy "latest N products" (used on the home page)
router.get("/products/:count", productController.list);

// Storefront detail page (lookup by slug)
router.get("/product/slug/:slug", productController.readBySlug);
// Admin lookup (numeric id)
router.get("/product/:id", authCheck, permissionCheck("product.view"), productController.read);
router.put("/product/:id", authCheck, permissionCheck("product.edit"), productController.update);
// Delete is always admin-only, never delegable to Staff - see
// modules/brand/brand.routes.ts for the same rule applied elsewhere.
router.delete("/product/:id", authCheck, adminCheck, productController.remove);

router.post("/productby", productController.listby);
router.post("/search/filters", productController.searchFilters);

router.post("/images", authCheck, permissionCheck("product.create"), productController.createImages);
router.post("/removeimages", authCheck, permissionCheck("product.edit"), productController.removeImage);

export default router;
