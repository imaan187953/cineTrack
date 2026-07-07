import mongoose, { Schema } from "mongoose";
import { MEDIA_TYPES, WATCH_STATUS } from "../constants.js";

const libraryItemSchema = new Schema(
  {
    library: {
      type: Schema.Types.ObjectId,
      ref: "Library",
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
    posterPath: {
      type: String,
      default: "",
    },
    releaseDate: {
      type: String,
      default: "",
    },
    watchStatus: {
      type: String,
      enum: Object.values(WATCH_STATUS),
      default: WATCH_STATUS.PLAN_TO_WATCH,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent the same TMDB item being added twice to the same library
libraryItemSchema.index(
  { library: 1, tmdbId: 1, mediaType: 1 },
  { unique: true }
);

const LibraryItem = mongoose.model("LibraryItem", libraryItemSchema);

export default LibraryItem;