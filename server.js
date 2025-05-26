import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
    origin: 'https://filmpire-n9sq.onrender.com', // Your frontend's URL

}));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// TMDB API Key
const TMDB_API_KEY = "38aabe87b21c9a6d0769987df85b56b9";

// Middleware to log request URLs
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Root route
app.get("/", (req, res) => {
    res.send("Welcome to the Server Proxy for TMDB API!");
});

// Route: Get Genres
app.get("/api/genre/movie/list", async (req, res) => {
    try {
        const response = await axios.get("https://api.themoviedb.org/3/genre/movie/list", {
            params: { api_key: TMDB_API_KEY },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Popular Movies
app.get("/api/movie/popular", async (req, res) => {
    const { page } = req.query;
    try {
        const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
            params: {
                api_key: TMDB_API_KEY,
                page: page || 1,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Movies by Search, Category, or Genre
app.get("/api/discover/movie", async (req, res) => {
    const { with_genres, page, query } = req.query;
    try {
        const url = query
            ? `https://api.themoviedb.org/3/search/movie`
            : `https://api.themoviedb.org/3/discover/movie`;
        const params = {
            api_key: TMDB_API_KEY,
            page: page || 1,
            ...(with_genres && { with_genres }),
            ...(query && { query }),
        };

        const response = await axios.get(url, { params });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Movie Details
app.get("/api/movie/:id", async (req, res) => {
    const { id } = req.params;
    const { append_to_response } = req.query;

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                ...(append_to_response && { append_to_response }),
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Actor Details
app.get("/api/person/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/person/${id}`, {
            params: { api_key: TMDB_API_KEY },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route: Get Movies by Actor
app.get("/api/discover/movie/:with_cast", async (req, res) => {
    const { with_cast, page } = req.query;

    if (!with_cast) {
        return res.status(400).json({ error: "Actor ID (with_cast) is required" });
    }

    try {
        const response = await axios.get("https://api.themoviedb.org/3/discover/movie", {
            params: {
                api_key: TMDB_API_KEY,
                with_cast,
                page: page || 1,
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching movies by actor:", error.message);
        res.status(500).json({ error: error.message });
    }
});


// Route: Get Recommendations or Similar Movies
app.get("/api/movie/:movie_id/:list", async (req, res) => {
    const { movie_id, list } = req.params;

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movie_id}/${list}`, {
            params: { api_key: TMDB_API_KEY },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



//Get movies by Search
app.get("/api/search/movie", async (req, res) => {
    const { query, page } = req.query;

    if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    try {
        const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
            params: {
                api_key: TMDB_API_KEY,
                query,
                page: page || 1,
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error searching for movies:", error.message);
        res.status(500).json({ error: error.message });
    }
});

///////////////////////////////////////////////////
//////////////////////////////////////////////////









//MongoDB Connection
/////////////////////////////////////////////////////////////////


import mongoose from "mongoose";

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
  const {userId, movie } = req.body;

  try {
    const existingFavorite = await Favorite.findOne({ userId, "movie.id": movie.id });
    if (existingFavorite) {
      return res.status(400).json({ message: "Movie is already in favorites" });
    }

    const favorite = new Favorite({ userId, movie });
    await favorite.save();
    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    res.status(500).json({ message: "Error adding to favorites ", error });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
