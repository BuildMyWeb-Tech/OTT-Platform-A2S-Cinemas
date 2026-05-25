import * as http from "http";
import axios from "axios";
import { state, BASE_URL } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

const BASE_HEALTH = BASE_URL.replace("/api", "");

describe("👑 Admin API", () => {
  beforeAll(async () => {
    await setupTokens();
  });

  afterAll(async () => {
    // Prevent TCPWRAP open handle warning
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe("GET /admin/stats", () => {
    it("should return dashboard stats as admin", async () => {
      const res = await api.get("/admin/stats", {
        headers: {
          Authorization: `Bearer ${state.adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty("totalUsers");
      expect(res.data.data).toHaveProperty("totalMovies");
      expect(res.data.data).toHaveProperty("totalRevenue");
    });

    it("should deny regular user (403)", async () => {
      const res = await api.get("/admin/stats", {
        headers: {
          Authorization: `Bearer ${state.userToken}`,
        },
      });

      expect(res.status).toBe(403);
    });

    it("should fail without authentication (401)", async () => {
      const res = await api.get("/admin/stats");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /admin/users", () => {
    it("should return user list as admin", async () => {
      const res = await api.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${state.adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);

      res.data.data.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });

    it("should fail without auth", async () => {
      const res = await api.get("/admin/users");

      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /admin/users/:id/block", () => {
    it("should fail without admin auth", async () => {
      const res = await api.patch(
        `/admin/users/${state.userId}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${state.userToken}`,
          },
        }
      );

      expect(res.status).toBe(403);
    });

    it("should fail for non-existent user", async () => {
      const res = await api.patch(
        "/admin/users/000000000000000000000000/block",
        {},
        {
          headers: {
            Authorization: `Bearer ${state.adminToken}`,
          },
        }
      );

      expect(res.status).toBe(404);
    });

    it("should block user as admin", async () => {
      if (!state.userId) return;

      const res = await api.patch(
        `/admin/users/${state.userId}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${state.adminToken}`,
          },
        }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.isBlocked).toBe(true);
    });
  });

  describe("PATCH /admin/users/:id/unblock", () => {
    it("should fail without admin auth", async () => {
      const res = await api.patch(
        `/admin/users/${state.userId}/unblock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${state.userToken}`,
          },
        }
      );

      expect([401, 403]).toContain(res.status);
    });

    it("should unblock user as admin", async () => {
      if (!state.userId) return;

      const res = await api.patch(
        `/admin/users/${state.userId}/unblock`,
        {},
        {
          headers: {
            Authorization: `Bearer ${state.adminToken}`,
          },
        }
      );

      expect(res.status).toBe(200);
      expect(res.data.data.isBlocked).toBe(false);
    });
  });

describe("Health Check", () => {
  it("should return healthy status from /health endpoint", async () => {
    const res = await api.get(`${BASE_HEALTH}/health`);

    expect(res.status).toBe(200);
    expect(res.data.status).toMatch(/running/i);
  });
});
});