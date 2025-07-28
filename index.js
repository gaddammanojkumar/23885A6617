// index.js
const express = require("express");
const { nanoid } = require("nanoid");

const app = express();
app.use(express.json());

const PORT = 3000;
const HOST = "http://localhost";

// In-memory storage for short URLs
const urlStore = {};

// Utility function to get expiry time (30 minutes from now)
function getExpiryTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return now.toISOString();
}

// 1. Create Short URL
app.post("/shorturls", (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl || !originalUrl.startsWith("http")) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const id = nanoid(6); // e.g., 'abcd12'
  const shortUrl = `${HOST}:${PORT}/${id}`;
  const expiry = getExpiryTime();

  urlStore[id] = {
    originalUrl,
    shortUrl,
    expiry,
    createdAt: new Date().toISOString(),
    clicks: 0
  };

  return res.status(201).json({
    shortlink: shortUrl,
    expiry
  });
});

// 2. Retrieve Short URL Statistics
app.get("/shorturls/:id", (req, res) => {
  const { id } = req.params;
  const data = urlStore[id];

  if (!data) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  return res.json({
    originalUrl: data.originalUrl,
    shortlink: data.shortUrl,
    createdAt: data.createdAt,
    expiry: data.expiry,
    totalClicks: data.clicks
  });
});

// (Optional) Redirect handler to test clicks
app.get("/:id", (req, res) => {
  const { id } = req.params;
  const entry = urlStore[id];

  if (!entry) {
    return res.status(404).send("Short URL not found");
  }

  const now = new Date().toISOString();
  if (now > entry.expiry) {
    return res.status(410).send("Short URL expired");
  }

  entry.clicks += 1;
  res.redirect(entry.originalUrl);
});

app.listen(PORT, () => {
  console.log(`URL Shortener running at ${HOST}:${PORT}`);
});
