import mongoose, { Schema } from "mongoose";
import { MEDIA_TYPES } from "../constants.js";

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: [true, "TMDB ID is required"],
    },
    mediaType: {
      type: String,
      enum: Object.values(MEDIA_TYPES),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating cannot exceed 10"],
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: [2000, "Review cannot exceed 2000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// One review per user per title
reviewSchema.index({ user: 1, tmdbId: 1, mediaType: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;