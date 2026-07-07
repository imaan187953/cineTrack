import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import { LIBRARY_VISIBILITY } from "../constants.js";

const librarySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Library name is required"],
      trim: true,
      maxlength: [100, "Library name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(LIBRARY_VISIBILITY),
      default: LIBRARY_VISIBILITY.PRIVATE,
    },
    shareToken: {
      type: String,
      unique: true,
      default: () => nanoid(10),
    },
  },
  { timestamps: true }
);

librarySchema.index({ owner: 1, name: 1 }, { unique: true });

const Library = mongoose.model("Library", librarySchema);

export default Library;