import { Router } from "express";
import { articleController } from "./article.controller.js";
import { authCheck, adminCheck, permissionCheck } from "../../shared/middlewares/authCheck.js";

const router = Router();

// Public - the "เกี่ยวกับโกลโฟล" page's "ข่าวสาร/บทความน่ารู้" section (spec
// section 3) pulls from here.
router.get("/articles/storefront", articleController.storefront);
// "อ่านเพิ่มเติม" (read more) target - only ever returns a published article.
router.get("/articles/storefront/:id", articleController.storefrontOne);

router.get("/articles", authCheck, permissionCheck("article.view"), articleController.list);
router.post("/articles", authCheck, permissionCheck("article.create"), articleController.create);
router.put("/articles/:id", authCheck, permissionCheck("article.edit"), articleController.update);
// Delete is always admin-only - see brand.routes.ts for why.
router.delete("/articles/:id", authCheck, adminCheck, articleController.remove);

router.post("/article/images", authCheck, permissionCheck("article.create"), articleController.createImages);
router.post("/article/removeimages", authCheck, permissionCheck("article.edit"), articleController.removeImage);

export default router;
