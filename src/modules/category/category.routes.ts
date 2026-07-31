import { Router } from "express";
import { categoryController } from "./category.controller.js";
import { authCheck, adminCheck, permissionCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

// Public - powers the dynamic Navbar (spec section 2). No auth needed.
router.get("/navbar", categoryController.navbar);

// Admin CRUD - category management is admin-only per the spec (Staff never
// gets category.manage), but modeled as a permission anyway for consistency
// and future flexibility.
router.get("/categories", authCheck, permissionCheck("category.manage"), categoryController.list);
router.post("/categories", authCheck, permissionCheck("category.manage"), categoryController.create);
router.put("/categories/:id", authCheck, permissionCheck("category.manage"), categoryController.update);
router.delete("/categories/:id", authCheck, adminCheck, categoryController.remove);

// Storefront listing-page heading: /api/category-meta/:category/:subcategory?
router.get("/category-meta/:category/:subcategory", categoryController.meta);
router.get("/category-meta/:category", categoryController.meta);

export default router;
