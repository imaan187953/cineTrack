import { Router } from "express";
import {
  createReview,
  getReviewsForTitle,
  getMyReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route - no auth required
router.get("/title/:mediaType/:tmdbId", getReviewsForTitle);

// Protected routes
router.use(verifyJWT);

router.post("/", createReview);
router.get("/me", getMyReviews);
router.patch("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;