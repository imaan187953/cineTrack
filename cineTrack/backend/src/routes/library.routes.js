import { Router } from "express";
import {
  createLibrary,
  getMyLibraries,
  getPublicLibraries,
  getLibraryById,
  getLibraryByShareToken,
  updateLibrary,
  deleteLibrary,
  regenerateShareLink,
} from "../controllers/library.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no auth) - must come before verifyJWT is applied
router.get("/public", getPublicLibraries);
router.get("/shared/:shareToken", getLibraryByShareToken);

// Protected routes
router.use(verifyJWT);

router.post("/", createLibrary);
router.get("/", getMyLibraries);
router.get("/:libraryId", getLibraryById);
router.patch("/:libraryId", updateLibrary);
router.delete("/:libraryId", deleteLibrary);
router.patch("/:libraryId/regenerate-link", regenerateShareLink);

export default router;