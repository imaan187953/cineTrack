import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Library from "../models/library.model.js";
import LibraryItem from "../models/libraryItem.model.js";
import { MEDIA_TYPES, WATCH_STATUS } from "../constants.js";

const verifyLibraryOwnership = async (libraryId, userId) => {
  const library = await Library.findById(libraryId);
  if (!library) {
    throw new ApiError(404, "Library not found");
  }
  if (library.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not have permission to modify this library");
  }
  return library;
};

// @route POST /api/v1/libraries/:libraryId/items
export const addItemToLibrary = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;
  const { tmdbId, mediaType, title, posterPath, releaseDate } = req.body;

  if (!tmdbId || !mediaType || !title?.trim()) {
    throw new ApiError(400, "tmdbId, mediaType, and title are required");
  }

  if (!Object.values(MEDIA_TYPES).includes(mediaType)) {
    throw new ApiError(400, "mediaType must be either 'movie' or 'tv'");
  }

  await verifyLibraryOwnership(libraryId, req.user._id);

  const alreadyExists = await LibraryItem.findOne({
    library: libraryId,
    tmdbId,
    mediaType,
  });

  if (alreadyExists) {
    throw new ApiError(409, "This item is already in the library");
  }

  const item = await LibraryItem.create({
    library: libraryId,
    tmdbId,
    mediaType,
    title,
    posterPath,
    releaseDate,
    addedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { item }, "Item added to library successfully"));
});

// @route GET /api/v1/libraries/:libraryId/items
export const getLibraryItems = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;

  await verifyLibraryOwnership(libraryId, req.user._id);

  const items = await LibraryItem.find({ library: libraryId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { items }, "Library items fetched successfully"));
});

// @route PATCH /api/v1/libraries/:libraryId/items/:itemId
export const updateItemStatus = asyncHandler(async (req, res) => {
  const { libraryId, itemId } = req.params;
  const { watchStatus } = req.body;

  if (!Object.values(WATCH_STATUS).includes(watchStatus)) {
    throw new ApiError(400, "Invalid watch status value");
  }

  await verifyLibraryOwnership(libraryId, req.user._id);

  const item = await LibraryItem.findOneAndUpdate(
    { _id: itemId, library: libraryId },
    { $set: { watchStatus } },
    { new: true }
  );

  if (!item) {
    throw new ApiError(404, "Item not found in this library");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { item }, "Watch status updated successfully"));
});

// @route DELETE /api/v1/libraries/:libraryId/items/:itemId
export const removeItemFromLibrary = asyncHandler(async (req, res) => {
  const { libraryId, itemId } = req.params;

  await verifyLibraryOwnership(libraryId, req.user._id);

  const item = await LibraryItem.findOneAndDelete({
    _id: itemId,
    library: libraryId,
  });

  if (!item) {
    throw new ApiError(404, "Item not found in this library");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Item removed from library successfully"));
});