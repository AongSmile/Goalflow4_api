import { Router } from "express";
import { userController } from "./user.controller.js";
import { authCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

router.post("/user/cart", authCheck, userController.userCart);
router.get("/user/cart", authCheck, userController.getUserCart);
router.delete("/user/cart", authCheck, userController.emptyCart);

router.post("/user/address", authCheck, userController.saveAddress);

router.post("/user/order", authCheck, userController.saveOrder);
router.get("/user/order", authCheck, userController.getOrders);

export default router;
