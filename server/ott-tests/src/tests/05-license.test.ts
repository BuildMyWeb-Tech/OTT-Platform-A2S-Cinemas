import axios from "axios";
import { state, BASE_URL } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("🔑 License API", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("GET /license/check/:movieId", () => {
    it("should return hasAccess:false when no license exists", async () => {
      const res = await api.get("/license/check/000000000000000000000001", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.hasAccess).toBe(false);
    });

    it("should fail to check license without auth", async () => {
      const res = await api.get("/license/check/000000000000000000000001");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /license/my", () => {
    it("should return user license list", async () => {
      const res = await api.get("/license/my", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it("should fail without auth", async () => {
      const res = await api.get("/license/my");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /license/all (Admin)", () => {
    it("should return paginated licenses as admin", async () => {
      const res = await api.get("/license/all", {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it("should deny regular user (403)", async () => {
      const res = await api.get("/license/all", {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should fail without auth", async () => {
      const res = await api.get("/license/all");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /license/:id/extend (Admin)", () => {
    it("should fail with invalid days value", async () => {
      const res = await api.patch(
        "/license/000000000000000000000001/extend",
        { days: -5 },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect([400, 404]).toContain(res.status);
    });

    it("should fail without admin auth", async () => {
      const res = await api.patch(
        "/license/000000000000000000000001/extend",
        { days: 10 },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(403);
    });

    it("should fail for non-existent license", async () => {
      const res = await api.patch(
        "/license/000000000000000000000000/extend",
        { days: 10 },
        { headers: { Authorization: `Bearer ${state.adminToken}` } }
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /license/:id/revoke (Admin)", () => {
    it("should fail as regular user (403)", async () => {
      const res = await api.patch("/license/000000000000000000000001/revoke", {}, {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("should fail without auth", async () => {
      const res = await api.patch("/license/fakeid/revoke", {});
      expect(res.status).toBe(401);
    });

    it("should fail for non-existent license", async () => {
      const res = await api.patch("/license/000000000000000000000000/revoke", {}, {
        headers: { Authorization: `Bearer ${state.adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });
});