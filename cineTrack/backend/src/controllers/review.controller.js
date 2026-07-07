import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Review from "../models/review.model.js";
import { MEDIA_TYPES } from "../constants.js";

// @route POST /api/v1/reviews
export const createReview = asyncHandler(async (req, res) => {
  const { tmdbId, mediaType, title, rating, reviewText } = req.body;

  if (!tmdbId || !mediaType || !title?.trim() || !rating) {
    throw new ApiError(400, "tmdbId, mediaType, title, and rating are required");
  }

  if (!Object.values(MEDIA_TYPES).includes(mediaType)) {
    throw new ApiError(400, "mediaType must be either 'movie' or 'tv'");
  }

  if (rating < 1 || rating > 10) {
    throw new ApiError(400, "Rating must be between 1 and 10");
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    tmdbId,
    mediaType,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this title. Try updating it instead.");
  }

  const review = await Review.create({
    user: req.user._id,
    tmdbId,
    mediaType,
    title,
    rating,
    reviewText,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { review }, "Review created successfully"));
});

// @route GET /api/v1/reviews/title/:mediaType/:tmdbId (PUBLIC)
export const getReviewsForTitle = asyncHandler(async (req, res) => {
  const { mediaType, tmdbId } = req.params;

  if (!Object.values(MEDIA_TYPES).includes(mediaType)) {
    throw new ApiError(400, "mediaType must be either 'movie' or 'tv'");
  }

  const reviews = await Review.find({ tmdbId, mediaType })
    .populate("user", "username avatar")
    .sort({ createdAt: -1 });

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reviews, averageRating, count: reviews.length },
        "Reviews fetched successfully"
      )
    );
});

// @route GET /api/v1/reviews/me
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { reviews }, "Your reviews fetched successfully"));
});

// @route PATCH /api/v1/reviews/:reviewId
export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, reviewText } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to edit this review");
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 10) {
      throw new ApiError(400, "Rating must be between 1 and 10");
    }
    review.rating = rating;
  }

  if (reviewText !== undefined) {
    review.reviewText = reviewText;
  }

  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { review }, "Review updated successfully"));
});

// @route DELETE /api/v1/reviews/:reviewId
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this review");
  }

  await review.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});