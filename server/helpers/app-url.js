/**
 * Resolve the public app URL used in emails, PayPal redirects, etc.
 * Supports comma-separated CLIENT_URL for local + production CORS.
 */
function getPublicAppUrl() {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  const origins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!origins.length) return "http://localhost:5173";

  if (process.env.NODE_ENV === "production") {
    return (
      origins.find((url) => url.startsWith("https://") && !url.includes("localhost")) ||
      origins[0]
    );
  }

  return (
    origins.find((url) => url.includes("localhost")) ||
    origins.find((url) => url.startsWith("https://")) ||
    origins[0]
  );
}

function getAllowedOrigins() {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { getPublicAppUrl, getAllowedOrigins };
