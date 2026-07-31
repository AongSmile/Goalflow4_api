import { Router } from "express";
import { brandController } from "./brand.controller.js";
import { authCheck, adminCheck, permissionCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

// Public - the storefront's brand strip/page pulls from here (spec section 4).
router.get("/brands/storefront", brandController.storefront);

router.get("/brands", authCheck, permissionCheck("brand.manage"), brandController.list);
router.post("/brands", authCheck, permissionCheck("brand.manage"), brandController.create);
router.put("/brands/:id", authCheck, permissionCheck("brand.manage"), brandController.update);
// Delete is always admin-only, never delegable through the Role/Permission
// system - the spec is explicit that Staff can never delete anything.
router.delete("/brands/:id", authCheck, adminCheck, brandController.remove);

export default router;
