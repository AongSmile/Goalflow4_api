import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import productRoutes from "../modules/product/product.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";
import subcategoryRoutes from "../modules/subcategory/subcategory.routes.js";
import brandRoutes from "../modules/brand/brand.routes.js";
import articleRoutes from "../modules/article/article.routes.js";
import roleRoutes from "../modules/role/role.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import stripeRoutes from "../modules/stripe/stripe.routes.js";

// Explicit route mounting (replacing the old `readdirSync('./routes')`
// magic auto-discovery from the JS version) - Clean Architecture favors
// explicit dependencies over implicit/reflective wiring, and it means a
// typo'd or missing route file fails at compile time (an unused import)
// rather than silently never being mounted.
const router = Router();

router.use(authRoutes);
router.use(productRoutes);
router.use(categoryRoutes);
router.use(subcategoryRoutes);
router.use(brandRoutes);
router.use(articleRoutes);
router.use(roleRoutes);
router.use(adminRoutes);
router.use(userRoutes);
router.use(stripeRoutes);

export default router;
