
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect("mongodb+srv://princemali019:princemali123@filmpirecluster.89wo7d6.mongodb.net/filmpiredb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Define Movie Schema
const movieSchema = new mongoose.Schema({
  id: Number,
  title: String,
  poster_path: String,
  vote_average: Number,
  addedAt: String,
});

// Define Favorite Schema
const favoriteSchema = new mongoose.Schema({
  userId: String,
  movie: movieSchema,
});

// Define Watchlist Schema
const watchlistSchema = new mongoose.Schema({
  userId: String,
  movie: movieSchema,
});

// Create Models
const Favorite = mongoose.model("Favorite", favoriteSchema);
const Watchlist = mongoose.model("Watchlist", watchlistSchema);

// Routes

// Add to favorites
app.post("/favorites", async (req, res) => {
  const { userId, movie } = req.body;

  try {
    const existingFavorite = await Favorite.findOne({ userId, "movie.id": movie.id });
    if (existingFavorite) {
      return res.status(400).json({ message: "Movie is already in favorites" });
    }

    const favorite = new Favorite({ userId, movie });
    await favorite.save();
    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: "Error adding to favorites", error });
  }
});

// Remove from favorites
app.delete("/favorites/:userId/:movieId", async (req, res) => {
  const { userId, movieId } = req.params;

  try {
    const result = await Favorite.findOneAndDelete({ userId, "movie.id": movieId });
    if (!result) {
      return res.status(404).json({ message: "Movie not found in favorites" });
    }
    res.status(200).json({ message: "Removed from favorites", result });
  } catch (error) {
    res.status(500).json({ message: "Error removing from favorites", error });
  }
});

// Add to watchlist
app.post("/watchlist", async (req, res) => {
  const { userId, movie } = req.body;

  try {
    const existingWatchlist = await Watchlist.findOne({ userId, "movie.id": movie.id });
    if (existingWatchlist) {
      return res.status(400).json({ message: "Movie is already in the watchlist" });
    }

    const watchlist = new Watchlist({ userId, movie });
    await watchlist.save();
    res.status(201).json({ message: "Added to watchlist", watchlist });
  } catch (error) {
    res.status(500).json({ message: "Error adding to watchlist", error });
  }
});

// Remove from watchlist
app.delete("/watchlist/:userId/:movieId", async (req, res) => {
  const { userId, movieId } = req.params;

  try {
    const result = await Watchlist.findOneAndDelete({ userId, "movie.id": movieId });
    if (!result) {
      return res.status(404).json({ message: "Movie not found in watchlist" });
    }
    res.status(200).json({ message: "Removed from watchlist", result });
  } catch (error) {
    res.status(500).json({ message: "Error removing from watchlist", error });
  }
});

// Fetch favorite status
app.get("/favorites/:userId/:movieId", async (req, res) => {
  const { userId, movieId } = req.params;

  try {
    const favorite = await Favorite.findOne({ userId, "movie.id": movieId });
    res.status(200).json({ isFavorited: !!favorite });
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorite status", error });
  }
});

// Fetch watchlist status
app.get("/watchlist/:userId/:movieId", async (req, res) => {
  const { userId, movieId } = req.params;

  try {
    const watchlist = await Watchlist.findOne({ userId, "movie.id": movieId });
    res.status(200).json({ isWatchListed: !!watchlist });
  } catch (error) {
    res.status(500).json({ message: "Error fetching watchlist status", error });
  }
});

// Fetch all favorites and watchlist movies for a specific user
app.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all favorites and watchlist movies
    const favorites = await Favorite.find({ userId });
    const watchlist = await Watchlist.find({ userId });

    // Map to extract movie details
    const favoriteMovies = favorites.map((fav) => fav.movie);
    const watchlistMovies = watchlist.map((item) => item.movie);

    // Send response with both arrays
    res.status(200).json({
      favorites: favoriteMovies,
      watchlist: watchlistMovies,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile data", error });
  }
});


// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
