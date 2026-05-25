import axios from "axios";
import { state, BASE_URL } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("🧾 Purchases API", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("GET /purchases/my", () => {
    it("should return user purchase history", async () => {
      const res = await api.get("/purchases/my", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it("should fail without authentication", async () => {
      const res = await api.get("/purchases/my");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /purchases/:id", () => {
    it("should return 404 for non-existent purchase", async () => {
      const res = await api.get("/purchases/000000000000000000000000", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(404);
    });

    it("should fail without auth", async () => {
      const res = await api.get("/purchases/000000000000000000000000");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /purchases/admin/all (Admin)", () => {
    it("should return all purchases as admin", async () => {
      const res = await api.get("/purchases/admin/all", {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it("should filter by status=active", async () => {
      const res = await api.get("/purchases/admin/all?status=active", {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(200);
    });

    it("should deny regular user (403)", async () => {
      const res = await api.get("/purchases/admin/all", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should fail without authentication", async () => {
      const res = await api.get("/purchases/admin/all");
      expect(res.status).toBe(401);
    });
  });
});