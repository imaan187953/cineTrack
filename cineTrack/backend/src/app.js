import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import errorHandler from "./middlewares/error.middleware.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import libraryRouter from "./routes/library.routes.js";
import libraryItemRouter from "./routes/libraryItem.routes.js";
import reviewRouter from "./routes/review.routes.js";
import tmdbRouter from "./routes/tmdb.routes.js";

const app = express();

// Core middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "CineTrack API is running" });
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/libraries", libraryRouter);
app.use("/api/v1/libraries/:libraryId/items", libraryItemRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/tmdb", tmdbRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler - must be last
app.use(errorHandler);

export default app;