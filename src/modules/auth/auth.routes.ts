import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authCheck, adminCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);
router.post("/current-user", authCheck, authController.currentUser);
router.post("/current-admin", authCheck, adminCheck, authController.currentUser);

export default router;
