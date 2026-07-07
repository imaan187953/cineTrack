export const DB_NAME = "cinetrack";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

export const LIBRARY_VISIBILITY = {
  PRIVATE: "private",
  PUBLIC: "public",
};

export const MEDIA_TYPES = {
  MOVIE: "movie",
  TV: "tv",
};

export const WATCH_STATUS = {
  PLAN_TO_WATCH: "plan_to_watch",
  WATCHING: "watching",
  COMPLETED: "completed",
  DROPPED: "dropped",
};