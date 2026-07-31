import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { authCheck, adminCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

router.get("/admin/orders", authCheck, adminCheck, adminController.listOrders);
router.put("/admin/order-status", authCheck, adminCheck, adminController.changeOrderStatus);

router.get("/users", authCheck, adminCheck, adminController.listUsers);
router.post("/change-status", authCheck, adminCheck, adminController.changeStatus);
router.post("/change-role", authCheck, adminCheck, adminController.changeRole);

export default router;
