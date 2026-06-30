// Centralized API configuration
// Uses environment variable in production, falls back to localhost for dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default API_URL;
