const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());

// TMDB API Key
const TMDB_API_KEY = import.meta.env.VITE_TMDB_KEY;

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

// Route: Get User's Favorite Movies
app.get("/api/account/:accountId/favorite/movies", async (req, res) => {
    const { accountId } = req.params;
    const { session_id, page } = req.query;

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/account/${accountId}/favorite/movies`, {
            params: {
                api_key: TMDB_API_KEY,
                session_id,
                page: page || 1,
            },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Route: Get User's Watchlist Movies

app.get("/api/account/:accountId/watchlist/movies", async (req, res) => {
    const { accountId } = req.params;
    const { session_id, page } = req.query;

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/account/${accountId}/watchlist/movies`, {
            params: {
                api_key: TMDB_API_KEY,
                session_id,
                page: page || 1,
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching watchlist movies:", error.message);
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
//////////////////////////////////////////////

// 1. Endpoint to get request token
app.get("/api/auth/request_token", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/authentication/token/new`,
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(response.data); // { success: true, request_token: "..." }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint to create session ID from request token (POST)
app.post("/api/auth/session", async (req, res) => {
  const { request_token } = req.body;
  if (!request_token) {
    return res.status(400).json({ error: "Request token required" });
  }

  try {
    const response = await axios.post(
      `https://api.themoviedb.org/3/authentication/session/new`,
      { request_token },
      { params: { api_key: TMDB_API_KEY } }
    );
    res.json(response.data); // { success: true, session_id: "..." }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint to get user account details by session ID
app.get("/api/account", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "Session ID required" });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/account`, {
      params: { api_key: TMDB_API_KEY, session_id },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other existing routes (movies, genres, etc.) remain unchanged...
//////////////////////////////////////////////////////////////////

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
