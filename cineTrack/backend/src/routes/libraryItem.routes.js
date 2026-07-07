import { Router } from "express";
import {
  addItemToLibrary,
  getLibraryItems,
  updateItemStatus,
  removeItemFromLibrary,
} from "../controllers/libraryItem.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

router.post("/", addItemToLibrary);
router.get("/", getLibraryItems);
router.patch("/:itemId", updateItemStatus);
router.delete("/:itemId", removeItemFromLibrary);

export default router;