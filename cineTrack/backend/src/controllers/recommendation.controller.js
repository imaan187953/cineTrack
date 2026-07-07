import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Library from "../models/library.model.js";
import LibraryItem from "../models/libraryItem.model.js";
import Review from "../models/review.model.js";
import geminiClient from "../utils/geminiClient.js";
import tmdbClient from "../utils/tmdbClient.js";

const buildTasteProfile = async (userId) => {
  const libraries = await Library.find({ owner: userId }).select("_id");
  const libraryIds = libraries.map((lib) => lib._id);

  const items = await LibraryItem.find({ library: { $in: libraryIds } })
    .select("title mediaType watchStatus tmdbId")
    .limit(50)
    .sort({ createdAt: -1 });

  const reviews = await Review.find({ user: userId })
    .select("title mediaType rating tmdbId")
    .limit(50)
    .sort({ createdAt: -1 });

  return { items, reviews };
};

// @route GET /api/v1/recommendations
export const getRecommendations = asyncHandler(async (req, res) => {
  const { items, reviews } = await buildTasteProfile(req.user._id);

  if (items.length === 0 && reviews.length === 0) {
    throw new ApiError(
      400,
      "Add some titles to your library or write a review first, so we can learn your taste"
    );
  }

  // Build a compact, readable taste summary for the prompt
  const likedTitles = reviews
    .filter((r) => r.rating >= 7)
    .map((r) => `${r.title} (${r.mediaType}, rated ${r.rating}/10)`);

  const dislikedTitles = reviews
    .filter((r) => r.rating <= 4)
    .map((r) => `${r.title} (${r.mediaType}, rated ${r.rating}/10)`);

  const libraryTitles = items.map((i) => `${i.title} (${i.mediaType})`);

  const existingTmdbIds = new Set(
    [...items, ...reviews].map((entry) => `${entry.mediaType}-${entry.tmdbId}`)
  );

  const prompt = `You are a movie and TV recommendation engine.

Here is a user's taste profile:

Titles in their library: ${libraryTitles.join(", ") || "none"}
Titles they rated highly (7-10): ${likedTitles.join(", ") || "none"}
Titles they rated poorly (1-4): ${dislikedTitles.join(", ") || "none"}

Based on this taste, suggest exactly 10 movies or TV shows they have NOT already listed above, that they would likely enjoy. Prioritize variety in your reasoning, but keep suggestions genuinely aligned with their taste.

Respond ONLY with a valid JSON array, no markdown, no preamble, no explanation outside the JSON. Each item must have this exact shape:
[
  { "title": "string", "mediaType": "movie" or "tv", "reason": "one short sentence why this fits their taste" }
]`;

  let aiSuggestions;
  try {
    const { data } = await geminiClient.post(
      `/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(rawContent);
    aiSuggestions = Array.isArray(parsed) ? parsed : parsed.recommendations;

    if (!Array.isArray(aiSuggestions)) {
      throw new Error("Unexpected response shape from Gemini");
    }
  } catch (error) {
    throw new ApiError(
      502,
      "Failed to generate recommendations right now. Please try again shortly."
    );
  }

  // Enrich each AI suggestion with real TMDB data
  const enrichedResults = [];

  for (const suggestion of aiSuggestions) {
    if (!suggestion?.title || !suggestion?.mediaType) continue;

    try {
      const { data } = await tmdbClient.get(`/search/${suggestion.mediaType}`, {
        params: { query: suggestion.title, page: 1 },
      });

      const bestMatch = data.results?.[0];

      if (!bestMatch) continue;

      const key = `${suggestion.mediaType}-${bestMatch.id}`;
      if (existingTmdbIds.has(key)) continue; // skip titles already in library/reviews

      enrichedResults.push({
        tmdbId: bestMatch.id,
        mediaType: suggestion.mediaType,
        title: bestMatch.title || bestMatch.name,
        posterPath: bestMatch.poster_path,
        releaseDate: bestMatch.release_date || bestMatch.first_air_date,
        reason: suggestion.reason,
      });
    } catch (err) {
      continue; // skip titles that fail TMDB lookup, don't fail the whole request
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { recommendations: enrichedResults },
        "Recommendations generated successfully"
      )
    );
});