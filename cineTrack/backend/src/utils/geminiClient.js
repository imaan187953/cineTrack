import axios from "axios";

const geminiClient = axios.create({
  baseURL: "https://generativelanguage.googleapis.com/v1beta",
  timeout: 15000,
});

export default geminiClient;