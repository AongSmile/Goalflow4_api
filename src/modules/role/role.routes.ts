import { Router } from "express";
import { roleController } from "./role.controller.js";
import { authCheck, adminCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

// Role & Permission management is admin-only, full stop - per the spec,
// "ตั้งค่าสิทธิ์" is one of the things Staff can never access, so there's no
// permissionCheck() variant here, just adminCheck.
router.get("/permissions", authCheck, adminCheck, roleController.listPermissions);

router.get("/roles", authCheck, adminCheck, roleController.listRoles);
router.post("/roles", authCheck, adminCheck, roleController.create);
router.put("/roles/:id", authCheck, adminCheck, roleController.update);
router.delete("/roles/:id", authCheck, adminCheck, roleController.remove);

export default router;
