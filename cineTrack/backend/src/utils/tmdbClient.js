import axios from "axios";

const tmdbClient = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
  timeout: 8000,
});

export default tmdbClient;