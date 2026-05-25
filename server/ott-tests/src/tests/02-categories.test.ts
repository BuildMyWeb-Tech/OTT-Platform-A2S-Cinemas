import axios from "axios";
import { setupTokens } from "../helpers/globalSetup";
import { state, BASE_URL, TEST_CATEGORY, saveState } from "../helpers/testState";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("🎭 Categories API", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("GET /categories", () => {
    it("should return all categories (public, no auth required)", async () => {
      const res = await api.get("/categories");
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });
  });

  describe("POST /categories", () => {
  it("should create a category as admin", async () => {
  const res = await api.post("/categories", TEST_CATEGORY, {
    headers: { Authorization: `Bearer ${state.adminToken}` },
  });
  // 201 = created, 400 = already exists (second run)
  expect([201, 400]).toContain(res.status);
  if (res.status === 201) {
    state.categoryId = res.data.data._id;
    saveState();
  }
});

    it("should fail to create category without authentication", async () => {
      const res = await api.post("/categories", { name: "UnauthorizedCat" });
      expect(res.status).toBe(401);
      expect(res.data.success).toBe(false);
    });

    it("should fail to create category as regular user (403)", async () => {
      const res = await api.post(
        "/categories",
        { name: "UserCatAttempt" },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(403);
      expect(res.data.success).toBe(false);
    });

    it("should fail to create category with missing name", async () => {
      const res = await api.post(
        "/categories",
        { description: "No name provided" },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /categories/:id", () => {
    it("should update category as admin", async () => {
      if (!state.categoryId) return;
      const res = await api.put(
        `/categories/${state.categoryId}`,
        { name: TEST_CATEGORY.name, description: "Updated description" },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it("should fail to update category without auth", async () => {
      if (!state.categoryId) return;
      const res = await api.put(`/categories/${state.categoryId}`, { name: "Hack" });
      expect(res.status).toBe(401);
    });
  });
});