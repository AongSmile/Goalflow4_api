import { Router } from "express";
import { subcategoryController } from "./subcategory.controller.js";
import { authCheck, adminCheck, permissionCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

router.get("/subcategories", authCheck, permissionCheck("category.manage"), subcategoryController.list);
router.post("/subcategories", authCheck, permissionCheck("category.manage"), subcategoryController.create);
router.put("/subcategories/:id", authCheck, permissionCheck("category.manage"), subcategoryController.update);
// Delete is always admin-only - see brand.routes.ts for why.
router.delete("/subcategories/:id", authCheck, adminCheck, subcategoryController.remove);

export default router;
