import { Router } from "express";
import {
  searchTMDB,
  getTMDBDetails,
  getTrending,
} from "../controllers/tmdb.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/search", searchTMDB);
router.get("/trending", getTrending);
router.get("/:mediaType/:tmdbId", getTMDBDetails);

export default router;