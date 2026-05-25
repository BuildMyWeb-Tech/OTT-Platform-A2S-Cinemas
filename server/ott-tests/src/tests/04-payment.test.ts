import axios from "axios";
import crypto from "crypto";
import { state, BASE_URL } from "../helpers/testState";
import { setupTokens } from "../helpers/globalSetup";

const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

describe("💳 Payment API (Razorpay)", () => {
  beforeAll(async () => {
    await setupTokens();
  });
  describe("POST /payment/create-order", () => {
    it("should create Razorpay order for a valid movie", async () => {
      if (!state.movieId) {
        console.warn("⚠️  No movieId — skipping. Run after movie creation.");
        return;
      }
      const res = await api.post(
        "/payment/create-order",
        { movieId: state.movieId },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.orderId).toBeDefined();
      expect(res.data.data.currency).toBe("INR");
      state.razorpayOrderId = res.data.data.orderId;
    });

    it("should fail without authentication", async () => {
      const res = await api.post("/payment/create-order", { movieId: state.movieId || "fakeid" });
      expect(res.status).toBe(401);
    });

    it("should fail when movieId is missing", async () => {
      const res = await api.post("/payment/create-order", {}, {
        headers: { Authorization: `Bearer ${state.userToken}` },
      });
      expect(res.status).toBe(400);
    });

    it("should fail for a non-existent movieId", async () => {
      const res = await api.post(
        "/payment/create-order",
        { movieId: "000000000000000000000000" },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(404);
    });
  });

  describe("POST /payment/verify", () => {
    it("should fail with invalid HMAC signature (security test)", async () => {
      const res = await api.post(
        "/payment/verify",
        {
          razorpay_order_id: state.razorpayOrderId || "order_faketest123",
          razorpay_payment_id: "pay_faketest456",
          razorpay_signature: "thisisaninvalidsignature",
        },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(400);
      expect(res.data.message).toMatch(/invalid.*signature/i);
    });

    it("should fail with missing razorpay_payment_id", async () => {
      const res = await api.post(
        "/payment/verify",
        { razorpay_order_id: "order_test", razorpay_signature: "sig_test" },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect(res.status).toBe(400);
    });

    it("should fail without authentication", async () => {
      const res = await api.post("/payment/verify", {
        razorpay_order_id: "order_test",
        razorpay_payment_id: "pay_test",
        razorpay_signature: "sig_test",
      });
      expect(res.status).toBe(401);
    });

    it("should fail for unknown order ID even with valid signature format", async () => {
      const fakeOrderId = "order_unknownxyz123";
      const fakePaymentId = "pay_unknownxyz456";
      const secret = process.env.RAZORPAY_KEY_SECRET || "testsecret";
      const sig = crypto.createHmac("sha256", secret).update(fakeOrderId + "|" + fakePaymentId).digest("hex");
      const res = await api.post(
        "/payment/verify",
        { razorpay_order_id: fakeOrderId, razorpay_payment_id: fakePaymentId, razorpay_signature: sig },
        { headers: { Authorization: `Bearer ${state.userToken}` } }
      );
      expect([400, 404]).toContain(res.status);
    });
  });
});