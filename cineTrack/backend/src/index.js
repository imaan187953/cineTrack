import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error(" Express app error:", error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(` CineTrack server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(" MongoDB connection failed. Server not started:", error);
    process.exit(1);
  });