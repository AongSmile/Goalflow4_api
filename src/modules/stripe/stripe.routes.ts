import { Router } from "express";
import { authCheck } from "../../shared/middlewares/authCheck.js";
import { stripeController } from "./stripe.controller.js";

const router = Router();

router.post("/user/create-payment-intent", authCheck, stripeController.createPaymentIntent);

export default router;
