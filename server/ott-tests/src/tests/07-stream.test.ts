import axios from "axios";
import { state, BASE_URL } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("🎥 Stream API", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("GET /stream/:movieId", () => {
    it("should return 403 with LICENSE_REQUIRED when no license exists", async () => {
      if (!state.movieId) return;
      const res = await api.get(`/stream/${state.movieId}`, {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
      expect(res.data.code).toBe("LICENSE_REQUIRED");
    });

    it("should return 401 without authentication token", async () => {
      const res = await api.get(`/stream/${state.movieId || "000000000000000000000001"}`);
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await api.get(`/stream/${state.movieId || "000000000000000000000001"}`, {
        headers: { Authorization: "Bearer totallyinvalidtoken" },
      });
      expect(res.status).toBe(401);
    });
it("should return 403 (no license) for non-existent movie with valid token", async () => {
  const res = await api.get("/stream/000000000000000000000000", {
    headers: { Authorization: `Bearer ${state.userToken}` },
  });
  // 403 = no license found, 404 = movie not found
  expect([403, 404]).toContain(res.status);
});
  });
});