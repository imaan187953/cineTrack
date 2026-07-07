import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import tmdbClient from "../utils/tmdbClient.js";

// @route GET /api/v1/tmdb/search?query=...&type=movie|tv|multi&page=1
export const searchTMDB = asyncHandler(async (req, res) => {
  const { query, type = "multi", page = 1 } = req.query;

  if (!query?.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  const validTypes = ["movie", "tv", "multi"];
  if (!validTypes.includes(type)) {
    throw new ApiError(400, "type must be 'movie', 'tv', or 'multi'");
  }

  try {
    const { data } = await tmdbClient.get(`/search/${type}`, {
      params: { query, page, include_adult: false },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "TMDB search results fetched successfully"));
  } catch (error) {
    throw new ApiError(
      error.response?.status === 404 ? 404 : 502,
      "Failed to fetch results from TMDB. Please try again later."
    );
  }
});

// @route GET /api/v1/tmdb/:mediaType/:tmdbId
export const getTMDBDetails = asyncHandler(async (req, res) => {
  const { mediaType, tmdbId } = req.params;

  if (!["movie", "tv"].includes(mediaType)) {
    throw new ApiError(400, "mediaType must be either 'movie' or 'tv'");
  }

  try {
    const { data } = await tmdbClient.get(`/${mediaType}/${tmdbId}`, {
      params: { append_to_response: "credits,videos,similar" },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "TMDB details fetched successfully"));
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ApiError(404, "Title not found on TMDB");
    }
    throw new ApiError(502, "Failed to fetch details from TMDB. Please try again later.");
  }
});

// @route GET /api/v1/tmdb/trending?mediaType=movie|tv|all&window=day|week
export const getTrending = asyncHandler(async (req, res) => {
  const { mediaType = "all", window = "week" } = req.query;

  try {
    const { data } = await tmdbClient.get(`/trending/${mediaType}/${window}`);

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Trending titles fetched successfully"));
  } catch (error) {
    throw new ApiError(502, "Failed to fetch trending titles from TMDB.");
  }
});