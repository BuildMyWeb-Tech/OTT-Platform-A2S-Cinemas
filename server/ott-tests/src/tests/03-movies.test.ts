import axios from "axios";
import { state, BASE_URL, TEST_MOVIE } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("🎬 Movies API", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("GET /movies", () => {
    it("should return paginated movies list (public)", async () => {
      const res = await api.get("/movies");
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.pagination).toBeDefined();
    });

    it("should support pagination query params", async () => {
      const res = await api.get("/movies?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(5);
    });

    it("should filter movies by genre", async () => {
      const res = await api.get("/movies?genre=Action");
      expect(res.status).toBe(200);
    });

    it("should filter featured movies", async () => {
      const res = await api.get("/movies?featured=true");
      expect(res.status).toBe(200);
    });

    it("should NOT expose videoKey in list response (security)", async () => {
      const res = await api.get("/movies");
      expect(res.status).toBe(200);
      res.data.data.forEach((movie: any) => {
        expect(movie.videoKey).toBeUndefined();
      });
    });
  });

  describe("POST /movies (Admin)", () => {
    it("should create a movie as admin", async () => {
      const res = await api.post("/movies", TEST_MOVIE, {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.title).toBe(TEST_MOVIE.title);
      state.movieId = res.data.data._id;
    });

    it("should fail to create movie without auth", async () => {
      const res = await api.post("/movies", TEST_MOVIE);
      expect(res.status).toBe(401);
    });

    it("should fail to create movie as regular user (403)", async () => {
      const res = await api.post("/movies", TEST_MOVIE, {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should fail to create movie without poster", async () => {
      const { poster, ...noPosters } = TEST_MOVIE;
      const res = await api.post("/movies", noPosters, {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(400);
    });

    it("should fail to create movie without videoKey", async () => {
      const { videoKey, ...noVideo } = TEST_MOVIE;
      const res = await api.post("/movies", noVideo, {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(400);
    });

    it("should fail to create movie with invalid genre", async () => {
      const res = await api.post(
        "/movies",
        { ...TEST_MOVIE, genre: "InvalidGenre" },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /movies/:id", () => {
    it("should return movie details (public)", async () => {
      if (!state.movieId) return;
      const res = await api.get(`/movies/${state.movieId}`);
      expect(res.status).toBe(200);
      expect(res.data.data._id).toBe(state.movieId);
    });

    it("should NOT expose videoKey in single movie response (security)", async () => {
      if (!state.movieId) return;
      const res = await api.get(`/movies/${state.movieId}`);
      expect(res.data.data.videoKey).toBeUndefined();
    });

    it("should return 404 for non-existent movie ID", async () => {
      const res = await api.get("/movies/000000000000000000000000");
      expect(res.status).toBe(404);
    });

    it("should return 400/500 for malformed movie ID", async () => {
      const res = await api.get("/movies/notanid");
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("PUT /movies/:id (Admin)", () => {
    it("should update movie details as admin", async () => {
      if (!state.movieId) return;
      const res = await api.put(
        `/movies/${state.movieId}`,
        { price: 149, expiryDays: 60 },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect(res.status).toBe(200);
      expect(res.data.data.price).toBe(149);
    });

    it("should fail to update without auth", async () => {
      if (!state.movieId) return;
      const res = await api.put(`/movies/${state.movieId}`, { price: 0 });
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /movies/:id/toggle (Admin)", () => {
    it("should toggle movie active status", async () => {
      if (!state.movieId) return;
      const res = await api.patch(`/movies/${state.movieId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(200);
    });

    it("should fail to toggle without admin auth", async () => {
      if (!state.movieId) return;
      const res = await api.patch(`/movies/${state.movieId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
    });
  });
});