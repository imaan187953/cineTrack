import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Library from "../models/library.model.js";
import LibraryItem from "../models/libraryItem.model.js";
import { LIBRARY_VISIBILITY } from "../constants.js";

// @route POST /api/v1/libraries
export const createLibrary = asyncHandler(async (req, res) => {
  const { name, description, visibility } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Library name is required");
  }

  const existing = await Library.findOne({ owner: req.user._id, name });
  if (existing) {
    throw new ApiError(409, "You already have a library with this name");
  }

  const library = await Library.create({
    name,
    description,
    visibility: Object.values(LIBRARY_VISIBILITY).includes(visibility)
      ? visibility
      : LIBRARY_VISIBILITY.PRIVATE,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { library }, "Library created successfully"));
});

// @route GET /api/v1/libraries
export const getMyLibraries = asyncHandler(async (req, res) => {
  const libraries = await Library.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { libraries }, "Libraries fetched successfully"));
});

// @route GET /api/v1/libraries/public
export const getPublicLibraries = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const libraries = await Library.find({
    visibility: LIBRARY_VISIBILITY.PUBLIC,
  })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Library.countDocuments({
    visibility: LIBRARY_VISIBILITY.PUBLIC,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { libraries, page, totalPages: Math.ceil(total / limit), total },
      "Public libraries fetched successfully"
    )
  );
});

// @route GET /api/v1/libraries/:libraryId
export const getLibraryById = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;

  const library = await Library.findById(libraryId);

  if (!library) {
    throw new ApiError(404, "Library not found");
  }

  if (library.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have access to this library");
  }

  const items = await LibraryItem.find({ library: library._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { library, items }, "Library fetched successfully"));
});

// @route GET /api/v1/libraries/shared/:shareToken (PUBLIC - no auth required)
export const getLibraryByShareToken = asyncHandler(async (req, res) => {
  const { shareToken } = req.params;

  const library = await Library.findOne({ shareToken }).populate(
    "owner",
    "username avatar"
  );

  if (!library) {
    throw new ApiError(404, "Shared library not found or link is invalid");
  }

  const items = await LibraryItem.find({ library: library._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { library, items }, "Shared library fetched successfully"));
});

// @route PATCH /api/v1/libraries/:libraryId
export const updateLibrary = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;
  const { name, description, visibility } = req.body;

  const library = await Library.findById(libraryId);

  if (!library) {
    throw new ApiError(404, "Library not found");
  }

  if (library.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this library");
  }

  if (name?.trim()) library.name = name;
  if (description !== undefined) library.description = description;
  if (visibility && Object.values(LIBRARY_VISIBILITY).includes(visibility)) {
    library.visibility = visibility;
  }

  await library.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { library }, "Library updated successfully"));
});

// @route DELETE /api/v1/libraries/:libraryId
export const deleteLibrary = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;

  const library = await Library.findById(libraryId);

  if (!library) {
    throw new ApiError(404, "Library not found");
  }

  if (library.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this library");
  }

  await LibraryItem.deleteMany({ library: library._id });
  await library.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Library and its items deleted successfully"));
});

// @route PATCH /api/v1/libraries/:libraryId/regenerate-link
export const regenerateShareLink = asyncHandler(async (req, res) => {
  const { libraryId } = req.params;

  const library = await Library.findById(libraryId);

  if (!library) {
    throw new ApiError(404, "Library not found");
  }

  if (library.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this library");
  }

  const { nanoid } = await import("nanoid");
  library.shareToken = nanoid(10);
  await library.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { shareToken: library.shareToken }, "Share link regenerated")
    );
});