import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // every route below requires authentication

router.get("/me", getCurrentUser);
router.patch("/me", updateProfile);
router.patch("/me/password", changePassword);

export default router;